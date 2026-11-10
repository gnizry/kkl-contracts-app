/**
 * מודל "כרטיס התקשרות" – מיישם את הלוגיקה של פופאפ ה-Arcade של קק"ל (SubTenders):
 *  - עומדים לפי מנות, שטחים וסטטוסים
 *  - ציר סטטוס עם תאריכים ומשך
 *  - רישיונות כריתה → נטילה מקוננים, מצב (בתוקף / מוצה / לא בתוקף), יתרה, חריגה והתראת 40 מ"ק
 *  - תעודות משלוח עם יתרה מתגלגלת לפי רישיון
 *  - יומני עבודה (עובדים, ציוד, אירועים, הפרות)
 * הבניה היא פונקציה טהורה (קלט: רשומות ממאפיינים של השכבות) כדי שתהיה ניתנת לבדיקה.
 */
import { Contract } from '../types/forestry';
import { EXB_APP_ID, EXB_DETAILS_DS_ID, SURVEY_ITEM_ID } from '../config';

export type Attr = Record<string, any>;
export type LicState = 'valid' | 'exhausted' | 'invalid';

export interface PStand { label: string; status: string; area: number; action: string }
export interface PMano { id: string; order: string; status: string; area: number; stands: PStand[] }
export interface PRem {
  id: string; num: string; state: LicState; from: string; to: string;
  approved: number; used: number; balance: number; usedByMana: Record<string, number>;
}
export interface PCut { id: string; num: string; state: LicState; from: string; to: string; rems: PRem[] }
export interface PCertBlock { num: string; qty: number; state: LicState; rolling: number; current: number }
export interface PCert {
  id: string; status: string; date: string; qty: number; mana: string; stands: string;
  blocks: PCertBlock[]; shared: boolean; extra: Record<string, string>; comments: string;
}
export interface PLog {
  id: string; status: string; date: string; start: string; end: string; workType: string; contractor: string;
  onSite: boolean | null; stands: string; mana: string; summary: string; condition: string; supervisorComments: string;
  events: string[]; violations: string[]; workers: string[]; equipment: string[]; hours: number; supervisor: string; workManager: string;
}
export interface PStep { name: string; color: string; date: string; days: number | null; active: boolean; current: boolean }
export interface PopupModel {
  gid: string; objectId: number; name: string; status: string;
  region: string; gush: string; forests: string; year: string; areaDunam: number; workType: string;
  contractor: string; subContractor: string; workManager: string;
  stopped: { date: string; reason: string } | null;
  steps: PStep[]; cancelled: boolean;
  doneArea: number; execPct: number;
  groups: { status: string; count: number; area: number; pct: number }[];
  actions: { name: string; count: number }[];
  manot: PMano[];
  cuts: PCut[]; orphanRems: PRem[];
  totalActiveBalance: number; overdrafts: { num: string; bal: number }[]; hasActiveStands: boolean; activeStandsList: string[];
  certs: PCert[]; certsVolume: number;
  logs: PLog[]; hasMoreLogs: boolean;
  reportUrl: string; surveyLink: string;
}

// ---------------- helpers (פורט של פונקציות העזר מה-Arcade) ----------------
export const safe = (v: any, d = ''): string => {
  if (v === null || v === undefined) return d;
  const t = String(v);
  return t === '' || t === 'null' || t === 'undefined' ? d : t;
};
export const safeNum = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  const s = String(v).trim();
  if (!s || s === 'null' || s === '-') return 0;
  const n = Number(s);
  return isNaN(n) ? 0 : n;
};
export const cleanGid = (v: any) => String(v ?? '').replace(/[{}]/g, '').toUpperCase();
export const cleanFHP = (v: any) => {
  const s = safe(v, '').trim();
  if (s === 'NaN') return '';
  return s.split('.')[0].trim();
};
export const toDate = (d: any): Date | null => {
  if (d === null || d === undefined || d === '' || d === '-' || d === 'null') return null;
  if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
  if (typeof d === 'number') return new Date(d);
  const x = new Date(String(d).replace(' ', 'T'));
  return isNaN(x.getTime()) ? null : x;
};
export const extractDate = (rec: Attr | null, fields: string[]): Date | null => {
  if (!rec) return null;
  for (const f of fields) if (f in rec) { const d = toDate(rec[f]); if (d) return d; }
  return null;
};
const p2 = (n: number) => String(n).padStart(2, '0');
export const fmtDate = (d: Date | null, short = false) => (d ? `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${short ? String(d.getFullYear()).slice(2) : d.getFullYear()}` : '-');
export const extractTime = (rec: Attr, fields: string[]): string => {
  for (const f of fields) {
    if (!(f in rec)) continue;
    const v = rec[f];
    if (v === null || v === undefined || v === '') continue;
    if (typeof v === 'number' || v instanceof Date) { const d = toDate(v)!; return `${p2(d.getHours())}:${p2(d.getMinutes())}`; }
    const s = String(v).trim();
    if (!s || s === 'null' || s === '-') continue;
    const part = s.split(' ').find((x) => x.includes(':'));
    if (part) { const [h, m] = part.split(':'); return `${h.padStart(2, '0')}:${m.slice(0, 2)}`; }
    const d = toDate(s); if (d) return `${p2(d.getHours())}:${p2(d.getMinutes())}`;
  }
  return '--:--';
};
const yes = (v: any) => ['y', 'yes', 'כן', '1', 'true'].includes(String(v ?? '').toLowerCase());

