import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Globe2, Loader2, X, Crosshair, Maximize2 } from 'lucide-react';
import { loadSdk, esriRequire, addBasemapGallery } from '../esriSdk';
import { useConnection } from '../connection';
import { discoverLayers, fetchPopupModel, listTenders, LiveLayers } from '../utils/liveData';
import { Attr, PopupModel, safe, statusColors } from '../utils/popupModel';
import { ContractPopupCard } from './ContractPopupCard';
import { FilterSelect, SearchBox } from './ListKit';
import { statusColor } from './IsraelMap';

const ORDER = ['בביצוע', 'אושר לביצוע', 'לפני ביצוע', 'בתכנון', 'הפסקת עבודה', 'הסתיים', 'ביטול'];

interface Props { height?: number; compact?: boolean; withList?: boolean }

export const LiveMapPanel: React.FC<Props> = ({ height = 640, compact, withList }) => {
  const { settings, openLive } = useConnection();
  const host = useRef<HTMLDivElement>(null);
  const ref = useRef<{ view?: any; layers?: LiveLayers; hl?: any; home?: any }>({});
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [err, setErr] = useState('');
  const [tenders, setTenders] = useState<Attr[]>([]);
  const [active, setActive] = useState<string[]>(['בביצוע']);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Attr | null>(null);
  const [model, setModel] = useState<PopupModel | null>(null);
  const [loadingCard, setLoadingCard] = useState(false);
  const [cardErr, setCardErr] = useState('');

  // אתחול המפה
  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        await loadSdk();
        const [WebMap, MapView] = await esriRequire<[any, any]>(['esri/WebMap', 'esri/views/MapView']);
        if (disposed || !host.current) return;
        const map = new WebMap({ portalItem: { id: settings.webMapId } });
        const view = new MapView({ container: host.current, map, ui: { components: ['zoom', 'attribution'] } });
        view.popup.autoOpenEnabled = false;
        addBasemapGallery(view);
        ref.current.view = view;
        await view.when();
        const layers = await discoverLayers(map);
        layers.tender.visible = true;
        layers.tender.popupEnabled = false;
        ref.current.layers = layers;
        ref.current.home = view.extent?.clone?.();
        view.on('click', async (ev: any) => {
          const res = await view.hitTest(ev, { include: layers.tender });
          const g = res.results.find((r: any) => r.graphic?.attributes);
          if (g) pick(g.graphic.attributes);
        });
        const rows = await listTenders(layers.tender);
        if (disposed) return;
        setTenders(rows);
        setPhase('ready');
      } catch (e: any) {
        if (!disposed) { setErr(e?.message || String(e)); setPhase('error'); }
      }
    })();
    return () => { disposed = true; try { ref.current.view?.destroy(); } catch {} ref.current = {}; };
    // eslint-disable-next-line
  }, [settings.webMapId]);

  // סינון סטטוסים בשכבה
  useEffect(() => {
    const L = ref.current.layers;
    if (!L) return;
    L.tender.definitionExpression = active.length ? `STStageStatus IN (${active.map((s) => `'${s.replace(/'/g, "''")}'`).join(',')})` : '1=0';
  }, [active, phase]);

  const pick = async (attrs: Attr, focus = false) => {
    const L = ref.current.layers;
    if (!L) return;
    setSelected(attrs);
    setModel(null); setCardErr(''); setLoadingCard(true);
    try {
      const view = ref.current.view;
      if (focus) {
        const res = await L.tender.queryFeatures({ where: `OBJECTID = ${attrs.OBJECTID}`, returnGeometry: true, outFields: ['OBJECTID'] });
        const g = res.features[0]?.geometry;
        if (g) await view.goTo(g.type === 'point' ? { target: g, zoom: 15 } : g.extent.clone().expand(1.6), { duration: 900 });
      }
      try {
        ref.current.hl?.remove();
        const lv = await view.whenLayerView(L.tender);
        const res = await L.tender.queryFeatures({ where: `OBJECTID = ${attrs.OBJECTID}`, returnGeometry: false, outFields: ['OBJECTID'] });
        if (res.features[0]) ref.current.hl = lv.highlight(res.features[0]);
      } catch {}
      setModel(await fetchPopupModel(L, attrs));
    } catch (e: any) {
      setCardErr(e?.message || String(e));
    } finally { setLoadingCard(false); }
  };

  const focusAll = async (where?: string) => {
    const L = ref.current.layers, view = ref.current.view;
    if (!L) return;
    if (!where) { if (ref.current.home) view.goTo(ref.current.home, { duration: 800 }); return; }
    const res = await L.tender.queryFeatures({ where: `${where}${active.length ? ` AND STStageStatus IN (${active.map((s) => `'${s}'`).join(',')})` : ''}`, returnGeometry: true, outFields: ['OBJECTID'] });
    if (res.features.length) view.goTo(res.features, { duration: 900 });
  };

  const counts = useMemo(() => { const m: Record<string, number> = {}; tenders.forEach((t) => { const s = safe(t.STStageStatus, 'אחר'); m[s] = (m[s] || 0) + 1; }); return m; }, [tenders]);
  const statuses = [...ORDER.filter((s) => counts[s]), ...Object.keys(counts).filter((s) => !ORDER.includes(s))];
  const regions = useMemo(() => Array.from(new Set(tenders.filter((t) => active.includes(safe(t.STStageStatus, ''))).map((t) => safe(t.STRegionName, '')).filter(Boolean))), [tenders, active]);
  const list = useMemo(() => tenders.filter((t) => active.includes(safe(t.STStageStatus, '')) && (!q || (safe(t.SubTenderName, '') + safe(t.STRegionName, '') + safe(t.STForestNames, '') + safe(t.STSelectedContractorInternal, '')).includes(q))), [tenders, active, q]);

  const mapBlock = (
    <div className="flex flex-col gap-3 min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        {statuses.map((s) => {
          const on = active.includes(s);
          return (
            <button key={s} onClick={() => setActive((a) => (a.includes(s) ? a.filter((x) => x !== s) : [...a, s]))}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border cursor-pointer ${on ? 'bg-white border-slate-300 text-slate-800 shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: on ? statusColor(s) : '#cbd5e1' }} />{s} <span className="tabular-nums text-slate-400">{counts[s]}</span>
            </button>
          );
        })}
        <div className="flex items-center gap-2 mr-auto">
          {!compact && <FilterSelect value="" onChange={(v) => v && focusAll(`STRegionName = '${v.replace(/'/g, "''")}'`)} allLabel="התמקד באזור…" options={regions} />}
          <button onClick={() => focusAll()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"><Globe2 className="w-3.5 h-3.5" /> מבט ארצי</button>
        </div>
      </div>
      <div className="relative">
        <div ref={host} dir="ltr" style={{ height, width: '100%' }} className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100" />
        {phase === 'loading' && <div className="absolute inset-0 rounded-2xl bg-slate-100/90 flex items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> טוען את המפה מהפורטל…</div>}
        {phase === 'error' && <div className="absolute inset-0 rounded-2xl bg-white/95 flex items-center justify-center p-6 text-center text-sm text-rose-700">שגיאה בטעינת המפה: {err}</div>}
        {selected && (
          <div className={`absolute z-30 bg-slate-50 shadow-2xl border border-slate-200 overflow-y-auto p-3 ${compact ? 'inset-0 rounded-2xl' : 'top-0 bottom-0 right-0 w-[470px] max-w-full rounded-2xl'}`}>
            <div className="sticky top-0 float-left z-10 flex items-center gap-1.5">
              {model && <button onClick={() => openLive(model)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold shadow cursor-pointer"><Maximize2 className="w-3.5 h-3.5" /> דף התקשרות מלא</button>}
              <button onClick={() => { setSelected(null); setModel(null); ref.current.hl?.remove(); }} className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            {loadingCard && <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> טוען פרטי התקשרות…</div>}
            {cardErr && <div className="p-4 text-sm text-rose-700">שגיאה בשליפת נתוני ההתקשרות: {cardErr}</div>}
            {model && <ContractPopupCard m={model} />}
          </div>
        )}
      </div>
    </div>
  );

  if (!withList) return mapBlock;
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-4 items-start">
      <div className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-col gap-2.5">
        <div className="flex"><SearchBox value={q} onChange={setQ} placeholder="חיפוש התקשרות…" /></div>
        <div className="text-[11px] text-slate-400">{list.length} התקשרויות · לחיצה = התמקדות + כרטיס</div>
        <div className="flex flex-col divide-y divide-slate-100 overflow-y-auto" style={{ maxHeight: height }}>
          {list.slice(0, 300).map((t) => (
            <button key={t.OBJECTID} onClick={() => pick(t, true)} className={`text-right px-2 py-2.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer ${selected?.OBJECTID === t.OBJECTID ? 'bg-emerald-50/60' : ''}`}>
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: statusColors(safe(t.STStageStatus, '')).main }} />
              <span className="flex-1 min-w-0"><span className="block text-sm font-semibold text-slate-800 truncate">{safe(t.SubTenderName, 'ללא שם')}</span><span className="block text-[11px] text-slate-400 truncate">{safe(t.STRegionName, '')} · {safe(t.STForestNames, '')}</span></span>
              <Crosshair className="w-4 h-4 text-slate-300 shrink-0" />
            </button>
          ))}
        </div>
      </div>
      {mapBlock}
    </div>
  );
};
