import React, { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { Contract } from '../types/forestry';
import { buildDataQuality, Severity } from '../utils/insights';
import { CARD } from './ListKit';

interface Props { contracts: Contract[]; onOpenContract: (c: Contract) => void }

const SEV: Record<Severity, { label: string; cls: string }> = {
  critical: { label: 'קריטי', cls: 'bg-rose-50 text-[#e11d48] border-rose-200' },
  warning: { label: 'אזהרה', cls: 'bg-amber-50 text-[#b45309] border-amber-200' },
  info: { label: 'לידיעה', cls: 'bg-blue-50 text-[#2563eb] border-blue-200' },
};

export const DataQualityView: React.FC<Props> = ({ contracts, onOpenContract }) => {
  const rules = useMemo(() => buildDataQuality(contracts), [contracts]);
  const [open, setOpen] = useState<string | null>(null);
  const failing = rules.filter((r) => r.bad > 0);
  const score = Math.round((rules.filter((r) => r.bad === 0).length / Math.max(rules.length, 1)) * 100);
  const avgOk = Math.round(rules.reduce((a, r) => a + (r.total ? 1 - r.bad / r.total : 1), 0) / Math.max(rules.length, 1) * 100);
  const R = 44, C = 2 * Math.PI * R;

  return (
    <div className="flex flex-col gap-5 text-right">
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-5">
        <div className={`${CARD} p-6 flex flex-col items-center justify-center gap-2`}>
          <svg viewBox="0 0 100 100" className="w-32 h-32 -rotate-90">
            <circle cx="50" cy="50" r={R} fill="none" stroke="#e2e8f0" strokeWidth="9" />
            <circle cx="50" cy="50" r={R} fill="none" stroke={avgOk > 90 ? '#16a34a' : avgOk > 70 ? '#eda100' : '#e34948'} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(avgOk / 100) * C} ${C}`} />
          </svg>
          <div className="-mt-[88px] mb-9 text-3xl font-bold text-slate-900 tabular-nums">{avgOk}%</div>
          <div className="text-sm text-slate-500">שלמות נתונים (ממוצע כללים)</div>
        </div>
        <div className={`${CARD} p-6 grid grid-cols-3 gap-4 content-center text-center`}>
          <div><div className="text-3xl font-bold tabular-nums text-slate-900">{rules.length}</div><div className="text-xs text-slate-500 mt-1">כללי בדיקה</div></div>
          <div><div className="text-3xl font-bold tabular-nums text-[#e11d48]">{failing.length}</div><div className="text-xs text-slate-500 mt-1">כללים עם ממצאים</div></div>
          <div><div className="text-3xl font-bold tabular-nums text-[#16a34a]">{rules.length - failing.length}</div><div className="text-xs text-slate-500 mt-1">כללים תקינים ({score}%)</div></div>
          <p className="col-span-3 text-xs text-slate-500 leading-relaxed text-right border-t border-slate-100 pt-3">
            הבדיקות רצות על הנתונים הנוכחיים במוקאפ. בשלב ההטמעה כל כלל ניתן לממש כ-Arcade Data Expression או כשאילתה על השכבות, כדי לטפל בפערים לפני העלייה ל-Experience Builder.
          </p>
        </div>
      </div>

      <div className={`${CARD} overflow-hidden divide-y divide-slate-100`}>
        {rules.map((r) => {
          const ok = r.bad === 0;
          const S = SEV[r.severity];
          const isOpen = open === r.id;
          const pctBad = r.total ? (r.bad / r.total) * 100 : 0;
          return (
            <div key={r.id}>
              <button onClick={() => !ok && setOpen(isOpen ? null : r.id)} className={`w-full px-5 py-4 flex items-center gap-4 text-right ${ok ? 'cursor-default' : 'hover:bg-slate-50/60 cursor-pointer'}`}>
                {ok ? <CheckCircle2 className="w-5 h-5 text-[#16a34a] shrink-0" /> : <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${S.cls}`}>{S.label}</span>}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900">{r.title}</div>
                  <div className="text-xs text-slate-500">{r.hint}</div>
                </div>
                <div className="w-40 hidden md:block">
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pctBad}%`, background: ok ? '#16a34a' : r.severity === 'critical' ? '#e34948' : r.severity === 'warning' ? '#eda100' : '#2a78d6' }} /></div>
                </div>
                <div className="text-sm tabular-nums text-slate-700 w-28 text-left shrink-0"><strong>{r.bad}</strong> <span className="text-slate-400">מתוך {r.total}</span></div>
                {!ok && (isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />)}
              </button>
              {isOpen && (
                <div className="bg-slate-50/60 px-5 py-3 border-t border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    {r.items.slice(0, 12).map((it, i) => {
                      const c = contracts.find((x) => x.Contract_ID === it.contractId);
                      return (
                        <button key={i} onClick={() => c && onOpenContract(c)} className="text-right py-1.5 border-b border-slate-100 hover:text-[#16a34a] cursor-pointer">
                          <span className="text-xs font-semibold text-slate-800 tabular-nums">{it.label}</span>
                          <span className="text-[11px] text-slate-400 mr-2">{it.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                  {r.items.length > 12 && <div className="text-[11px] text-slate-400 pt-2">ועוד {r.items.length - 12} ממצאים…</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