export const getStatusGroupKey = (s: string) => {
  s = s.trim();
  if (s === 'בתכנון') return 'בתכנון';
  if (['לפני ביצוע', 'אושר לביצוע'].includes(s)) return 'לפני ביצוע';
  if (['בביצוע', 'פעיל', 'פתוח', 'חריגה'].includes(s)) return 'בביצוע';
  if (['הפסקת עבודה', 'הופסק'].includes(s)) return 'הפסקת עבודה';
  if (['בוצע', 'סיום', 'מאושר', 'הסתיים', 'סגור', 'סגור מערכת'].includes(s)) return 'בוצע';
  if (['ביטול', 'מבוטל'].includes(s)) return 'ביטול';
  return 'אחר';
};
export const KKL_STATUS_COLORS: Record<string, { main: string; light: string; text: string }> = {
  'בתכנון': { main: '#149ece', light: '#E0F2FE', text: '#FFFFFF' },
  'לפני ביצוע': { main: '#fc921f', light: '#FFEDD5', text: '#FFFFFF' },
  'בביצוע': { main: '#ffde3e', light: '#FEF9C3', text: '#1E293B' },
  'הפסקת עבודה': { main: '#ed5151', light: '#FEE2E2', text: '#FFFFFF' },
  'בוצע': { main: '#a7c636', light: '#ECFCCB', text: '#1E293B' },
  'ביטול': { main: '#f789d8', light: '#FCE7F3', text: '#1E293B' },
  'אחר': { main: '#64748B', light: '#F8FAFC', text: '#FFFFFF' },
};
export const statusColors = (s: string) => KKL_STATUS_COLORS[getStatusGroupKey(s)] || KKL_STATUS_COLORS['אחר'];

const PLAN = ['PlanDate', 'PlanningDate', 'StandPlanDate', 'SWUPlanDate', 'CreationDate', 'Created_Date', 'DatePlanned'];
const BEFORE = ['DateBeforeWork', 'BeforeExecDate', 'BeforeExecutionDate', 'ApprovedDate', 'ApprovalDate', 'StandApprovedDate', 'StandBeforeExecDate', 'SWUApprovedDate', 'SWUBeforeExecDate', 'DateApproved'];
const INEXEC = ['DateWorkStarted', 'DateInProgress', 'InExecDate', 'InExecutionDate', 'ExecStartDate', 'ExecutionStartDate', 'StartDate', 'StandInExecDate', 'StandExecStartDate', 'SWUInExecDate', 'SWUExecStartDate', 'DateStarted'];
const DONE = ['DateWorkCompleted', 'DateWorkApproved', 'DateApproval', 'DateWorkDone', 'DoneDate', 'ExecutionEndDate', 'ExecEndDate', 'CompletionDate', 'EndDate', 'StandDoneDate', 'StandCompletionDate', 'SWUDoneDate', 'SWUExecEndDate', 'DateDone', 'DateCompleted'];

export const isLicRelevant = (f: Attr) => {
  if (['Y', 'YES', 'כן', '1'].includes(safe(f.Valid, '').toUpperCase())) return true;
  const d = extractDate(f, ['To_Date', 'ToDate']);
  return !!d && d.getFullYear() >= 2026;
};

export interface RawInputs {
  tender: Attr;
  manot: Attr[];
  stands: Attr[];
  certs: Attr[];      // תעודות לפי SubTenderGlobalID
  licCerts: Attr[];   // כל התעודות המאושרות של רישיונות הנטילה (לחישוב יתרה מתגלגלת)
  rems: Attr[];       // רישיונות נטילה (לפי License_Id)
  cuts: Attr[];       // רישיונות כריתה (לפי License_Id)
  logs: Attr[];
  now?: number;
}

