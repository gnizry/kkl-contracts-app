import React from 'react';
import {
  Trees,
  TrendingUp,
  AlertCircle,
  MapPin,
  ChevronLeft,
  Truck,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Contract } from '../types/forestry';
import { MapPanel } from './MapPanel';
import { ModernKpiCards } from './ModernKpiCards';

interface LandingPageViewProps {
  contracts: Contract[];
  onSelectContract: (contract: Contract) => void;
  onNavigateToTab: (tabId: string) => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  contracts,
  onSelectContract,
  onNavigateToTab,
}) => {
  // Soft pastel badge styling matching the reference screenshots
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'בתכנון':
        return 'bg-[#e8f1fd] text-[#2563eb]';
      case 'אושר לביצוע':
        return 'bg-[#fef9c3] text-[#a16207]';
      case 'בביצוע':
        return 'bg-[#ecfdf5] text-[#059669]';
      case 'בדיקת שטח':
        return 'bg-[#f5f3ff] text-[#7c3aed]';
      case 'הסתיים':
        return 'bg-[#f1f5f9] text-[#475569]';
      default:
        return 'bg-[#f1f5f9] text-[#475569]';
    }
  };

  // Recent simulated alerts matching Image 1
  // Dynamic activity feed derived from the data: latest work logs (safety incidents are critical)
  const recentAlerts = contracts
    .flatMap((c) => c.WorkLogs.map((l) => ({ l, c })))
    .sort((x, y) => y.l.Date.localeCompare(x.l.Date) || y.l.Log_ID.localeCompare(x.l.Log_ID))
    .slice(0, 4)
    .map(({ l, c }) => ({
      id: l.Log_ID,
      title: l.SafetyIncident
        ? `אירוע בטיחות ביומן ${l.Log_ID} - ${c.Contract_Name}`
        : `נקלט יומן עבודה ${l.Log_ID} - ${c.Contract_Name}`,
      time: l.Date,
      contractId: c.Contract_ID,
      isCritical: l.SafetyIncident,
    }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-5 text-right items-start">
      {/* Right column (RTL): KPIs + panels */}
      <div className="flex flex-col gap-5 min-w-0">
      <ModernKpiCards contracts={contracts} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Right Panel (in RTL): אירועים והתקשרויות אחרונות */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold font-['Rubik',sans-serif] text-slate-900">
                התקשרויות אחרונות
              </h3>
              <button
                onClick={() => onNavigateToTab('contracts')}
                className="text-sm font-semibold text-[#16a34a] hover:underline cursor-pointer"
              >
                לכל ההתקשרויות
              </button>
            </div>

            {/* List of Contracts with Soft Pastel Badges matching Image 1 */}
            <div className="flex flex-col divide-y divide-slate-100">
              {[...contracts].sort((a, b) => Number(b.Status === 'בביצוע') - Number(a.Status === 'בביצוע') || (b.StartDate || '').localeCompare(a.StartDate || '')).slice(0, 5).map((c) => (
                <div
                  key={c.Contract_ID}
                  onClick={() => onSelectContract(c)}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors cursor-pointer rounded-xl px-2 group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800 group-hover:text-[#16a34a] transition-colors">
                        {c.Contract_Number}
                      </span>
                      <span className="text-xs text-slate-400 font-sans">
                        • {c.Block}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">
                      {c.Contract_Name}
                    </div>
                  </div>

                  {/* Soft Pastel Rounded Badge */}
                  <div className="shrink-0">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-lg ${getStatusBadge(
                        c.Status
                      )}`}
                    >
                      {c.Status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Left Panel (in RTL): התרעות אחרונות */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold font-['Rubik',sans-serif] text-slate-900">
                פעילות אחרונה בשטח
              </h3>
              <span className="text-xs font-bold bg-[#ffe4e6] text-[#e11d48] px-2.5 py-0.5 rounded-lg">
                {recentAlerts.filter((a) => a.isCritical).length} אירועי בטיחות
              </span>
            </div>

            {/* List of Alerts matching Image 1 */}
            <div className="flex flex-col divide-y divide-slate-100">
              {recentAlerts.map((alt) => (
                <div
                  key={alt.id}
                  onClick={() => {
                    const c = contracts.find((item) => item.Contract_ID === alt.contractId);
                    if (c) onSelectContract(c);
                  }}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors cursor-pointer rounded-xl px-2"
                >
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-800">
                      {alt.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{alt.time}</div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4 stroke-[2]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      </div>

      {/* Left column (RTL): tall map of Israel */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/70 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col gap-3 xl:sticky xl:top-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold font-['Rubik',sans-serif] text-slate-900">מפת דיווח ביצוע</h3>
          <button onClick={() => onNavigateToTab('contracts')} className="text-xs font-semibold text-[#16a34a] hover:underline cursor-pointer">
            לרשימה המלאה ←
          </button>
        </div>
        <MapPanel contracts={contracts} onOpenContract={onSelectContract} height={780} compact />
      </div>
    </div>
  );
};
