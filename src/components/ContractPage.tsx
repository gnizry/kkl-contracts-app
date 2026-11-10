import React, { useState } from 'react';
import { ArrowRight, Edit3, Sliders, ClipboardPen, FileText, Radio, Database } from 'lucide-react';
import { PopupModel, statusColors } from '../utils/popupModel';
import {
  StatusStepper, DetailsGrid, balanceBadge, fmt, vol,
  ManotBody, StandsBody, LicensesBody, CertsBody, LogsBody, FlatProvider,
} from './ContractPopupCard';

interface Props {
  model: PopupModel;
  live: boolean;
  map: React.ReactNode;
  onBack: () => void;
  backLabel?: string;
  onOpenSurvey123?: () => void;
  onOpenStatusManager?: () => void;
  onOpenContractEditor?: () => void;
  notice?: string;
}

const Kpi: React.FC<{ label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: string }> = ({ label, value, sub, tone = '#0F172A' }) => (
  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]">
    <div className="text-[11.5px] text-slate-500 font-semibold mb-1">{label}</div>
    <div className="text-2xl font-bold tabular-nums leading-tight" style={{ color: tone }}>{value}</div>
    {sub && <div className="text-[11.5px] text-slate-500 mt-0.5">{sub}</div>}
  </div>
);

const Ring: React.FC<{ pct: number }> = ({ pct }) => {
  const color = pct === 100 ? '#059669' : pct > 0 ? '#3B82F6' : '#CBD5E1';
  return (
    <div className="relative w-16 h-16 shrink-0" title="מבוסס על שטח העומדים בסטטוס בוצע מתוך שטח ההתקשרות">
      <svg viewBox="0 0 36 36" className="w-16 h-16">
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="3.5" />
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={color} strokeWidth="3.5" strokeDasharray={`${pct}, 100`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-extrabold">{pct}%</div>
    </div>
  );
};

type Tab = 'overview' | 'stands' | 'licenses' | 'certs' | 'logs';

export const ContractPage: React.FC<Props> = ({ model: m, live, map, onBack, backLabel = 'חזרה לרשימת ההתקשרויות', onOpenSurvey123, onOpenStatusManager, onOpenContractEditor, notice }) => {
  const [tab, setTab] = useState<Tab>('overview');
  const sc = statusColors(m.status);
  const bal = balanceBadge(m);
  const standsCount = m.manot.reduce((a, x) => a + x.stands.length, 0);
  const remCount = m.cuts.reduce((a, c) => a + c.rems.length, 0) + m.orphanRems.length;
  const lowBal = m.totalActiveBalance >= 1 && m.totalActiveBalance <= 40;

  const tabs: { id: Tab; label: string; count?: string | number; show: boolean }[] = [
    { id: 'overview', label: 'סקירה ומנות', count: m.manot.filter((x) => x.order !== 'ללא שיוך').length, show: true },
    { id: 'stands', label: 'עומדים', count: standsCount, show: standsCount > 0 },
    { id: 'licenses', label: 'רישיונות', count: `${m.cuts.length}/${remCount}`, show: true },
    { id: 'certs', label: 'תעודות משלוח', count: m.certs.length, show: true },
    { id: 'logs', label: 'יומני עבודה', count: `${m.logs.length}${m.hasMoreLogs ? '+' : ''}`, show: true },
  ];

  const btn = 'inline-flex items-center gap-2 px-4 py-2 rounded-2xl border shadow-2xs transition-colors cursor-pointer text-xs md:text-sm font-semibold';

  return (
    <div dir="rtl" className="flex flex-col gap-5 text-right font-['Rubik','Assistant',sans-serif]">
      {/* פעולות */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={onBack} className={`${btn} bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80`}>
          <ArrowRight className="w-4 h-4 text-[#16a34a]" /><span>{backLabel}</span>
        </button>
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border ${live ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
            {live ? <Radio className="w-3.5 h-3.5" /> : <Database className="w-3.5 h-3.5" />}{live ? 'נתונים חיים מהפורטל' : 'נתוני דמו'}
          </span>
          {m.reportUrl && <a href={m.reportUrl} target="_blank" rel="noreferrer" className={`${btn} bg-[#f0f9f4] text-[#1a7431] border-[#1a7431] no-underline`}><FileText className="w-4 h-4" />הפקת דוח (PDF)</a>}
          {onOpenContractEditor && <button onClick={onOpenContractEditor} className={`${btn} bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80`}><Edit3 className="w-4 h-4 text-[#16a34a]" />עריכת התקשרות ומנות</button>}
          {onOpenStatusManager && <button onClick={onOpenStatusManager} className={`${btn} bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200`}><Sliders className="w-4 h-4 text-emerald-600" />עדכון סטטוסים</button>}
        </div>
      </div>
      {notice && <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">{notice}</div>}

      {/* כותרת – כמו בפופאפ */}
      <div className="bg-white border border-slate-200/70 rounded-3xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="h-1.5" style={{ background: sc.main }} />
        <div className="p-6 md:p-7 flex flex-wrap items-start justify-between gap-5">
          <div className="flex-1 min-w-[300px]">
            <div className="flex items-center gap-2.5 flex-wrap mb-2">
              <span className="text-sm font-bold px-3.5 py-1 rounded-full shadow-sm" style={{ background: sc.main, color: sc.text }}>{m.status}</span>
              {bal && <span className="text-[13px] font-bold px-2.5 py-1 rounded-md border" style={{ color: bal.fg, background: bal.bg, borderColor: bal.bd }}>{bal.t}</span>}
              <span className="text-xs text-slate-400">שנת תוכנית {m.year}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-blue-900 leading-snug">{m.name}</h1>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[13.5px] text-slate-500">
              <span>קבלן זוכה: <b className="text-slate-900">{m.contractor}</b></span>
              {m.subContractor && m.subContractor !== '-' && <span>קבלן משנה: <b className="text-slate-900">{m.subContractor}</b></span>}
              {m.workManager && m.workManager !== '-' && <span>מנהל עבודה: <b className="text-slate-900">{m.workManager}</b></span>}
              <span>אזור: <b className="text-slate-900">{m.region}</b>{m.gush && m.gush !== '-' && <> · גוש <b className="text-slate-900">{m.gush}</b></>}</span>
            </div>
            {m.forests && m.forests !== '-' && <div className="mt-1.5 text-[13.5px] text-slate-500">יערות: <b className="text-slate-900">{m.forests}</b></div>}
          </div>
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="flex items-center gap-3"><Ring pct={m.execPct} /><div className="text-[12px] text-slate-600 leading-tight"><b className="text-sm text-slate-800">ביצוע</b><br /><span dir="ltr">{fmt(m.doneArea)} / {fmt(m.areaDunam)}</span><br />דונם</div></div>
            {m.surveyLink && (
              <a href={m.surveyLink} className="mt-1 inline-flex items-center gap-2 bg-[#5C6BC0] hover:bg-[#4f5db0] text-white py-2.5 px-4 rounded-xl shadow border border-[#3F51B5] font-bold text-[13px] no-underline">
                <ClipboardPen className="w-4 h-4" />צילום מסמכים ורישום עובדים וציוד
              </a>
            )}
            {!m.surveyLink && onOpenSurvey123 && (
              <button onClick={onOpenSurvey123} className="mt-1 inline-flex items-center gap-2 bg-[#5C6BC0] hover:bg-[#4f5db0] text-white py-2.5 px-4 rounded-xl shadow border border-[#3F51B5] font-bold text-[13px] cursor-pointer">
                <ClipboardPen className="w-4 h-4" />הוסף עובדים/ציוד (Survey123)
              </button>
            )}
          </div>
        </div>
        <div className="px-6 md:px-7 pb-6 border-t border-slate-100 pt-5"><StatusStepper m={m} title={false} /></div>
      </div>

      {/* מדדים */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Kpi label="שטח כולל" value={<>{fmt(m.areaDunam)} <span className="text-sm font-medium text-slate-500">דונם</span></>} sub={`${standsCount} עומדים · ${m.manot.filter((x) => x.order !== 'ללא שיוך').length} מנות`} />
        <Kpi label="בוצע" value={<>{fmt(m.doneArea)} <span className="text-sm font-medium text-slate-500">דונם</span></>} sub={`${m.execPct}% מהשטח`} tone="#059669" />
        <Kpi label="יתרת נטילה" value={m.totalActiveBalance >= 1 ? vol(m.totalActiveBalance) : m.overdrafts.length ? 'חריגה' : '—'} sub={lowBal ? 'יתרה נמוכה (≤40 מ"ק)' : `${remCount} רישיונות נטילה`} tone={m.totalActiveBalance >= 1 ? (lowBal ? '#D97706' : '#059669') : m.overdrafts.length ? '#DC2626' : '#64748B'} />
        <Kpi label="כמות בתעודות" value={vol(m.certsVolume)} sub={`${m.certs.length} תעודות משלוח`} tone="#0369A1" />
        <Kpi label="רישיונות כריתה" value={m.cuts.length} sub="רישיונות אב" tone="#3730A3" />
        <Kpi label="יומני עבודה" value={`${m.logs.length}${m.hasMoreLogs ? '+' : ''}`} sub={m.logs.some((l) => l.events.length || l.violations.length) ? 'כולל אירועים/הפרות' : 'ללא אירועים חריגים'} tone="#B45309" />
      </div>

      {/* מפה + לשוניות */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-5 items-start">
        <div className="xl:sticky xl:top-4 flex flex-col gap-4">{map}</div>

        <div className="bg-white border border-slate-200/70 rounded-3xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="flex overflow-x-auto border-b border-slate-100 px-2 pt-2 gap-1 bg-slate-50/60">
            {tabs.filter((t) => t.show).map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-[13.5px] font-bold whitespace-nowrap rounded-t-xl border-b-2 cursor-pointer transition-colors ${tab === t.id ? 'bg-white text-blue-900 border-[#16a34a]' : 'text-slate-500 border-transparent hover:text-slate-800'}`}>
                {t.label}{t.count !== undefined && <span className="mr-1.5 text-[11px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{t.count}</span>}
              </button>
            ))}
          </div>
          <FlatProvider value={true}>
          <div className="p-5">
            {tab === 'overview' && (<><DetailsGrid m={m} /><div className="mt-4"><ManotBody m={m} /></div></>)}
            {tab === 'stands' && <StandsBody m={m} />}
            {tab === 'licenses' && <LicensesBody m={m} />}
            {tab === 'certs' && <CertsBody m={m} />}
            {tab === 'logs' && <LogsBody m={m} />}
          </div>
          </FlatProvider>
        </div>
      </div>
    </div>
  );
};
