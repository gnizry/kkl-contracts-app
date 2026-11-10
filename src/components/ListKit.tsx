import React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Search, List, Map as MapIcon, Download } from 'lucide-react';

export const CARD = 'bg-white rounded-3xl border border-slate-200/70 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]';

export const FilterSelect: React.FC<{
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  options: (string | { value: string; label: string })[];
}> = ({ value, onChange, allLabel, options }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none text-xs md:text-sm font-medium py-2.5 pr-4 pl-8 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#16a34a] text-slate-700 cursor-pointer transition-colors"
    >
      <option value="">{allLabel}</option>
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : o.label;
        return <option key={v} value={v}>{l}</option>;
      })}
    </select>
    <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
);

export const SearchBox: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string }> = ({ value, onChange, placeholder }) => (
  <div className="relative flex-1 min-w-[240px]">
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-xs md:text-sm pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16a34a] text-slate-800 placeholder:text-slate-400"
    />
    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
  </div>
);

export const ViewSwitcher: React.FC<{ mode: 'table' | 'map'; onChange: (m: 'table' | 'map') => void }> = ({ mode, onChange }) => (
  <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
    {([['table', 'נתונים', List], ['map', 'מפה', MapIcon]] as const).map(([id, label, Icon]) => (
      <button
        key={id}
        onClick={() => onChange(id)}
        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
          mode === id ? 'bg-[#16a34a] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </button>
    ))}
  </div>
);

export const ExportButton: React.FC<{ onClick?: () => void; title?: string }> = ({ onClick, title = 'ייצוא רשומות' }) => (
  <button onClick={onClick} className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl shadow-2xs transition-colors cursor-pointer" title={title}>
    <Download className="w-4 h-4" />
  </button>
);

export const Toolbar: React.FC<{ left: React.ReactNode; right: React.ReactNode }> = ({ left, right }) => (
  <div className={`${CARD} p-3 md:p-4 flex flex-wrap items-center justify-between gap-3`}>
    <div className="flex flex-wrap items-center gap-3 flex-1">{left}</div>
    <div className="flex items-center gap-2">{right}</div>
  </div>
);

export const Pager: React.FC<{ total: number; page: number; totalPages: number; onPage: (p: number) => void }> = ({ total, page, totalPages, onPage }) => (
  <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
    <div>
      נמצאו: <strong className="text-slate-800 font-semibold">{total}</strong> רשומות
    </div>
    <div className="flex items-center gap-1.5">
      <button onClick={() => onPage(Math.max(page - 1, 1))} disabled={page === 1} className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
        <ChevronRight className="w-4 h-4" />
      </button>
      {Array.from({ length: totalPages }, (_, k) => k + 1)
        .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
        .map((n, i, arr) => (
          <React.Fragment key={n}>
            {i > 0 && n - arr[i - 1] > 1 && <span className="text-slate-400 text-xs px-0.5">…</span>}
            <button
              onClick={() => onPage(n)}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all cursor-pointer ${
                n === page ? 'border-2 border-[#16a34a] text-[#16a34a] font-bold bg-emerald-50/50' : 'text-slate-600 hover:bg-slate-100 font-medium'
              }`}
            >
              {n}
            </button>
          </React.Fragment>
        ))}
      <button onClick={() => onPage(Math.min(page + 1, totalPages))} disabled={page === totalPages} className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
        <ChevronLeft className="w-4 h-4" />
      </button>
    </div>
  </div>
);

export const MapCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className={`${CARD} p-6 flex justify-center`}>
    <div className="w-full max-w-[420px]">{children}</div>
  </div>
);

export interface KpiItem { label: string; value: string | number; sub?: string; tone?: string }
/** שורת KPI מעל רשימה (ב-ExB: ווידג'טי Text/Number עם ביטוי סטטיסטיקה על אותו מקור נתונים והסינון) */
export const KpiRow: React.FC<{ items: KpiItem[] }> = ({ items }) => (
  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
    {items.map((k, i) => (
      <div key={i} className={`${CARD} px-4 py-3 flex flex-col gap-0.5`}>
        <div className="text-[12px] font-semibold text-slate-500">{k.label}</div>
        <div className="text-2xl font-bold tabular-nums" style={{ color: k.tone || '#0f172a' }}>{k.value}</div>
        {k.sub && <div className="text-[11.5px] text-slate-400">{k.sub}</div>}
      </div>
    ))}
  </div>
);
