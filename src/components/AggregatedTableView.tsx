import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  List,
  Map as MapIcon,
  Download,
} from 'lucide-react';
import { Contract } from '../types/forestry';
import { GisMapPreview } from './GisMapPreview';
import { SmartNationalMap } from './SmartMap';
import { isLowBalance } from '../utils/licenses';

interface AggregatedTableViewProps {
  contracts: Contract[];
  onSelectContract: (contract: Contract) => void;
  onExportCsv: () => void;
  onOpenContractBuilder?: () => void;
}

export const AggregatedTableView: React.FC<AggregatedTableViewProps> = ({
  contracts,
  onSelectContract,
  onExportCsv,
  onOpenContractBuilder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Filtered contracts
  const filtered = contracts.filter((c) => {
    if (statusFilter && c.Status !== statusFilter) return false;
    if (regionFilter && c.Region !== regionFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.Contract_Name.toLowerCase().includes(term) ||
      c.Contract_Number.toLowerCase().includes(term) ||
      c.Contractor.toLowerCase().includes(term) ||
      c.Block.toLowerCase().includes(term) ||
      c.Region.toLowerCase().includes(term) ||
      c.District.toLowerCase().includes(term) ||
      c.Supervisor.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Soft pastel status badge styling matching Image 2
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'בתכנון':
        return 'bg-[#e8f1fd] text-[#2563eb]';
      case 'אושר לביצוע':
        return 'bg-[#fef9c3] text-[#a16207]';
      case 'בביצוע':
        return 'bg-[#ecfdf5] text-[#059669]';
      case 'בדיקת שטח':
        return 'bg-[#f1ebfc] text-[#7c3aed]';
      case 'הסתיים':
        return 'bg-[#f1f5f9] text-[#475569]';
      default:
        return 'bg-[#f1f5f9] text-[#475569]';
    }
  };

  const statuses = ['בתכנון', 'אושר לביצוע', 'בביצוע', 'הסתיים', 'מושהה', 'בוטל'];
  const regions = Array.from(new Set(contracts.map((c) => c.Region)));

  return (
    <div className="flex flex-col gap-5 text-right">
      {/* 1. Unified Modern Search & Filter Strip matching Image 2 */}
      <div className="bg-white rounded-3xl p-3 md:p-4 border border-slate-200/70 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-3">
        {/* Right side in RTL: Dropdowns + Search Input */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none text-xs md:text-sm font-medium py-2.5 pr-4 pl-8 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#16a34a] text-slate-700 cursor-pointer transition-colors"
            >
              <option value="">כל הסטטוסים</option>
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Region Dropdown */}
          <div className="relative">
            <select
              value={regionFilter}
              onChange={(e) => {
                setRegionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none text-xs md:text-sm font-medium py-2.5 pr-4 pl-8 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#16a34a] text-slate-700 cursor-pointer transition-colors"
            >
              <option value="">כל האזורים / מרחבים</option>
              {regions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Free Search Input with Search Icon */}
          <div className="relative flex-1 min-w-[240px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="חיפוש לפי שם התקשרות, קבלן או יער…"
              className="w-full text-xs md:text-sm pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16a34a] text-slate-800 placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Left side in RTL: View Switcher (נתונים / מפה) + Export */}
        <div className="flex items-center gap-2">
          {/* Segmented View Switcher */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#16a34a] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>נתונים</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-[#16a34a] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span>מפה</span>
            </button>
          </div>

          {/* New Contract Builder CTA */}
          {onOpenContractBuilder && (
            <button
              onClick={onOpenContractBuilder}
              className="flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-bold rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-white shadow-xs hover:shadow-md transition-all cursor-pointer"
              title="הקמת התקשרות חדשה וסביבת בניית מנות"
            >
              <span>התקשרות חדשה +</span>
            </button>
          )}

          {/* Download CSV button matching screenshot */}
          <button
            onClick={onExportCsv}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl shadow-2xs transition-colors cursor-pointer"
            title="ייצוא רשומות ל-CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Content View: Table or Map */}
      {viewMode === 'map' ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]">
          <SmartNationalMap><GisMapPreview
            contracts={filtered}
            selectedContract={null}
            onSelectContract={onSelectContract}
          /></SmartNationalMap>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/70 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] overflow-hidden">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-medium text-xs select-none">
                  <th className="py-4 px-6 text-right">מס׳ התקשרות</th>
                  <th className="py-4 px-4 text-right">סוג פעילות</th>
                  <th className="py-4 px-4 text-center">סטטוס</th>
                  <th className="py-4 px-4 text-right">מיקום ויער</th>
                  <th className="py-4 px-4 text-right">תאריך / שנה</th>
                  <th className="py-4 px-4 text-right">מפקח יערני</th>
                  <th className="py-4 px-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                      לא נמצאו התקשרויות התואמות את החיפוש.
                    </td>
                  </tr>
                ) : (
                  paginated.map((c) => {
                    const hasLowBalance = c.Felling_Licenses.some((fl) =>
                      fl.Removing_Licenses.some((rl) => isLowBalance(rl))
                    );

                    return (
                      <tr
                        key={c.Contract_ID}
                        onClick={() => onSelectContract(c)}
                        className="hover:bg-slate-50/70 cursor-pointer transition-colors group"
                      >
                        {/* Contract Number & Name */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors ml-1" />
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-[#16a34a] transition-colors">
                                {c.Contract_Number}
                              </div>
                              {hasLowBalance && (
                                <div className="inline-flex items-center gap-1 mt-1 bg-[#fffbeb] text-[#b45309] border border-[#fde68a] text-[10px] font-bold px-2 py-0.5 rounded-md">
                                  <AlertTriangle className="w-3 h-3 text-[#d97706]" />
                                  <span>יתרה נמוכה (&lt;40 מ״ק)</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Activity Type / Description */}
                        <td className="py-4 px-4 text-slate-700">
                          <div className="font-medium">{c.Contract_Name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{c.Contractor}</div>
                        </td>

                        {/* Soft Pastel Status Badge */}
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-block text-xs font-semibold px-3 py-1 rounded-lg ${getStatusBadge(
                              c.Status
                            )}`}
                          >
                            {c.Status}
                          </span>
                        </td>

                        {/* Location / Forest */}
                        <td className="py-4 px-4 text-slate-700">
                          <div className="font-medium">{c.Block}</div>
                          <div className="text-xs text-slate-400">{c.Region}</div>
                        </td>

                        {/* Date / Year */}
                        <td className="py-4 px-4 text-slate-600 tabular-nums text-xs">
                          {c.StartDate}
                        </td>

                        {/* Forester Supervisor */}
                        <td className="py-4 px-4 text-slate-700 font-medium text-xs">
                          {c.Supervisor}
                        </td>

                        {/* Actions (Three dots menu matching Image 2) */}
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectContract(c);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="פתח דף פנימי"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 3. Modern Pagination Bar matching Image 2 */}
          <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
            {/* Found Records Count */}
            <div>
              נמצאו: <strong className="text-slate-800 font-semibold">{filtered.length}</strong> רשומות
            </div>

            {/* Pagination Controls with Green Outline Circle */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, k) => k + 1).filter((n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1).map((pageNum, i, arr) => {
                const isActive = pageNum === currentPage;
                return (
                  <React.Fragment key={pageNum}>{i > 0 && pageNum - arr[i - 1] > 1 && <span className="text-slate-400 text-xs px-0.5">…</span>}<button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'border-2 border-[#16a34a] text-[#16a34a] font-bold bg-emerald-50/50'
                        : 'text-slate-600 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    {pageNum}
                  </button></React.Fragment>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
