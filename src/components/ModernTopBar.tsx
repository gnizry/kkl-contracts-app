import React from 'react';
import { Plus, User, FileSpreadsheet, SlidersHorizontal, Plug } from 'lucide-react';
import { useConnection } from '../connection';
import { Contract } from '../types/forestry';
import { isLowBalance } from '../utils/licenses';

interface ModernTopBarProps {
  contracts: Contract[];
  onOpenSurvey123: () => void;
  onExportCsv: () => void;
  onOpenContractBuilder?: () => void;
  totalContractsCount?: number;
  activeFilterCount?: number;
  onOpenFilters?: () => void;
}

export const ModernTopBar: React.FC<ModernTopBarProps> = ({
  contracts,
  onOpenSurvey123,
  onExportCsv,
  onOpenContractBuilder,
  totalContractsCount,
  activeFilterCount = 0,
  onOpenFilters,
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const conn = useConnection();
  const [userMenu, setUserMenu] = React.useState(false);

  // Count removing licenses with balance < 40 MQ
  const lowBalanceCount = contracts.reduce((acc, c) => {
    return (
      acc +
      c.Felling_Licenses.reduce((flAcc, fl) => {
        return (
          flAcc +
          fl.Removing_Licenses.filter((rl) => isLowBalance(rl)).length
        );
      }, 0)
    );
  }, 0);

  return (
    <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200/70 px-6 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Right Side (in RTL): Circular Green Action Button & Title */}
      <div className="flex items-center gap-4">
        {/* The Iconic Floating Green '+' Button from screenshots with dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              if (onOpenContractBuilder) {
                setIsMenuOpen(!isMenuOpen);
              } else {
                onOpenSurvey123();
              }
            }}
            className="w-11 h-11 rounded-full bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-md hover:shadow-lg flex items-center justify-center transition-all cursor-pointer transform hover:scale-105 active:scale-95 shrink-0"
            title="פעולה מהירה: הקמת התקשרות או דיווח Survey123"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>

          {isMenuOpen && (
            <div className="absolute top-13 right-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 flex flex-col gap-1 text-right animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenContractBuilder?.();
                }}
                className="w-full p-2.5 rounded-xl hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#16a34a] flex items-center justify-center">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <div>הקמת התקשרות חדשה</div>
                  <div className="text-[10px] text-slate-400 font-normal">סביבת בניית מנות ועומדים</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenSurvey123();
                }}
                className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div>דיווח שטח יומן (Survey123)</div>
                  <div className="text-[10px] text-slate-400 font-normal">הוספת עובדים, כלים והערות</div>
                </div>
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold font-['Rubik',sans-serif] text-slate-900 tracking-tight">
              מערכת ניהול התקשרויות
            </h1>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
              קק״ל יערני
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            תמונת מצב וניהול כולל: מנות, עומדים, רישיונות, יומני עבודה ושינוע
          </p>
        </div>
      </div>

      {/* Left Side: Critical Alert status, Export CSV, and User pill */}
      <div className="flex items-center gap-3">
        {lowBalanceCount > 0 && (
          <div className="hidden sm:flex items-center gap-2 bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>{lowBalanceCount} רישיונות ביתרה נמוכה (&lt;40 מ״ק) ⚠️</span>
          </div>
        )}

        {/* Global filters */}
        <button
          onClick={onOpenFilters}
          className={`relative flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border shadow-2xs transition-colors cursor-pointer ${
            activeFilterCount > 0
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
          }`}
          title="סינון: מרחב, אזור, גוש, סטטוס, שנה"
        >
          <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
          <span>סינון</span>
          {activeFilterCount > 0 && (
            <span className="min-w-5 h-5 px-1 rounded-full bg-[#16a34a] text-white text-[10px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Export CSV button */}
        <button
          onClick={onExportCsv}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          title="ייצוא נתונים ל-CSV"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>ייצוא CSV</span>
        </button>

        {/* User Profile Pill (+ תפריט עם הגדרות חיבור) */}
        <div className="relative">
          <button onClick={() => setUserMenu((v) => !v)} className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[11px]">יע</div>
            <div className="hidden md:block text-right leading-tight">
              <div className="font-bold text-slate-800">רועי שמיר</div>
              <div className="text-[10px] text-slate-400">יערן מרחב צפון</div>
            </div>
          </button>
          {userMenu && (
            <div className="absolute left-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-1.5 text-xs">
              <button onClick={() => { setUserMenu(false); conn.openModal(); }} className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer">
                <span className="flex items-center gap-2"><Plug className="w-4 h-4 text-slate-500" />הגדרות חיבור ל-ArcGIS</span>
                <span className={`w-2 h-2 rounded-full ${conn.status === 'connected' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
