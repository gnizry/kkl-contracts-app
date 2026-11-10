import React from 'react';
import { Bell, GanttChartSquare, ShieldCheck } from 'lucide-react';
import { Contract } from '../types/forestry';
import { AlertsCenterView } from './AlertsCenterView';
import { TimelineView } from './TimelineView';
import { DataQualityView } from './DataQualityView';
import { buildAlerts, buildDataQuality } from '../utils/insights';

interface Props {
  contracts: Contract[];
  tab: 'alerts' | 'timeline' | 'quality';
  setTab: (t: 'alerts' | 'timeline' | 'quality') => void;
  onOpenContract: (c: Contract) => void;
  onShowOnMap: (c: Contract) => void;
}

export const MonitoringView: React.FC<Props> = ({ contracts, tab, setTab, onOpenContract, onShowOnMap }) => {
  const alertCount = buildAlerts(contracts).length;
  const dqCount = buildDataQuality(contracts).filter((r) => r.bad > 0).length;
  const tabs = [
    { id: 'alerts', label: 'מרכז התראות', icon: Bell, badge: alertCount },
    { id: 'timeline', label: 'ציר זמן', icon: GanttChartSquare, badge: 0 },
    { id: 'quality', label: 'איכות נתונים', icon: ShieldCheck, badge: dqCount },
  ] as const;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200 self-start">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${tab === t.id ? 'bg-[#16a34a] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
              <Icon className="w-4 h-4" />
              {t.label}
              {t.badge > 0 && <span className={`min-w-5 h-5 px-1.5 rounded-full text-[10px] flex items-center justify-center ${tab === t.id ? 'bg-white/25 text-white' : 'bg-rose-100 text-[#e11d48]'}`}>{t.badge}</span>}
            </button>
          );
        })}
      </div>
      {tab === 'alerts' && <AlertsCenterView contracts={contracts} onOpenContract={onOpenContract} onShowOnMap={onShowOnMap} />}
      {tab === 'timeline' && <TimelineView contracts={contracts} onOpenContract={onOpenContract} />}
      {tab === 'quality' && <DataQualityView contracts={contracts} onOpenContract={onOpenContract} />}
    </div>
  );
};
