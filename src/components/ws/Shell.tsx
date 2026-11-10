import React, { useEffect, useRef, useState } from 'react';
import { X, Minus, Maximize2, Minimize2, Info, GripHorizontal, Lock, Check } from 'lucide-react';

/* ---------- תגיות "איזה רכיב ExB מממש את החלק הזה" ---------- */
export type ExbKind = 'edit' | 'list' | 'analysis' | 'survey' | 'map' | 'button';
const EXB: Record<ExbKind, { label: string; cls: string }> = {
  edit: { label: 'Edit widget', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  list: { label: 'List widget', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  analysis: { label: 'Analysis widget · Custom tool (GP)', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  survey: { label: 'Survey123 · Embed', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  map: { label: 'Map widget', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
  button: { label: 'Button widget', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
};
export const ExbTag: React.FC<{ kind: ExbKind; note?: string }> = ({ kind, note }) => (
  <span title={note} className={`inline-flex items-center text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${EXB[kind].cls}`}>{EXB[kind].label}</span>
);

/* ---------- חלון צף (Widget Controller → Floating panel) ---------- */
interface PanelProps {
  title: string;
  subtitle?: string;
  width?: number;
  onClose: () => void;
  legend?: { step: string; kind: ExbKind; text: string }[];
  children: React.ReactNode;
  footer?: React.ReactNode;
}
export const FloatingPanel: React.FC<PanelProps> = ({ title, subtitle, width = 640, onClose, legend, children, footer }) => {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 28, y: 92 });
  const [wide, setWide] = useState(false);
  const [mini, setMini] = useState(false);
  const [info, setInfo] = useState(false);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const w = wide ? Math.min(980, window.innerWidth - 40) : Math.min(width, window.innerWidth - 24);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!drag.current) return;
      setPos({
        x: Math.max(4, Math.min(window.innerWidth - 120, e.clientX - drag.current.dx)),
        y: Math.max(4, Math.min(window.innerHeight - 60, e.clientY - drag.current.dy)),
      });
    };
    const up = () => { drag.current = null; };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, []);

  const iconBtn = 'p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors';
  return (
    <div
      dir="rtl"
      className="fixed z-50 bg-white rounded-2xl border border-slate-200 shadow-[0_18px_60px_-12px_rgba(15,23,42,0.28)] flex flex-col text-right font-['Rubik','Assistant',sans-serif]"
      style={{ left: pos.x, top: pos.y, width: w, maxHeight: `calc(100vh - ${pos.y}px - 14px)` }}
    >
      {/* כותרת – גרירה */}
      <div
        onPointerDown={(e) => { if ((e.target as HTMLElement).closest('button')) return; drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }; }}
        className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 cursor-move select-none touch-none rounded-t-2xl bg-white"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <GripHorizontal className="w-4 h-4 text-slate-300 shrink-0" />
          <div className="min-w-0">
            <div className="text-[15px] font-bold text-slate-900 truncate">{title}</div>
            {subtitle && <div className="text-[11.5px] text-slate-500 truncate">{subtitle}</div>}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {legend && <button onClick={() => setInfo((v) => !v)} title="איך זה נבנה ב-ExB" className={`${iconBtn} ${info ? 'bg-slate-100 text-slate-800' : ''}`}><Info className="w-4 h-4" /></button>}
          <button onClick={() => setMini((v) => !v)} title="מזעור" className={iconBtn}><Minus className="w-4 h-4" /></button>
          <button onClick={() => setWide((v) => !v)} title={wide ? 'צמצום' : 'הרחבה'} className={iconBtn}>{wide ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</button>
          <button onClick={onClose} title="סגירה" className={iconBtn}><X className="w-4 h-4" /></button>
        </div>
      </div>

      {!mini && (
        <>
          {info && legend && (
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 text-[12px] text-slate-600">
              <div className="font-bold text-slate-800 mb-1.5">מבנה ב-Experience Builder</div>
              <div className="text-slate-500 mb-2">חלון צף (Widget Controller) שמכיל Section/Views לפי שלבים. כל שלב מורכב מהרכיבים הבאים:</div>
              <div className="flex flex-col gap-1.5">
                {legend.map((l, i) => (
                  <div key={i} className="flex items-start gap-2"><span className="w-[92px] shrink-0 font-semibold text-slate-700">{l.step}</span><span className="shrink-0"><ExbTag kind={l.kind} /></span><span className="text-slate-500">{l.text}</span></div>
                ))}
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">{children}</div>
          {footer && <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl">{footer}</div>}
        </>
      )}
    </div>
  );
};

/* ---------- שלבים (Views + Views navigation) ---------- */
export const Stepper: React.FC<{ steps: { label: string; done?: boolean }[]; current: number; onGo: (i: number) => void; maxReach: number }> = ({ steps, current, onGo, maxReach }) => (
  <div className="flex border-b border-slate-200 mb-4 -mx-1">
    {steps.map((s, i) => {
      const active = i === current;
      const reach = i <= maxReach;
      return (
        <button key={i} disabled={!reach} onClick={() => onGo(i)} className={`flex-1 px-2 py-2 text-[12.5px] font-semibold border-b-2 -mb-px ${reach ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} ${active ? 'border-[#16a34a] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          {i + 1}. {s.label}{s.done && !active ? ' ✓' : ''}
        </button>
      );
    })}
  </div>
);

/* ---------- שדות טופס (כמו Edit widget) ---------- */
export const inputCls = 'w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16a34a]/40 focus:border-[#16a34a] disabled:bg-slate-100 disabled:text-slate-500';
export const Field: React.FC<{ label: string; required?: boolean; locked?: boolean; hint?: string; error?: string; className?: string; children: React.ReactNode }> = ({ label, required, locked, hint, error, className = '', children }) => (
  <label className={`flex flex-col gap-1 ${className}`}>
    <span className="text-[12px] font-semibold text-slate-700 flex items-center gap-1">{label}{required && <span className="text-rose-500">*</span>}{locked && <Lock className="w-3 h-3 text-slate-400" />}</span>
    {children}
    {error ? <span className="text-[11px] text-rose-600">{error}</span> : hint ? <span className="text-[11px] text-slate-400">{hint}</span> : null}
  </label>
);
export const FormGroup: React.FC<{ title: string; kind?: ExbKind; children: React.ReactNode }> = ({ title, kind, children }) => (
  <div className="border border-slate-200 rounded-xl p-3.5 mb-3.5">
    <div className="flex items-center justify-between mb-3"><div className="text-[13px] font-bold text-slate-800">{title}</div>{kind && <ExbTag kind={kind} />}</div>
    <div className="grid grid-cols-2 gap-3">{children}</div>
  </div>
);

export const btnPrimary = 'px-4 py-2 text-sm font-bold bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl cursor-pointer transition-colors';
export const btnGhost = 'px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors';

/* ---------- מסגרת וידג'ט: פס כותרת (לא חלק מהווידג'ט עצמו) ---------- */
export const WidgetFrame: React.FC<{ kind: ExbKind; title: string; note?: string; children: React.ReactNode }> = ({ kind, title, note, children }) => (
  <div className="border border-slate-200 rounded-lg overflow-hidden mb-3">
    <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-50 border-b border-slate-200">
      <span className="text-[12px] font-bold text-slate-700">{title}</span><ExbTag kind={kind} note={note} />
    </div>
    <div className="p-3 bg-white">{children}</div>
  </div>
);

/* ---------- Edit widget: עמודה אחת, שדות מקובצים לקבוצות עם תיאור ---------- */
export const EGroup: React.FC<{ title: string; desc?: string; defaultOpen?: boolean; children: React.ReactNode }> = ({ title, desc, defaultOpen = true, children }) => {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-2.5 text-right cursor-pointer">
        <span className="text-[13px] font-bold text-slate-800">{title}</span><span className="text-slate-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="pb-3 flex flex-col gap-3">{desc && <div className="text-[12px] text-slate-500 -mt-1">{desc}</div>}{children}</div>}
    </div>
  );
};
/** שדה Edit widget: תווית, תיאור (hint) מתחת לתווית, קלט ברוחב מלא. שדה לקריאה בלבד נראה כמו עריכה (כמו ב-ExB). */
export const EField: React.FC<{ label: string; required?: boolean; desc?: string; error?: string; children: React.ReactNode }> = ({ label, required, desc, error, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-[12.5px] text-slate-800">{label}{required && <span className="text-rose-500"> *</span>}</span>
    {desc && <span className="text-[11.5px] text-slate-500">{desc}</span>}
    {children}
    {error && <span className="text-[11.5px] text-rose-600">{error}</span>}
  </label>
);
