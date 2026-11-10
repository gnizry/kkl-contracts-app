import React from 'react';
import {
  Home,
  ListTodo,
  FileText,
  Truck,
  Users,
  Building2,
  Settings,
  Map as MapIcon,
  Activity,
  BarChart3,
} from 'lucide-react';

interface ModernRightSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSettings?: () => void;
}

export const ModernRightSidebar: React.FC<ModernRightSidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
}) => {
  const navItems = [
    { id: 'landing', label: 'ראשי', icon: Home },
    { id: 'map', label: 'מפה', icon: MapIcon },
    { id: 'contracts', label: 'התקשרויות', icon: ListTodo },
    { id: 'licenses', label: 'רישיונות', icon: FileText },
    { id: 'delivery-notes', label: 'תעודות משלוח', icon: Truck },
    { id: 'work-logs', label: 'יומני עבודה', icon: Users },
    { id: 'contractors', label: 'קבלנים', icon: Building2 },
    { id: 'monitoring', label: 'ניטור ובקרה', icon: Activity },
    { id: 'stats', label: 'סטטיסטיקות', icon: BarChart3 },
  ];

  return (
    <aside className="w-[84px] md:w-[92px] bg-white border-l border-slate-200/80 min-h-screen flex flex-col items-center py-4 gap-3 shrink-0 z-30 select-none shadow-[2px_0_12px_rgba(0,0,0,0.02)]">
      {/* Navigation Buttons Stack */}
      <nav className="flex-1 flex flex-col items-center gap-1 w-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full py-2.5 px-1 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all relative group cursor-pointer ${
                isActive
                  ? 'text-[#16a34a] font-bold bg-emerald-50/70'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {/* Active Pill Indicator on right side */}
              {isActive && (
                <span className="absolute -right-2 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-[#16a34a] rounded-l-full" />
              )}

              <Icon
                className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-[#16a34a] stroke-[2.2]' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              <span className={`text-[11px] leading-tight text-center ${isActive ? 'font-bold' : 'font-normal'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Settings Link */}
      <div className="w-full px-2 pt-4 border-t border-slate-100 flex flex-col items-center">
        <button
          onClick={() => onOpenSettings?.()}
          className="w-full py-2 flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 cursor-pointer rounded-xl hover:bg-slate-50"
          title="הגדרות מערכת וביטויי Arcade"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">הגדרות</span>
        </button>
      </div>
    </aside>
  );
};
