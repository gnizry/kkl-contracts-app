import { fmtDMY } from '../utils/insights';
import React, { useState } from 'react';
import {
  ClipboardList,
  Search,
  Users,
  Wrench,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import { Contract, WorkLog } from '../types/forestry';
import { FilterSelect, SearchBox, ViewSwitcher, ExportButton, Toolbar, Pager, MapCard, CARD, KpiRow } from './ListKit';
import { IsraelMap } from './IsraelMap';
import { SmartNationalMap } from './SmartMap';

interface WorkLogsViewProps {
  contracts: Contract[];
  onSelectWorkLog: (log: WorkLog, contract: Contract) => void;
  onOpenSurvey123: () => void;
}

export const WorkLogsView: React.FC<WorkLogsViewProps> = ({
  contracts,
  onSelectWorkLog,
  onOpenSurvey123,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [safetyFilter, setSafetyFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Collect all work logs
  const allLogs: { log: WorkLog; contract: Contract }[] = [];
  contracts.forEach((c) => {
    c.WorkLogs.forEach((wl) => {
      allLogs.push({ log: wl, contract: c });
    });
  });

  // Sort newest first
  allLogs.sort(
    (a, b) => new Date(b.log.Date).getTime() - new Date(a.log.Date).getTime()
  );

  const regions = Array.from(new Set(contracts.map((c) => c.Region)));

  const filtered = allLogs.filter(({ log, contract }) => {
    if (regionFilter && contract.Region !== regionFilter) return false;
    if (safetyFilter === 'incident' && !log.SafetyIncident) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.Log_ID.toLowerCase().includes(term) ||
      log.Workers.toLowerCase().includes(term) ||
      log.Equipment.toLowerCase().includes(term) ||
      log.SupervisorComments.toLowerCase().includes(term) ||
      log.StandsWorked.toLowerCase().includes(term) ||
      contract.Contract_Name.toLowerCase().includes(term)
    );
  });

  const nf = (n: number) => Math.round(n).toLocaleString('he-IL');
  const hrs = (a: string, b: string) => { const [h1, m1] = (a || '0:0').split(':').map(Number); const [h2, m2] = (b || '0:0').split(':').map(Number); const d = (h2 * 60 + m2 - (h1 * 60 + m1)) / 60; return d > 0 ? d : 0; };
  const kHours = filtered.reduce((a, f) => a + hrs(f.log.StartTime, f.log.EndTime), 0);
  const kIncidents = filtered.filter((f) => f.log.SafetyIncident).length;
  const latest = filtered.length ? new Date(filtered[0].log.Date).getTime() : 0;
  const kRecent = filtered.filter((f) => latest - new Date(f.log.Date).getTime() <= 30 * 86400000).length;
  const kContracts = new Set(filtered.map((f) => f.contract.Contract_ID)).size;

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="flex flex-col gap-5 text-right font-['Rubik','Assistant',sans-serif]">
      <KpiRow items={[
        { label: 'יומני עבודה', value: nf(filtered.length) },
        { label: '30 ימים אחרונים', value: nf(kRecent), sub: 'לפי הדיווח האחרון' },
        { label: 'שעות עבודה', value: nf(kHours) },
        { label: 'אירועי בטיחות', value: nf(kIncidents), tone: kIncidents ? '#be123c' : '#047857', sub: kIncidents ? 'דורש מעקב' : 'ללא אירועים' },
        { label: 'התקשרויות עם דיווח', value: nf(kContracts) },
      ]} />

      <Toolbar
        left={
          <>
            <FilterSelect value={safetyFilter} onChange={(v) => { setSafetyFilter(v); setCurrentPage(1); }} allLabel="כל היומנים" options={[{ value: 'incident', label: 'עם אירוע בטיחות' }]} />
            <FilterSelect value={regionFilter} onChange={(v) => { setRegionFilter(v); setCurrentPage(1); }} allLabel="כל המרחבים" options={regions} />
            <SearchBox value={searchTerm} onChange={(v) => { setSearchTerm(v); setCurrentPage(1); }} placeholder="חיפוש ביומנים, צוות, כלים, הערות מפקח..." />
          </>
        }
        right={
          <>
            <ViewSwitcher mode={viewMode} onChange={setViewMode} />
            <button
              onClick={onOpenSurvey123}
              className="flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-bold rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-white shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <span>יומן חדש +</span>
            </button>
            <ExportButton title="ייצוא יומנים" />
          </>
        }
      />

      {viewMode === 'map' ? (
        <MapCard>
          <SmartNationalMap><IsraelMap contracts={Array.from(new Set(filtered.map((f) => f.contract)))} onSelectContract={(c) => { setSearchTerm(c.Contract_Name); setViewMode('table'); setCurrentPage(1); }} /></SmartNationalMap>
        </MapCard>
      ) : (
      <div className={`${CARD} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-medium text-xs select-none">
                <th className="py-4 px-6 text-right">מס׳ יומן</th>
                <th className="py-4 px-4 text-right">התקשרות ועומדים פעילים</th>
                <th className="py-4 px-4 text-right">תאריך ושעות</th>
                <th className="py-4 px-4 text-right">צוות וכלי עבודה</th>
                <th className="py-4 px-4 text-right">הערות יערן שטח</th>
                <th className="py-4 px-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 text-sm">
                    לא נמצאו יומני עבודה התואמים את החיפוש.
                  </td>
                </tr>
              ) : (
                paginated.map(({ log, contract }) => (
                  <tr
                    key={log.Log_ID}
                    onClick={() => onSelectWorkLog(log, contract)}
                    className="hover:bg-slate-50/70 cursor-pointer transition-colors group"
                  >
                    {/* Log ID */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors ml-1" />
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-[#16a34a] transition-colors tabular-nums">
                            {log.Log_ID}
                          </div>
                          <div className="text-xs text-slate-400 tabular-nums mt-0.5">
                            {contract.Contract_Number}
                          </div>
                          {log.SafetyIncident && (
                            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-[#e11d48] border border-rose-200">אירוע בטיחות</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contract & Stands */}
                    <td className="py-4 px-4 text-slate-700">
                      <div className="font-medium text-slate-900">{contract.Contract_Name}</div>
                      <div className="text-xs text-emerald-800 tabular-nums mt-0.5 bg-emerald-50 px-2 py-0.5 rounded inline-block font-semibold">
                        עומדים: {log.StandsWorked}
                      </div>
                    </td>

                    {/* Date & Hours */}
                    <td className="py-4 px-4 text-slate-700">
                      <div className="font-medium tabular-nums text-xs text-slate-900">{fmtDMY(log.Date)}</div>
                      <div className="text-xs text-slate-400 tabular-nums mt-0.5">
                        {log.StartTime} - {log.EndTime}
                      </div>
                    </td>

                    {/* Crew & Tools */}
                    <td className="py-4 px-4 text-slate-700 max-w-xs">
                      <div className="text-xs text-slate-800 flex items-center gap-1.5 truncate">
                        <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{log.Workers}</span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 truncate mt-1">
                        <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{log.Equipment}</span>
                      </div>
                    </td>

                    {/* Supervisor Comments */}
                    <td className="py-4 px-4 text-slate-600 text-xs max-w-sm">
                      <p className="line-clamp-2 leading-relaxed">{log.SupervisorComments}</p>
                    </td>

                    {/* Action Menu */}
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWorkLog(log, contract);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pager total={filtered.length} page={currentPage} totalPages={totalPages} onPage={setCurrentPage} />
      </div>
      )}
    </div>
  );
};
