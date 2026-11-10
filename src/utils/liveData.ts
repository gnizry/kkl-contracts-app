import { LAYER_TITLES } from '../config';
import { loadSdk, esriRequire } from '../esriSdk';
import { Attr, buildPopupModel, cleanGid, isLicRelevant, PopupModel, safe, cleanFHP, extractDate } from './popupModel';

export interface LiveLayers {
  tender: any;
  manot?: any; stands?: any; certs?: any; remLics?: any; cutLics?: any; logs?: any;
}

/** מאתר את שכבת ההתקשרויות (עם שדה STStageStatus) ואת הטבלאות/שכבות הנלוות לפי שם */
export async function discoverLayers(map: any): Promise<LiveLayers> {
  const all: any[] = [...map.allLayers.toArray(), ...(map.allTables ? map.allTables.toArray() : [])];
  await Promise.all(all.map((l) => (l.load ? l.load().catch(() => null) : null)));
  const byTitle = (t: string) => all.find((l) => l.title === t && l.queryFeatures) || all.find((l) => (l.title || '').includes(t) && l.queryFeatures);
  const tender = all.find((l) => l.type === 'feature' && l.fields?.some((f: any) => f.name === 'STStageStatus'));
  if (!tender) throw new Error('לא נמצאה במפה שכבת התקשרויות (עם השדה STStageStatus).');
  return {
    tender,
    manot: byTitle(LAYER_TITLES.manot), stands: byTitle(LAYER_TITLES.stands), certs: byTitle(LAYER_TITLES.certs),
    remLics: byTitle(LAYER_TITLES.remLics), cutLics: byTitle(LAYER_TITLES.cutLics), logs: byTitle(LAYER_TITLES.logs),
  };
}

const q = async (layer: any, where: string, extra: Record<string, any> = {}): Promise<Attr[]> => {
  if (!layer) return [];
  const res = await layer.queryFeatures({ where, outFields: ['*'], returnGeometry: false, ...extra });
  return res.features.map((f: any) => f.attributes);
};
const esc = (s: string) => String(s).replace(/'/g, "''");
const chunk = <T,>(a: T[], n: number): T[][] => { const o: T[][] = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };
const inList = (ids: string[]) => ids.map((i) => `'${esc(i)}'`).join(',');

export async function listTenders(tender: any): Promise<Attr[]> {
  const res = await tender.queryFeatures({ where: '1=1', outFields: ['*'], returnGeometry: false, num: 5000 });
  return res.features.map((f: any) => f.attributes);
}

/** פורט של שלבי השליפה בפופאפ ה-Arcade, כולל קישור רישיונות כריתה לפי FHP */
export async function fetchPopupModel(L: LiveLayers, tender: Attr): Promise<PopupModel> {
  const gid = cleanGid(tender.GlobalID);
  const gidWhere = (f: string) => `${f} = '${gid}' OR ${f} = '{${gid}}'`;

  const [manot, stands, certs, logs] = await Promise.all([
    q(L.manot, gidWhere('SubWorkUnitParentGlobalID')),
    q(L.stands, gidWhere('StandSubTenderGID')),
    q(L.certs, gidWhere('SubTenderGlobalID')),
    q(L.logs, gidWhere('SubTenderGlobalID'), { orderByFields: ['Date DESC'], num: 400 }).catch(() => q(L.logs, gidWhere('SubTenderGlobalID'))),
  ]);

  // FHPs של ההתקשרות
  const fhps = new Set<string>();
  safe(tender.STFHPs, '').split(',').forEach((x) => { const c = cleanFHP(x); if (c) fhps.add(c); });
  stands.forEach((s) => { const f = cleanFHP(safe(s.FHP, '') || safe(s.F_H_P, '')); if (f) fhps.add(f); });

  // רישיונות כריתה לפי FHP
  const cutIds = new Set<string>();
  if (L.cutLics && fhps.size) {
    for (const part of chunk([...fhps], 20)) {
      const rows = await q(L.cutLics, part.map((f) => `FHP LIKE '%${esc(f)}%'`).join(' OR '));
      rows.forEach((c) => {
        if (!isLicRelevant(c)) return;
        const arr = (safe(c.FHP, '') || safe(c.F_H_P, '')).split(',');
        if (arr.some((x) => fhps.has(cleanFHP(x)))) { const id = safe(c.License_Id, ''); if (id && id !== '-') cutIds.add(id); }
      });
    }
  }
  certs.forEach((c) => { const id = safe(c.ClearingLicenseId, ''); if (id && id !== '-') cutIds.add(id); });

  // רישיונות נטילה לפי הורים + לפי תעודות
  const remIds = new Set<string>();
  if (L.remLics && cutIds.size) {
    for (const part of chunk([...cutIds], 100)) {
      const rows = await q(L.remLics, `Original_License_Id IN (${inList(part)})`);
      rows.forEach((r) => { if (isLicRelevant(r)) { const id = safe(r.License_Id, ''); if (id) remIds.add(id); } });
    }
  }
  certs.forEach((c) => {
    if (safe(c.Status, '').trim() !== 'מאושר') return;
    [safe(c.RemovingLicenseId, ''), safe(c.RemovingLicenseId2, '')].forEach((id) => { if (id && id !== '-') remIds.add(id); });
  });

  let rems: Attr[] = [];
  const licCerts: Attr[] = [];
  if (L.remLics && remIds.size) {
    for (const part of chunk([...remIds], 100)) {
      rems = rems.concat(await q(L.remLics, `License_Id IN (${inList(part)})`));
      if (L.certs) licCerts.push(...(await q(L.certs, `(RemovingLicenseId IN (${inList(part)}) OR RemovingLicenseId2 IN (${inList(part)})) AND Status = 'מאושר'`)));
    }
    rems.forEach((r) => { const p = safe(r.Original_License_Id, ''); if (p && p !== '-') cutIds.add(p); });
  }
  let cuts: Attr[] = [];
  if (L.cutLics && cutIds.size) for (const part of chunk([...cutIds], 100)) cuts = cuts.concat(await q(L.cutLics, `License_Id IN (${inList(part)})`));

  return buildPopupModel({ tender, manot, stands, certs, licCerts, rems, cuts, logs });
}

export { extractDate };


// ---------- גישה ללא תצוגה (headless) לשכבות הפורטל, עם מטמון ----------
let _cache: { key: string; p: Promise<LiveLayers> } | null = null;
export function getLiveLayers(webMapId: string): Promise<LiveLayers> {
  if (_cache && _cache.key === webMapId) return _cache.p;
  const p = (async () => {
    await loadSdk();
    const [WebMap] = await esriRequire<[any]>(['esri/WebMap']);
    const map = new WebMap({ portalItem: { id: webMapId } });
    await map.load();
    await map.loadAll().catch(() => null);
    return discoverLayers(map);
  })();
  _cache = { key: webMapId, p };
  p.catch(() => { if (_cache?.p === p) _cache = null; });
  return p;
}
export const clearLiveCache = () => { _cache = null; };

/** מחפש התקשרויות חיות לפי שם (התאמה מדויקת, ואם אין – הכלה) */
export async function findTendersByName(L: LiveLayers, names: string[]): Promise<Attr[]> {
  const list = Array.from(new Set(names.map((n) => (n || '').trim()).filter(Boolean)));
  if (!list.length) return [];
  const exact = await q(L.tender, `SubTenderName IN (${inList(list)})`);
  if (exact.length) return exact;
  if (list.length === 1 && list[0].length >= 6) return (await q(L.tender, `SubTenderName LIKE '%${esc(list[0])}%'`)).slice(0, 5);
  return [];
}