export const buildReportUrl = (objectId: number) =>
  `https://experience.arcgis.com/experience/${EXB_APP_ID}?locale=he&print_preview=true&data_filter=${EXB_DETAILS_DS_ID}:OBJECTID=${objectId}`;
export const buildSurveyLink = (gid: string) =>
  `arcgis-survey123://?itemID=${SURVEY_ITEM_ID}&action=edit&update=true&q:globalId=${encodeURIComponent(gid.toLowerCase())}`;

// ---------------- הבנייה ----------------
export function buildPopupModel(raw: RawInputs): PopupModel {
  const now = raw.now ?? Date.now();
  const t = raw.tender;
  const gid = cleanGid(t.GlobalID);
  const status = safe(t.STStageStatus, 'בתכנון').trim();
  const areaTotal = safeNum(t.STAreaDunam);

  const contractor = safe(t.STSelectedContractorInternal, '') || safe(t.STSelectedContractor, '') || '-';
  const stStop = extractDate(t, ['STDateWorkStopped']);
  const stReason = safe(t.STReasonWorkStopped, '');
  const isStopped = status === 'הפסקת עבודה' || status === 'הופסק' || !!stStop || stReason !== '';

  // FHPs של ההתקשרות
  const tenderFhps = new Set<string>();
  safe(t.STFHPs, '').split(',').forEach((x) => { const c = cleanFHP(x); if (c) tenderFhps.add(c); });

  // מנות
  const manot: Record<string, PMano> = {};
  const manotOrder: string[] = [];
  [...raw.manot].sort((a, b) => safeNum(a.SWUExecutionOrder) - safeNum(b.SWUExecutionOrder)).forEach((m) => {
    const id = cleanGid(m.GlobalID);
    manotOrder.push(id);
    manot[id] = { id, order: safe(m.SWUExecutionOrder, "ללא מס'"), status: safe(m.SWUStatus, '-'), area: 0, stands: [] };
  });
  manot['UNKNOWN'] = { id: 'UNKNOWN', order: 'ללא שיוך', status: '-', area: 0, stands: [] };
  manotOrder.push('UNKNOWN');

  // עומדים
  const fhpToStand: Record<string, string> = {};
  const gArea: Record<string, number> = {}, gCount: Record<string, number> = {};
  const actionCounts: Record<string, number> = {};
  let minPlan = extractDate(t, PLAN), minBefore = extractDate(t, BEFORE), minIn = extractDate(t, INEXEC), maxDone = extractDate(t, DONE);
  raw.stands.forEach((s) => {
    const helka = safe(s.StandHELKA, '');
    const num = safe(s.STAND, '');
    const label = helka && helka !== '-' ? `${helka}/${num}` : num;
    const rawF = safe(s.FHP, '') || safe(s.F_H_P, '');
    if (rawF) { const f = cleanFHP(rawF); fhpToStand[f] = label; tenderFhps.add(f); }
    const area = safeNum(s.EstimatedWorkAreaDunam);
    const st = safe(s.StandStatus, 'אחר');
    const g = getStatusGroupKey(st);
    gArea[g] = (gArea[g] || 0) + area; gCount[g] = (gCount[g] || 0) + 1;
    let pid = 'UNKNOWN';
    if (s.ManaParentGlobalID) { const v = cleanGid(s.ManaParentGlobalID); if (v && v !== 'NULL') pid = v; }
    if (!manot[pid]) pid = 'UNKNOWN';
    const action = safe(s.StandWorkType, '-');
    manot[pid].area += area;
    manot[pid].stands.push({ label, status: st, area, action });
    const an = action === '-' || action === '' ? 'לא הוגדרה פעולה' : action;
    actionCounts[an] = (actionCounts[an] || 0) + 1;
    const dPlan = extractDate(s, PLAN), dB = extractDate(s, BEFORE), dI = extractDate(s, INEXEC), dD = extractDate(s, DONE);
    if (dPlan && (!minPlan || dPlan < minPlan)) minPlan = dPlan;
    if (dB && (!minBefore || dB < minBefore)) minBefore = dB;
    if (dI && (!minIn || dI < minIn)) minIn = dI;
    if (dD && (!maxDone || dD > maxDone)) maxDone = dD;
  });
  const standsCount = raw.stands.length;
  const translateF = (arr: string[]) => arr.map((f) => fhpToStand[f] || f).join(', ');
  const manaOrderOf = (rawGid: any) => { const g = cleanGid(rawGid); return manot[g] ? manot[g].order : 'לא משויכת'; };

  // ציר סטטוס
  const cancelled = status === 'ביטול' || status === 'מבוטל';
  const stepsDef = [
    { name: 'בתכנון', match: ['בתכנון'], color: '#149ece', d: minPlan },
    { name: 'אושר לביצוע', match: ['לפני ביצוע', 'אושר לביצוע'], color: '#fc921f', d: minBefore },
    { name: 'בביצוע', match: ['בביצוע', 'פעיל', 'פתוח'], color: '#ffde3e', d: minIn },
  ] as { name: string; match: string[]; color: string; d: Date | null }[];
  if (isStopped) stepsDef.push({ name: 'הפסקת עבודה', match: ['הפסקת עבודה', 'הופסק'], color: '#ed5151', d: stStop });
  stepsDef.push({ name: 'הסתיים', match: ['בוצע', 'מאושר', 'סיום', 'הסתיים', 'סגור', 'סגור מערכת'], color: '#a7c636', d: maxDone });
  let cur = 0;
  stepsDef.forEach((s, i) => { if (s.match.includes(status)) cur = i; });
  if (cancelled) cur = stepsDef.length - 1;
  const steps: PStep[] = stepsDef.map((s, i) => {
    const active = i <= cur;
    const current = i === cur && !cancelled;
    let days: number | null = null;
    if (s.d) {
      if (i < cur && !cancelled) {
        const nx = stepsDef.slice(i + 1).find((x) => x.d);
        if (nx?.d) days = Math.max(0, Math.floor((nx.d.getTime() - s.d.getTime()) / 86400000));
        if (s.name === 'בביצוע' && maxDone) days = Math.max(0, Math.floor((maxDone.getTime() - s.d.getTime()) / 86400000));
      } else if (current && s.name !== 'הסתיים') days = Math.max(0, Math.floor((now - s.d.getTime()) / 86400000));
    }
    const hide = (s.name === 'הסתיים') && !active;
    return { name: cancelled && i === stepsDef.length - 1 ? status : s.name, color: cancelled && i === stepsDef.length - 1 ? '#f789d8' : s.color, date: s.d && !hide ? fmtDate(s.d, true) : '', days, active, current };
  });

  // תעודות: התאמה לפי FHP
  const sortedCerts = [...raw.certs].sort((a, b) => (toDate(b.IssueDate)?.getTime() || 0) - (toDate(a.IssueDate)?.getTime() || 0));
  const validCerts: { rec: Attr; fhps: string[] }[] = [];
  const usageByMana: Record<string, Record<string, number>> = {};
  const certCutIds = new Set<string>(), certRemIds = new Set<string>();
  const cutNum: Record<string, string> = {}, remNum: Record<string, string> = {};
  const qtySplit = (c: Attr) => {
    const total = safeNum(c.ShippingQuantity);
    const q2 = safeNum(c.ShipQty2);
    let q1 = total - q2;
    if (c.ShipQty1 !== null && c.ShipQty1 !== undefined && String(c.ShipQty1) !== 'null' && c.ShipQty1 !== '') q1 = safeNum(c.ShipQty1);
    return { q1, q2 };
  };
  sortedCerts.forEach((c) => {
    let fs = safe(c.FHP, '') || safe(c.OtherFHPs, '');
    const other = safe(c.OtherFHPs, '');
    if (other && other !== '-') fs += ',' + other;
    const arr: string[] = [];
    let match = false;
    fs.split(',').forEach((x) => { const f = cleanFHP(x); if (f) { if (!arr.includes(f)) arr.push(f); if (tenderFhps.has(f)) match = true; } });
    if (!match) return;
    validCerts.push({ rec: c, fhps: arr });
    if (safe(c.Status, '').trim() === 'מאושר') {
      const { q1, q2 } = qtySplit(c);
      const mana = manaOrderOf(c.SWUGlobalID);
      const cl = safe(c.ClearingLicenseId, '');
      if (cl && cl !== '-') { certCutIds.add(cl); cutNum[cl] = safe(c.ClearingLicenseNum, ''); }
      const r1 = safe(c.RemovingLicenseId, '');
      if (r1 && r1 !== '-') { certRemIds.add(r1); remNum[r1] = safe(c.RemovingLicenseNum, '-'); (usageByMana[r1] ||= {})[mana] = ((usageByMana[r1] || {})[mana] || 0) + q1; }
      const r2 = safe(c.RemovingLicenseId2, '');
      if (r2 && r2 !== '-' && q2 > 0) { certRemIds.add(r2); remNum[r2] = safe(c.RemovingLicenseNum2, '-'); (usageByMana[r2] ||= {})[mana] = ((usageByMana[r2] || {})[mana] || 0) + q2; }
    }
  });

  // רישיונות נטילה – נתונים מלאים
  const remData: Record<string, { qty: number; bal: number; valid: boolean; from: Date | null; to: Date | null; parent: string; num: string }> = {};
  raw.rems.forEach((a) => {
    const id = safe(a.License_Id, '');
    if (!id) return;
    remData[id] = {
      qty: safeNum(a.RemovingQuantityMQ), bal: safeNum(a.BalanceMQ), valid: yes(a.Valid),
      from: extractDate(a, ['FromDate', 'From_Date']), to: extractDate(a, ['ToDate', 'To_Date']),
      parent: safe(a.Original_License_Id, ''), num: safe(a.LicenseNumber, '') || remNum[id] || id,
    };
  });

  // יתרה מתגלגלת
  const running: Record<string, number> = {};
  const certBal: Record<string, { u1: number; u2: number }> = {};
  [...raw.licCerts].sort((a, b) => (toDate(a.IssueDate)?.getTime() || 0) - (toDate(b.IssueDate)?.getTime() || 0)).forEach((rc) => {
    const l1 = safe(rc.RemovingLicenseId, ''), l2 = safe(rc.RemovingLicenseId2, '');
    const { q1, q2 } = qtySplit(rc);
    if (l1 && l1 !== '-') running[l1] = (running[l1] || 0) + q1;
    if (l2 && l2 !== '-' && q2 > 0) running[l2] = (running[l2] || 0) + q2;
    certBal[String(rc.OBJECTID)] = { u1: running[l1] || 0, u2: running[l2] || 0 };
  });

  const licState = (valid: boolean, bal: number): LicState => (!valid ? 'invalid' : bal <= 0 ? 'exhausted' : 'valid');

  const certs: PCert[] = validCerts.map(({ rec, fhps }) => {
    const { q1, q2 } = qtySplit(rec);
    const status = safe(rec.Status, '').trim();
    const blocks: PCertBlock[] = [];
    if (status === 'מאושר') {
      const mk = (id: string, num: string, qty: number, second: boolean) => {
        if (!id || id === '-' || qty <= 0 || !remData[id]) return;
        const d = remData[id];
        const bal = certBal[String(rec.OBJECTID)];
        const used = bal ? (second ? bal.u2 : bal.u1) : 0;
        blocks.push({ num, qty, state: licState(d.valid, d.bal), rolling: d.qty - used, current: d.bal });
      };
      mk(safe(rec.RemovingLicenseId, ''), safe(rec.RemovingLicenseNum, '-'), q1, false);
      mk(safe(rec.RemovingLicenseId2, ''), safe(rec.RemovingLicenseNum2, '-'), q2, true);
    }
    const d = extractDate(rec, ['IssueDate']);
    const extra: Record<string, string> = {};
    ['IssuerName', 'OuputType', 'TreeSpeciesName', 'HelkaStand', 'ClearingLicenseNum', 'ContractorCell', 'ShippingCompany', 'DriverName', 'LicensePlate', 'Length', 'Width', 'Height', 'DensityFactor'].forEach((k) => { if (k in rec) extra[k] = safe(rec[k], '-'); });
    return {
      id: safe(rec.CertificateID, '-'), status, date: d ? `${fmtDate(d)} ${p2(d.getHours())}:${p2(d.getMinutes())}` : '-',
      qty: q1 + q2, mana: manaOrderOf(rec.SWUGlobalID), stands: translateF(fhps), blocks, shared: fhps.length > 1, extra, comments: safe(rec.Comments, ''),
    };
  });
  const certsVolume = certs.reduce((a, c) => a + c.qty, 0);

  // רישיונות כריתה (+ הורים של נטילה)
  const cutById: Record<string, Attr> = {};
  raw.cuts.forEach((c) => { const id = safe(c.License_Id, ''); if (id) cutById[id] = c; });
  const processed = new Set<string>();
  const remToModel = (id: string): PRem => {
    const d = remData[id];
    const used = d.qty - d.bal;
    return {
      id, num: d.num, state: licState(d.valid, d.bal), from: fmtDate(d.from), to: fmtDate(d.to),
      approved: d.qty, used, balance: d.bal, usedByMana: usageByMana[id] || {},
    };
  };
  const order = { valid: 0, exhausted: 1, invalid: 2 };
  const overdrafts: { num: string; bal: number }[] = [];
  let totalActiveBalance = 0;
  const cuts: PCut[] = [];
  Object.keys(cutById).forEach((cid) => {
    const c = cutById[cid];
    const kids: PRem[] = [];
    let childBal = 0;
    Object.keys(remData).forEach((rid) => {
      const d = remData[rid];
      if (d.parent !== cid || processed.has(rid)) return;
      processed.add(rid);
      if (d.bal < 0) overdrafts.push({ num: d.num, bal: d.bal });
      if (d.valid) { if (d.bal > 0) totalActiveBalance += d.bal; childBal += d.bal; }
      kids.push(remToModel(rid));
    });
    kids.sort((a, b) => order[a.state] - order[b.state]);
    const valid = yes(c.Valid);
    const state: LicState = !valid ? 'invalid' : kids.length > 0 && childBal <= 0 ? 'exhausted' : 'valid';
    cuts.push({
      id: cid, num: safe(c.LicenseNumber, '') || cutNum[cid] || cid, state,
      from: fmtDate(extractDate(c, ['From_Date', 'FromDate'])), to: fmtDate(extractDate(c, ['To_Date', 'ToDate'])), rems: kids,
    });
  });
  cuts.sort((a, b) => order[a.state] - order[b.state]);
  const orphanRems: PRem[] = [];
  Object.keys(remData).forEach((rid) => {
    if (processed.has(rid)) return;
    const d = remData[rid];
    if (d.bal < 0) overdrafts.push({ num: d.num, bal: d.bal });
    if (d.valid && d.bal > 0) totalActiveBalance += d.bal;
    orphanRems.push(remToModel(rid));
  });
  orphanRems.sort((a, b) => order[a.state] - order[b.state]);

  // עומדים בביצוע (להתראת יתרה)
  const activeStandsList: string[] = [];
  manotOrder.forEach((mid) => {
    manot[mid].stands.forEach((s) => {
      if (['בביצוע', 'פעיל', 'פתוח', 'חריגה'].includes(s.status)) activeStandsList.push(mid === 'UNKNOWN' ? `עומד ללא מנה: ${s.label}` : `מנה ${manot[mid].order} - עומד ${s.label}`);
    });
  });

  // יומנים
  const logsSorted = [...raw.logs].sort((a, b) => (toDate(b.Date ?? b.LogDate)?.getTime() || 0) - (toDate(a.Date ?? a.LogDate)?.getTime() || 0));
  const logs: PLog[] = [];
  let hasMoreLogs = false;
  for (const l of logsSorted) {
    if (logs.length >= 100) { hasMoreLogs = true; break; }
    const st = safe(l.LogStatus, '') || safe(l.Status, '');
    if (st === 'חדש') continue;
    const rf = safe(l.FHPs, '') || safe(l.F_H_P, '');
    if (!rf) continue;
    const fh: string[] = [];
    let match = false;
    rf.split(',').forEach((x) => { const f = cleanFHP(x); if (f) { if (!fh.includes(f)) fh.push(f); if (tenderFhps.has(f)) match = true; } });
    if (!match) continue;
    const d = extractDate(l, ['LogDate', 'Date', 'CreationDate']);
    const workers = safe(l.WorkersList, '').split(',').map((s) => s.trim()).filter(Boolean).map((w) => {
      const p = w.split('|').map((x) => x.trim());
      const name = `${p[1] || ''} ${p[2] || ''}`.trim() || 'עובד ללא שם';
      return name;
    });
    const equipment = safe(l.EquipmentList, '').split(',').map((s) => s.trim()).filter(Boolean).map((e) => {
      const p = e.split('|').map((x) => x.trim());
      const type = (p[0] || 'כלי ללא פירוט').replace('טרקטורים', 'טרקטור').replace('משאיות', 'משאית');
      if (type === 'כלים מוטוריים' || type === 'כלי מוטורי') { const n = safeNum(p[1]) || 1; return n === 1 ? 'כלי מוטורי אחד' : `${n} כלים מוטוריים`; }
      return p[1] && p[1] !== '-' ? `${type} (${p[1]})` : type;
    });
    const onSiteRaw = safe(l.ContractorOnSite, '');
    logs.push({
      id: safe(l.WorkLogID, "ללא מס'"), status: st || '-', date: fmtDate(d),
      start: extractTime(l, ['ArrivalTime', 'WorkStartTime', 'StartTime', 'FromTime', 'Arrival']),
      end: extractTime(l, ['DepartureTime', 'WorkEndTime', 'EndTime', 'ToTime', 'Departure']),
      workType: safe(l.WorkType, 'לא צוין'), contractor: safe(l.ContractorName, '') || safe(l.Contractor, '') || 'לא צוין',
      onSite: onSiteRaw && onSiteRaw !== '-' ? yes(onSiteRaw) : null,
      stands: translateF(fh), mana: manaOrderOf(l.SubworkUnitGlobalID),
      summary: safe(l.WorkDescription, ''), condition: safe(l.Condition, ''), supervisorComments: safe(l.SupervisorComments, ''),
      events: safe(l.Events, '').split(',').map((s) => s.trim()).filter(Boolean).map((e) => (['אחר', 'other', 'Other'].includes(e) && safe(l.EventsDescription, '') ? `אחר: ${safe(l.EventsDescription, '')}` : e)),
      violations: safe(l.ViolationsClean, '').split(',').map((s) => s.trim()).filter(Boolean),
      workers, equipment, hours: safeNum(l.WorkerHours), supervisor: safe(l.WorkLogCreator, '-'), workManager: safe(l.WorkManagerName, '') || safe(l.WorkManager, '') || '-',
    });
  }

  const done = gArea['בוצע'] || 0;
  const execPct = areaTotal > 0 ? Math.min(100, Math.max(0, Math.round((done / areaTotal) * 100))) : 0;
  const order2 = ['בתכנון', 'לפני ביצוע', 'בביצוע', 'הפסקת עבודה', 'בוצע', 'ביטול', 'אחר'];
  const objectId = safeNum(t.OBJECTID);

  return {
    gid, objectId, name: safe(t.SubTenderName, 'ללא שם'), status,
    region: safe(t.STRegionName, '-'), gush: safe(t.STForestRegionName, '-'), forests: safe(t.STForestNames, '-'),
    year: safe(t.SubTenderYear, '-'), areaDunam: areaTotal, workType: safe(t.STWorkType, '-'),
    contractor, subContractor: safe(t.STSubContractors, ''), workManager: safe(t.STWorkManager, ''),
    stopped: isStopped ? { date: stStop ? fmtDate(stStop) : 'לא צוין תאריך', reason: stReason || 'לא צוינה סיבה' } : null,
    steps, cancelled, doneArea: done, execPct,
    groups: order2.filter((k) => k !== 'בתכנון' && gCount[k]).map((k) => ({ status: k, count: gCount[k], area: gArea[k], pct: areaTotal > 0 ? Math.round((gArea[k] / areaTotal) * 1000) / 10 : 0 })),
    actions: Object.keys(actionCounts).map((k) => ({ name: k, count: actionCounts[k] })),
    manot: manotOrder.map((id) => manot[id]).filter((m) => !(m.order === 'ללא שיוך' && m.stands.length === 0)),
    cuts, orphanRems, totalActiveBalance, overdrafts, hasActiveStands: activeStandsList.length > 0, activeStandsList,
    certs, certsVolume, logs, hasMoreLogs,
    reportUrl: buildReportUrl(objectId), surveyLink: buildSurveyLink(gid),
    // standsCount נשמר לצרכי תצוגה
    ...(standsCount ? {} : {}),
  };
}

