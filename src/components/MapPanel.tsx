import React, { useEffect, useMemo, useState } from 'react';
import { X, Crosshair, ExternalLink, Globe2 } from 'lucide-react';
import { Contract } from '../types/forestry';
import { IsraelMap, statusColor } from './IsraelMap';
import { EsriMap, MapFocus } from './EsriMap';
import { FilterSelect } from './ListKit';
import { useConnection } from '../connection';
import { LiveMapPanel } from './LiveMapPanel';
import { ContractPopupCard } from './ContractPopupCard';
import { mockContractToModel } from '../utils/popupModel';

interface MapPanelProps {
  contracts: Contract[];
  onOpenContract: (c: Contract) => void;
  height?: number;
  /** external focus request (e.g. from a list) */
  focusRequest?: { id: string; nonce: number } | null;
  defaultStatuses?: string[];
  compact?: boolean;
}

const ORDER = ['בביצוע', 'אושר לביצוע', 'בתכנון', 'מושהה', 'בוטל'];

const MockMapPanel: React.FC<MapPanelProps> = ({ contracts, onOpenContract, height = 560, focusRequest, defaultStatuses = ['בביצוע'], compact }) => {
  const [mode, setMode] = useState<'loading' | 'esri' | 'fallback'>('loading');
  const [active, setActive] = useState<string[]>(defaultStatuses);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFull, setShowFull] = useState(false);
  const [focus, setFocus] = useState<(MapFocus & { nonce: number }) | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMode((m) => (m === 'loading' ? 'fallback' : m)), 9000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!focusRequest) return;
    const c = contracts.find((x) => x.Contract_ID === focusRequest.id);
    if (c && !active.includes(c.Status)) setActive((a) => [...a, c.Status]);
    setSelectedId(focusRequest.id);
    setFocus({ kind: 'contract', id: focusRequest.id, nonce: focusRequest.nonce });
    // eslint-disable-next-line
  }, [focusRequest]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    contracts.forEach((c) => (m[c.Status] = (m[c.Status] || 0) + 1));
    return m;
  }, [contracts]);
  const visible = useMemo(() => contracts.filter((c) => active.includes(c.Status)), [contracts, active]);
  const regions = useMemo(() => Array.from(new Set(visible.map((c) => c.Region))), [visible]);
  const selected = contracts.find((c) => c.Contract_ID === selectedId) || null;
  const nonce = () => Date.now();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {ORDER.filter((s) => counts[s]).map((s) => {
          const on = active.includes(s);
          return (
            <button
              key={s}
              onClick={() => setActive((a) => (a.includes(s) ? a.filter((x) => x !== s) : [...a, s]))}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-colors cursor-pointer ${on ? 'bg-white border-slate-300 text-slate-800 shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: on ? statusColor(s) : '#cbd5e1' }} />
              {s} <span className="tabular-nums text-slate-400">{counts[s]}</span>
            </button>
          );
        })}
        <div className="flex items-center gap-2 mr-auto">
          {!compact && (
            <FilterSelect value="" onChange={(v) => v && setFocus({ kind: 'region', region: v, nonce: nonce() })} allLabel="התמקד במרחב…" options={regions} />
          )}
          <button
            onClick={() => setFocus({ kind: 'all', nonce: nonce() })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            title="מבט ארצי"
          >
            <Globe2 className="w-3.5 h-3.5" /> מבט ארצי
          </button>
        </div>
      </div>

      <div className="relative">
        {mode !== 'fallback' && (
          <EsriMap
            contracts={visible}
            selectedId={selectedId}
            focus={focus}
            onSelect={setSelectedId}
            onReady={() => setMode('esri')}
            onFail={() => setMode('fallback')}
            height={height}
          />
        )}
        {mode === 'loading' && (
          <div className="absolute inset-0 rounded-2xl bg-slate-100/90 flex items-center justify-center text-xs text-slate-500">טוען מפת Esri…</div>
        )}
        {mode === 'fallback' && (
          <div className="flex justify-center" style={{ minHeight: 0 }}>
            <div className="w-full" style={{ maxWidth: compact ? 520 : 460 }}>
              <IsraelMap
                contracts={visible}
                selectedContractId={selectedId}
                onSelectContract={(c) => {
                  setSelectedId(c.Contract_ID);
                }}
              />
              <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                מפת הרקע של Esri לא נטענה בסביבה זו (חסימת רשת) – מוצג גיבוי וקטורי. בהרצה מקומית תוצג מפת Esri אינטראקטיבית עם התמקדות.
              </p>
            </div>
          </div>
        )}

        {selected && showFull && (
          <div className={`absolute z-40 bg-slate-50 shadow-2xl border border-slate-200 overflow-y-auto p-3 ${compact ? 'inset-0 rounded-2xl' : 'top-0 bottom-0 right-0 w-[470px] max-w-full rounded-2xl'}`}>
            <div className="sticky top-0 z-10 flex gap-2 float-left">
              <button onClick={() => onOpenContract(selected)} className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">כרטיס 360°</button>
              <button onClick={() => setShowFull(false)} className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <ContractPopupCard m={mockContractToModel(selected)} />
          </div>
        )}
        {selected && !showFull && (
          <div className="absolute z-30 bottom-3 left-3 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 text-right">
            <button onClick={() => setSelectedId(null)} className="absolute top-2 left-2 p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <div className="text-xs text-slate-400">{selected.Contract_Number}</div>
            <div className="text-sm font-bold text-slate-900 leading-snug pl-5">{selected.Contract_Name}</div>
            <div className="flex items-center gap-2 mt-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor(selected.Status) }} />
              <span className="font-semibold text-slate-700">{selected.Status}</span>
              <span className="text-slate-400">· {selected.Region}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-[#16a34a] rounded-full" style={{ width: `${Math.min(selected.ExecutionPercent, 100)}%` }} />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">ביצוע {Math.round(selected.ExecutionPercent)}% · פונה {Math.round(selected.TotalDeliveredMQ)} מ״ק</div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setShowFull(true)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-bold rounded-xl bg-[#16a34a] text-white hover:bg-[#15803d] cursor-pointer">
                <ExternalLink className="w-3.5 h-3.5" /> כרטיס התקשרות
              </button>
              <button onClick={() => setFocus({ kind: 'contract', id: selected.Contract_ID, nonce: nonce() })} className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer">
                <Crosshair className="w-3.5 h-3.5" /> התמקד
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const MapPanel: React.FC<MapPanelProps> = (props) => {
  const { status } = useConnection();
  if (status === 'connected') return <LiveMapPanel height={props.height} compact={props.compact} />;
  return <MockMapPanel {...props} />;
};
