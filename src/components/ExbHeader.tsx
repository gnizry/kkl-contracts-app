import React from 'react';
import { Trees, AlertTriangle, FileSpreadsheet, Layers, RefreshCw } from 'lucide-react';
import { Contract } from '../types/forestry';
import { isLowBalance } from '../utils/licenses';

interface ExbHeaderProps {
  contracts: Contract[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSurvey123Modal: () => void;
  onExportCsv: () => void;
}

export const ExbHeader: React.FC<ExbHeaderProps> = ({
  contracts,
  activeTab,
  setActiveTab,
  onOpenSurvey123Modal,
  onExportCsv,
}) => {
  // Aggregate KPIs
  const activeContractsCount = contracts.filter(
    (c) => c.Status === 'בביצוע' || c.Status === 'בתכנון' || c.Status === 'אושר לביצוע'
  ).length;

  const totalApprovedMQ = contracts.reduce((acc, c) => acc + c.TotalApprovedMQ, 0);
  const totalDeliveredMQ = contracts.reduce((acc, c) => acc + c.TotalDeliveredMQ, 0);

  // Count removing licenses with balance < 40 MQ
  let lowBalanceLicensesCount = 0;
  contracts.forEach((c) => {
    c.Felling_Licenses.forEach((fl) => {
      fl.Removing_Licenses.forEach((rl) => {
        if (isLowBalance(rl)) {
          lowBalanceLicensesCount++;
        }
      });
    });
  });

  return (
    <header className="bg-[#1b3d2f] text-white border-b-4 border-[#2e7d32] shadow-sm sticky top-0 z-40">
      {/* Top Bar Shell */}
      <div className="max-w-[1720px] mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#2e7d32] border border-[#4caf50]/40 flex items-center justify-center shadow-inner">
            <Trees className="w-7 h-7 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight font-['Rubik',sans-serif] text-emerald-50">
                מערכת ניהול התקשרויות קק״ל
              </h1>
              <span className="text-[11px] tabular-nums uppercase bg-[#132c22] text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                ArcGIS ExB
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              לוח מחוונים מרכזי לניהול יערני, רישיונות כריתה ונטילה, יומנים ושינוע עץ
            </p>
          </div>
        </div>

        {/* Dynamic KPI Indicators in Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-[#142e23] border border-emerald-700/50 rounded-xl px-4 py-2 flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-emerald-300 font-medium">התקשרויות פעילות</div>
              <div className="text-lg font-bold tabular-nums tabular-nums text-white leading-tight">
                {activeContractsCount}
                <span className="text-xs text-emerald-400 font-normal mr-1">/ {contracts.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#142e23] border border-emerald-700/50 rounded-xl px-4 py-2 flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-emerald-300 font-medium">נפח מאושר כולל</div>
              <div className="text-lg font-bold tabular-nums tabular-nums text-emerald-200 leading-tight">
                {totalApprovedMQ.toLocaleString('he-IL')}
                <span className="text-xs text-emerald-400 mr-1">מ״ק</span>
              </div>
            </div>
          </div>

          <div className="bg-[#142e23] border border-emerald-700/50 rounded-xl px-4 py-2 flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-emerald-300 font-medium">נפח שפונה בפועל</div>
              <div className="text-lg font-bold tabular-nums tabular-nums text-emerald-300 leading-tight">
                {totalDeliveredMQ.toLocaleString('he-IL')}
                <span className="text-xs text-emerald-400 mr-1">מ״ק</span>
              </div>
            </div>
          </div>

          {/* Critical Low Balance Warning Indicator */}
          <div
            className={`border rounded-xl px-4 py-2 flex items-center gap-2.5 transition-all shadow-xs ${
              lowBalanceLicensesCount > 0
                ? 'bg-[#4a1515] border-red-500/80 text-red-100 animate-pulse'
                : 'bg-[#142e23] border-emerald-700/50 text-emerald-300'
            }`}
            title="רישיונות נטילה עם יתרה נמוכה מ-40 מ״ק"
          >
            <AlertTriangle className={`w-5 h-5 ${lowBalanceLicensesCount > 0 ? 'text-red-300' : 'text-emerald-400'}`} />
            <div className="text-right">
              <div className="text-[11px] font-medium opacity-90">יתרה קריטית (&lt;40 מ״ק)</div>
              <div className="text-lg font-bold tabular-nums tabular-nums leading-tight">
                {lowBalanceLicensesCount}
                <span className="text-xs mr-1">רישיונות ⚠️</span>
              </div>
            </div>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={onExportCsv}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-[#25523b] hover:bg-[#2e6549] text-white border border-emerald-600/40 transition-colors shadow-xs cursor-pointer mr-1"
            title="ייצוא כל הנתונים לקובץ CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>ייצוא CSV</span>
          </button>
        </div>
      </div>

      {/* Multi-page Navigation Bar */}
      <div className="bg-[#142e23] border-t border-[#25523b] px-6">
        <div className="max-w-[1720px] mx-auto flex items-center justify-between overflow-x-auto py-1.5 text-sm">
          <nav className="flex items-center gap-2 whitespace-nowrap">
            {[
              { id: 'landing', label: 'סקירה כללית ומפה ארצית' },
              { id: 'contracts', label: 'התקשרויות' },
              { id: 'licenses', label: 'רישיונות כריתה ונטילה' },
              { id: 'delivery-notes', label: 'תעודות משלוח' },
              { id: 'work-logs', label: 'יומני עבודה' },
              { id: 'contractors', label: 'קבלנים מורשים' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#2e7d32] text-white shadow-xs'
                      : 'text-emerald-200/80 hover:text-white hover:bg-[#1b3d2f]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-3 text-xs text-emerald-300/70 shrink-0">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>שכבות GIS פעילות: 7</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
