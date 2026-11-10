import React, { useMemo, useState } from 'react';
import { Contract } from '../types/forestry';
import { CARD, FilterSelect, SearchBox, Toolbar } from './ListKit';
import { statusColor } from './IsraelMap';
import { toTime } from '../utils/insights';

interface Props {
  contracts: Contract[];
  onOpenContract: (c: Contract) => void;
}

const DAY = 86400000;

export const TimelineView: React.FC<Props> = ({ contracts, onOpenContract }) => {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const now = Date.now();

  const rows = useMemo(
    () =>
      contracts
        .map((c) => {
          let s = toTime(c.StartDate);
          let e = toTime(c.EndDate);
          let guessed = false;
          if (isNaN(s) && !isNaN(e)) { s = e - 180 * DAY; guessed = true; }
          if (isNaN(e) && !isNaN(s)) { e = s + 180 * DAY; guessed = true; }
          return { c, s, e, guessed };
        })
        .filter((r) => !isNaN(r.s) && !isNaN(r.e) && r.e > r.s)
        .filter((r) => (!status || r.c.Status === status) && (!q || (r.c.Contract_Name + r.c.Contract_Number).includes(q)))
        .sort((a, b) => a.s - b.s),
    [contracts, status, q]
  );
  const undated = contracts.filter((c) => isNaN(toTime(c.StartDate)) && isNaN(toTime(c.EndDate))).length;
  const statuses = Array.from(new Set(contracts.map((c) => c.Status)));

  const min = Math.min(now - 60 * DAY, ...rows.map((r) => r.s));
  const max = Math.max(now + 60 * DAY, ...rows.map((r) => r.e));
  const pct = (t: number) => ((t - min) / (max - min)) * 100;

  // month ticks (quarterly)
  const ticks: { t: number; label: string }[] = [];
  const d = new Date(min); d.setDate(1); d.setMonth(Math.floor(d.getMonth() / 3) * 3);
  while (d.getTime() < max) {
    if (d.getTime() > min) ticks.push({ t: d.getTime(), label: `${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}` });
    d.setMonth(d.getMonth() + 3);
  }

  return (
    <div className="flex flex-col gap-5 text-right">
      <Toolbar
        left={
          <>
            <FilterSelect value={status} onChange={setStatus} allLabel="כל הסטטוסים" options={statuses} />
            <SearchBox value={q} onChange={setQ} placeholder="חיפוש התקשרות…" />
          </>
        }
        right={<div className="text-xs text-slate-500">{rows.length} התקשרויות עם תאריכים{undated ? ` · ${undated} ללא תאריכים (לא מוצגות)` : ''}</div>}
      />

      <div className={`${CARD} overflow-hidden`}>
        <div className="overflow-auto max-h-[680px]">
          <div style={{ minWidth: 1000 }}>
            {/* header */}
            <div className="flex sticky top-0 z-20 bg-white border-b border-slate-100">
              <div className="w-64 shrink-0 px-4 py-3 text-xs font-medium text-slate-500 sticky right-0 bg-white z-10 border-l border-slate-100">התקשרות</div>
              <div className="flex-1 relative h-10" dir="ltr">
                {ticks.map((t) => (
                  <div key={t.t} className="absolute top-0 bottom-0 border-l border-slate-100 text-[10px] text-slate-400 pl-1 pt-3" style={{ left: `${pct(t.t)}%` }}>{t.label}</div>
                ))}
                <div className="absolute top-0 bottom-0 border-l-2 border-[#e11d48] text-[10px] font-bold text-[#e11d48] pl-1 pt-0.5" style={{ left: `${pct(now)}%` }}>היום</div>
              </div>
            </div>
            {rows.map(({ c, s, e, guessed }) => {
              const color = statusColor(c.Status);
              const done = Math.min(Math.max(c.ExecutionPercent, 0), 100);
              return (
                <div key={c.Contract_ID} className="flex border-b border-slate-50 hover:bg-slate-50/60 group">
                  <button onClick={() => onOpenContract(c)} className="w-64 shrink-0 px-4 py-2 text-right sticky right-0 bg-white group-hover:bg-slate-50 z-10 border-l border-slate-100 cursor-pointer">
                    <div className="text-xs font-bold text-slate-800 truncate">{c.Contract_Name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{c.Contract_Number} · {c.Status}</div>
                  </button>
                  <div className="flex-1 relative h-12" dir="ltr">
                    {ticks.map((t) => <div key={t.t} className="absolute top-0 bottom-0 border-l border-slate-50" style={{ left: `${pct(t.t)}%` }} />)}
                    <div className="absolute top-0 bottom-0 border-l-2 border-[#e11d48]/60" style={{ left: `${pct(now)}%` }} />
                    <div
                      className="absolute top-3 h-6 rounded-md overflow-hidden cursor-pointer"
                      style={{ left: `${pct(s)}%`, width: `${Math.max(pct(e) - pct(s), 0.8)}%`, background: color + '33', border: `1.5px ${guessed ? 'dashed' : 'solid'} ${color}` }}
                      title={`${c.Contract_Name}\n${c.StartDate || '—'} → ${c.EndDate || '—'}\nביצוע ${Math.round(done)}%${guessed ? '\n(אחד התאריכים חסר – משוער)' : ''}`}
                      onClick={() => onOpenContract(c)}
                    >
                      <div className="h-full" style={{ width: `${done}%`, background: color }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {rows.length === 0 && <div className="py-16 text-center text-slate-400 text-sm">אין התקשרויות להצגה</div>}
          </div>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
          {['בביצוע', 'אושר לביצוע', 'בתכנון', 'מושהה', 'בוטל'].map((s) => (
            <span key={s} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: statusColor(s) }} />{s}</span>
          ))}
          <span>· האזור הכהה = אחוז ביצוע · קו מקווקו = תאריך חסר (משוער)</span>
        </div>
      </div>
    </div>
  );
};
