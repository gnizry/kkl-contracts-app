import React from 'react';
import { Clock, Eye, CheckCircle2, AlertCircle, Layers, Truck } from 'lucide-react';
import { Contract } from '../types/forestry';
import { isLowBalance } from '../utils/licenses';

interface ModernKpiCardsProps {
  contracts: Contract[];
}

export const ModernKpiCards: React.FC<ModernKpiCardsProps> = ({ contracts }) => {
  const activeContractsCount = contracts.filter(
    (c) => c.Status === 'בביצוע' || c.Status === 'אושר לביצוע'
  ).length;

  const totalApprovedMQ = contracts.reduce((acc, c) => acc + c.TotalApprovedMQ, 0);
  const totalDeliveredMQ = contracts.reduce((acc, c) => acc + c.TotalDeliveredMQ, 0);

  let lowBalanceCount = 0;
  contracts.forEach((c) => {
    c.Felling_Licenses.forEach((fl) => {
      fl.Removing_Licenses.forEach((rl) => {
        if (isLowBalance(rl)) {
          lowBalanceCount++;
        }
      });
    });
  });

  const cards = [
    {
      title: 'התקשרויות פעילות',
      value: activeContractsCount,
      unit: '',
      subtitle: `מתוך ${contracts.length} התקשרויות רשומות`,
      icon: CheckCircle2,
      badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: 'נפח מאושר כולל',
      value: totalApprovedMQ.toLocaleString('he-IL'),
      unit: 'מ״ק',
      subtitle: 'לפי תוכניות ממשק וסניטציה',
      icon: Layers,
      badgeBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'נפח שפונה בפועל',
      value: totalDeliveredMQ.toLocaleString('he-IL'),
      unit: 'מ״ק',
      subtitle: `${Math.round((totalDeliveredMQ / totalApprovedMQ) * 100)}% ביצוע כולל`,
      icon: Truck,
      badgeBg: 'bg-purple-50 text-purple-600 border-purple-100',
    },
    {
      title: 'חריגות מ-40 מ״ק (יתרה נמוכה)',
      value: lowBalanceCount,
      unit: 'רישיונות',
      subtitle: 'נדרש חידוש רישיון נטילה',
      icon: AlertCircle,
      badgeBg: 'bg-rose-50 text-rose-600 border-rose-100',
      isWarning: lowBalanceCount > 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-3xl p-5 border border-slate-200/70 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between text-right relative overflow-hidden group"
          >
            {/* Title at Top */}
            <div className="text-sm font-semibold text-slate-600">{card.title}</div>

            {/* Big Bold Clean Number */}
            <div className="my-3 flex items-baseline gap-1.5">
              <span className="text-3xl md:text-4xl font-extrabold font-['Rubik',sans-serif] text-slate-900 tracking-tight">
                {card.value}
              </span>
              {card.unit && (
                <span className="text-sm font-medium text-slate-500 font-sans">{card.unit}</span>
              )}
            </div>

            {/* Bottom Subtitle & Soft Colored Icon Badge (Matching Reference Screenshot) */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
              <span className="text-xs text-slate-400">{card.subtitle}</span>

              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-2xs ${card.badgeBg}`}
              >
                <Icon className="w-4 h-4 stroke-[2]" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
