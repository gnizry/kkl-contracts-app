import React from 'react';
import { Filter, RotateCcw, Search, AlertCircle } from 'lucide-react';
import { FilterState, Contract } from '../types/forestry';

interface ExbSidebarFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  contracts: Contract[];
  onReset: () => void;
}

export const ExbSidebarFilters: React.FC<ExbSidebarFiltersProps> = ({
  filters,
  setFilters,
  contracts,
  onReset,
}) => {
  const regions = Array.from(new Set(contracts.map((c) => c.Region)));

  const availableDistricts = Array.from(
    new Set(
      contracts
        .filter((c) => !filters.region || c.Region === filters.region)
        .map((c) => c.District)
    )
  );

  const availableBlocks = Array.from(
    new Set(
      contracts
        .filter((c) => {
          const matchReg = !filters.region || c.Region === filters.region;
          const matchDist = !filters.district || c.District === filters.district;
          return matchReg && matchDist;
        })
        .map((c) => c.Block)
    )
  );

  const statuses = ['בתכנון', 'אושר לביצוע', 'בביצוע', 'הסתיים', 'מושהה', 'בוטל'];
  const years = Array.from(new Set(contracts.map((c) => String(c.Year)))).sort();

  const hasActiveFilters =
    Boolean(filters.region) ||
    Boolean(filters.district) ||
    Boolean(filters.block) ||
    Boolean(filters.status) ||
    Boolean(filters.year) ||
    Boolean(filters.searchTerm);

  return (
    <aside className="w-full lg:w-80 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-5 text-right shrink-0">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-[#2e7d32]" />
          <h2 className="text-base font-bold text-slate-900">סינון נתונים</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>איפוס הכל</span>
          </button>
        )}
      </div>

      {/* Free Search */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-700">חיפוש בשם ההתקשרות</label>
        <div className="relative">
          <input
            type="text"
            value={filters.searchTerm}
            onChange={(e) => setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))}
            placeholder="חלק משם ההתקשרות…"
            className="w-full text-sm pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Region (מרחב) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-700">מרחב (Region)</label>
        <select
          value={filters.region}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              region: e.target.value,
              district: '',
              block: '',
            }))
          }
          className="text-sm py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
        >
          <option value="">כל המרחבים (ארצי)</option>
          {regions.map((reg) => (
            <option key={reg} value={reg}>
              {reg}
            </option>
          ))}
        </select>
      </div>

      {/* District (אזור) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-700">אזור (District)</label>
        <select
          value={filters.district}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              district: e.target.value,
              block: '',
            }))
          }
          className="text-sm py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
        >
          <option value="">כל האזורים</option>
          {availableDistricts.map((dist) => (
            <option key={dist} value={dist}>
              {dist}
            </option>
          ))}
        </select>
      </div>

      {/* Block (גוש / יער) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-700">גוש / יער (Block)</label>
        <select
          value={filters.block}
          onChange={(e) => setFilters((prev) => ({ ...prev, block: e.target.value }))}
          className="text-sm py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
        >
          <option value="">כל הגושים והיערות</option>
          {availableBlocks.map((blk) => (
            <option key={blk} value={blk}>
              {blk}
            </option>
          ))}
        </select>
      </div>

      {/* Contract Status (סטטוס) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-700">סטטוס התקשרות</label>
        <select
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          className="text-sm py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
        >
          <option value="">כל הסטטוסים</option>
          {statuses.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {/* Year */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-700">שנת תקציב</label>
        <select
          value={filters.year}
          onChange={(e) => setFilters((prev) => ({ ...prev, year: e.target.value }))}
          className="text-sm py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
        >
          <option value="">כל השנים</option>
          {years.map((yr) => (
            <option key={yr} value={yr}>{yr}</option>
          ))}
        </select>
      </div>

      {/* Results Count Footer */}
      <div className="mt-auto pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
        <span>התקשרויות מסוננות:</span>
        <span className="font-bold tabular-nums text-slate-900 text-sm">
          {contracts.length}
        </span>
      </div>
    </aside>
  );
};