// ---------------- מתאם למוקאפ (נתוני דמו) ----------------
export function mockContractToModel(c: Contract): PopupModel {
  const stateOf = (status: string, bal: number): LicState => (status.startsWith('לא בתוקף') ? 'invalid' : bal <= 0 ? 'exhausted' : 'valid');
  const manot: PMano[] = c.Manot.map((m) => ({
    id: m.Mano_ID, order: (m.Mano_Name.match(/^מנה\s*([^\s-]+)/) || [])[1] || m.Mano_ID, status: m.Status,
    area: m.Stands.reduce((a, s) => a + s.AreaDunam, 0),
    stands: m.Stands.map((s) => ({ label: s.Stand_ID, status: s.Status, area: s.AreaDunam, action: s.TreatmentType })),
  }));
  const areaTotal = manot.reduce((a, m) => a + m.area, 0);
  const gArea: Record<string, number> = {}, gCount: Record<string, number> = {};
  manot.forEach((m) => m.stands.forEach((s) => { const g = s.status === 'בוצע' ? 'בוצע' : s.status === 'בביצוע' ? 'בביצוע' : s.status === 'מושהה' ? 'הפסקת עבודה' : 'לפני ביצוע'; gArea[g] = (gArea[g] || 0) + s.area; gCount[g] = (gCount[g] || 0) + 1; }));
  const cuts: PCut[] = c.Felling_Licenses.map((f) => ({
    id: f.Felling_License_ID, num: f.License_Number, state: 'valid' as LicState, from: f.IssueDate, to: f.ExpiryDate,
    rems: f.Removing_Licenses.map((r) => ({
      id: r.Removing_License_ID, num: r.License_Number, state: stateOf(r.Status, r.BalanceMQ), from: r.IssueDate, to: r.ExpiryDate,
      approved: r.ApprovedMQ, used: r.DeliveredMQ, balance: r.BalanceMQ, usedByMana: {},
    })),
  }));
  const allRems = cuts.flatMap((x) => x.rems);
  const totalActiveBalance = allRems.filter((r) => r.state === 'valid').reduce((a, r) => a + r.balance, 0);
  const lic = new Map(allRems.map((r) => [r.id, r]));
  const running: Record<string, number> = {};
  const certs: PCert[] = [...c.DeliveryNotes].sort((a, b) => a.Date.localeCompare(b.Date)).map((n) => {
    const r = lic.get(n.Removing_License_ID);
    let blocks: PCertBlock[] = [];
    if (r) { running[r.id] = (running[r.id] || 0) + n.QuantityMQ; blocks = [{ num: r.num, qty: n.QuantityMQ, state: r.state, rolling: r.approved - running[r.id], current: r.balance }]; }
    return { id: n.Delivery_ID, status: 'מאושר', date: n.Date, qty: n.QuantityMQ, mana: '-', stands: '', blocks, shared: false, extra: { TreeSpeciesName: n.WoodType, DestinationYard: n.DestinationYard }, comments: n.Notes || '' };
  }).reverse();
  const logs: PLog[] = [...c.WorkLogs].sort((a, b) => b.Date.localeCompare(a.Date)).slice(0, 100).map((l) => ({
    id: l.Log_ID, status: 'הוגש', date: l.Date, start: l.StartTime, end: l.EndTime, workType: '-', contractor: c.Contractor, onSite: null,
    stands: l.StandsWorked, mana: '-', summary: '', condition: '', supervisorComments: l.SupervisorComments,
    events: l.SafetyIncident ? [l.SafetyNotes || 'אירוע בטיחות'] : [], violations: [],
    workers: l.Workers.split(',').map((x) => x.trim()).filter(Boolean), equipment: l.Equipment.split(',').map((x) => x.trim()).filter(Boolean), hours: 0, supervisor: c.Supervisor, workManager: '-',
  }));
  const status = c.Status;
  const sd = c.StartDate ? new Date(c.StartDate) : null;
  const steps: PStep[] = (() => {
    const names = [['בתכנון', '#149ece'], ['אושר לביצוע', '#fc921f'], ['בביצוע', '#ffde3e'], ['הסתיים', '#a7c636']];
    const idx = status === 'בתכנון' ? 0 : status === 'אושר לביצוע' ? 1 : status === 'בביצוע' ? 2 : status === 'הסתיים' ? 3 : status === 'בוטל' ? 3 : 2;
    return names.map(([name, color], i) => ({ name: status === 'בוטל' && i === 3 ? 'בוטל' : name, color: status === 'בוטל' && i === 3 ? '#f789d8' : color, date: i === 2 && sd ? fmtDate(sd, true) : '', days: i === 2 && sd && idx === 2 ? Math.max(0, Math.floor((Date.now() - sd.getTime()) / 86400000)) : null, active: i <= idx, current: i === idx && status !== 'בוטל' }));
  })();
  const stands = manot.reduce((a, m) => a + m.stands.length, 0);
  return {
    gid: c.Contract_ID, objectId: 0, name: c.Contract_Name, status,
    region: c.District, gush: c.Block, forests: c.Block, year: String(c.Year), areaDunam: areaTotal, workType: c.Description,
    contractor: c.Contractor || '-', subContractor: '', workManager: '', stopped: status === 'מושהה' ? { date: 'לא צוין תאריך', reason: 'לא צוינה סיבה' } : null,
    steps, cancelled: status === 'בוטל', doneArea: gArea['בוצע'] || 0, execPct: Math.round(c.ExecutionPercent),
    groups: ['לפני ביצוע', 'בביצוע', 'הפסקת עבודה', 'בוצע'].filter((k) => gCount[k]).map((k) => ({ status: k, count: gCount[k], area: gArea[k], pct: areaTotal ? Math.round((gArea[k] / areaTotal) * 1000) / 10 : 0 })),
    actions: Object.entries(manot.flatMap((m) => m.stands).reduce((acc: Record<string, number>, s) => { acc[s.action] = (acc[s.action] || 0) + 1; return acc; }, {})).map(([name, count]) => ({ name, count })),
    manot, cuts, orphanRems: [], totalActiveBalance, overdrafts: allRems.filter((r) => r.balance < 0).map((r) => ({ num: r.num, bal: r.balance })),
    hasActiveStands: stands > 0 && manot.some((m) => m.stands.some((s) => s.status === 'בביצוע')), activeStandsList: [],
    certs, certsVolume: certs.reduce((a, x) => a + x.qty, 0), logs, hasMoreLogs: false,
    reportUrl: '', surveyLink: '',
  };
}
