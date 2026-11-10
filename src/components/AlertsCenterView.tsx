import React, { useMemo, useState } from 'react';
import { AlertTriangle, AlertCircle, Info, MapPin, ExternalLink } from 'lucide-react';
import { Contract } from '../types/forestry';
import { buildAlerts, Severity } from '../utils/insights';
import { CARD } from './ListKit';

interface Props {
  contracts: Contract[];
  onOpenContract: (c: Contract) => void;
  onShowOnMap: (c: Contract) => void;
}

const SEV: Record<Severity, { label: string; cls: string; icon: React.ElementType; dot: string }> = {
  critical: { label: 'קריטי', cls: 'bg-rose-50 text-[#e11d48] border-rose-200', icon: AlertCircle, dot: '#e11d48' },
  warning: { label: 'אזהרה', cls: 'bg-amber-50 text-[#b45309] border-amber-200', icon: AlertTriangle, dot: '#d97706' },
  info: { label: 'לידיעה', cls: 'bg-blue-50 text-[#2563eb] border-blue-200', icon: Info, dot: '#2563eb' },
};

export const AlertsCenterView: React.FC<Props> = ({ contracts, onOpenContract, onShowOnMap }) => {
  const alerts = useMemo(() => buildAlerts(contracts), [contracts]);
  const [sev, setSev] = useState<Severity | ''>('');
  const [type, setType] = useState('');
  const [limit, setLimit] = useState(25);

  const types = Array.from(new Set(alerts.map((a) => a.type)));
  const shown = alerts.filter((a) => (!sev || a.severity === sev) && (!type || a.type === type));
  const cnt = (s: Severity) => alerts.filter((a) => a.severity === s).length;

  return (
    <div className="flex flex-col gap-5 text-right">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(['critical', 'warning', 'info'] as Severity[]).map((s) => {
          const S = SEV[s];
          const Icon = S.icon;
          return (
            <button
              key={s}
              onClick={() => { setSev(sev === s ? '' : s); setLimit(25); }}
              className={`${CARD} p-5 flex items-center justify-between text-right cursor-pointer transition-all ${sev === s ? 'ring-2 ring-slate-800/10 border-slate-300' : 'hover:border-slate-300'}`}
            >
              <div>
                <div className="text-sm text-slate-500">{S.label}</div>
                <div className="text-3xl font-bold text-slate-900 tabular-nums">{cnt(s)}</div>
              </div>
              <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${S.cls}`}><Icon className="w-5 h-5" /></div>
            </button>
          );
        })}
      </div>

      <div className={`${CARD} p-4 flex flex-wrap items-center gap-2`}>
        <button onClick={() => setType('')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${!type ? 'bg-[#16a34a] text-white border-[#16a34a]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
          הכל ({alerts.length})
        </button>
        {types.map((t) => (
          <button key={t} onClick={() => { setType(type === t ? '' : t); setLimit(25); }} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${type === t ? 'bg-[#16a34a] text-white border-[#16a34a]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
            {t} ({alerts.filter((a) => a.type === t).length})
          </button>
        ))}
      </div>

      <div className={`${CARD} overflow-hidden`}>
        {shown.length === 0 && <div className="py-16 text-center text-slate-400 text-sm">אין התראות פעילות 🎉</div>}
        <div className="divide-y divide-slate-100">
          {shown.slice(0, limit).map((a) => {
            const S = SEV[a.severity];
            const Icon = S.icon;
            const c = contracts.find((x) => x.Contract_ID === a.contractId);
            return (
              <div key={a.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/60">
                <div className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 ${S.cls}`}><Icon className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">{a.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${S.cls}`}>{a.type}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">{a.detail}</div>
                </div>
                <div className="text-xs text-slate-400 tabular-nums shrink-0 hidden md:block">{a.date}</div>
                {c && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => onShowOnMap(c)} className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer" title="הצג במפה"><MapPin className="w-4 h-4" /></button>
                    <button onClick={() => onOpenContract(c)} className="p-2 rounded-xl bg-emerald-50 text-[#16a34a] hover:bg-emerald-100 cursor-pointer" title="פתח כרטיס 360°"><ExternalLink className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {shown.length > limit && (
          <div className="px-6 py-4 border-t border-slate-100 text-center">
            <button onClick={() => setLimit(limit + 25)} className="text-sm font-semibold text-[#16a34a] hover:underline cursor-pointer">הצג עוד ({shown.length - limit})</button>
          </div>
        )}
      </div>
    </div>
  );
};
