import React, { useMemo, useState } from 'react';
import { ChevronLeft, Undo2, Send, AlertCircle, Lightbulb } from 'lucide-react';
import { Contract, ContractStatus, StandStatus } from '../types/forestry';
import { ExbTag, Field, FloatingPanel, btnGhost, btnPrimary, inputCls } from './ws/Shell';
import { statusColors } from '../utils/popupModel';

interface Props { isOpen: boolean; onClose: () => void; contract: Contract; onUpdateContractStatus: (c: Contract) => void }

type Lvl = 'contract' | 'mano' | 'stand';
const CT: Record<string, ContractStatus[]> = {
  'בתכנון': ['אושר לביצוע', 'בוטל'], 'אושר לביצוע': ['בביצוע', 'בתכנון', 'בוטל'], 'בביצוע': ['בדיקת שטח', 'מושהה', 'בוטל'],
  'בדיקת שטח': ['הסתיים', 'בביצוע'], 'מושהה': ['בביצוע', 'בוטל'], 'הסתיים': [], 'בוטל': [],
};
const ST: Record<string, StandStatus[]> = { 'טרם החל': ['בביצוע', 'מושהה'], 'בביצוע': ['בוצע', 'מושהה', 'טרם החל'], 'מושהה': ['בביצוע', 'טרם החל'], 'בוצע': ['בביצוע'] };
const REASONS = ['תנאי מזג אוויר', 'אי-זמינות קבלן', 'בעיה ברישיון', 'סיבה תקציבית', 'ממצא שטח', 'אחר'];
const NEEDS_REASON = ['מושהה', 'בוטל'];
const dot = (s: string) => <span className="w-2.5 h-2.5 rounded-full shrink-0 inline-block" style={{ background: statusColors(s).main }} />;
const chip = (s: string) => <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2 py-0.5 rounded-full border" style={{ background: statusColors(s).light, borderColor: statusColors(s).main + '66', color: '#334155' }}>{dot(s)}{s}</span>;

interface Change { lvl: Lvl; id: string; label: string; from: string; to: string; reason?: string }

export const StatusWorkspace: React.FC<Props> = ({ isOpen, onClose, contract, onUpdateContractStatus }) => {
  const [cStatus, setCStatus] = useState<ContractStatus>(contract.Status);
  const [mStatus, setMStatus] = useState<Record<string, StandStatus>>(() => Object.fromEntries(contract.Manot.map((m) => [m.Mano_ID, m.Status])));
  const [sStatus, setSStatus] = useState<Record<string, StandStatus>>(() => Object.fromEntries(contract.Manot.flatMap((m) => m.Stands.map((s) => [s.Stand_ID, s.Status]))));
  const [changes, setChanges] = useState<Change[]>([]);
  const [sel, setSel] = useState<{ lvl: Lvl; ids: string[] }>({ lvl: 'contract', ids: [contract.Contract_ID] });
  const [target, setTarget] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [open, setOpen] = useState<Set<string>>(new Set(contract.Manot.slice(0, 1).map((m) => m.Mano_ID)));
  const [err, setErr] = useState('');

  const allDone = useMemo(() => contract.Manot.flatMap((m) => m.Stands).every((s) => sStatus[s.Stand_ID] === 'בוצע') && contract.Manot.length > 0, [contract, sStatus]);

  if (!isOpen) return null;

  const cur = (lvl: Lvl, id: string): string => (lvl === 'contract' ? cStatus : lvl === 'mano' ? mStatus[id] : sStatus[id]);
  const selStatuses = Array.from(new Set(sel.ids.map((i) => cur(sel.lvl, i))));
  const allowed: string[] = selStatuses.length === 1 ? (sel.lvl === 'contract' ? CT[selStatuses[0]] : ST[selStatuses[0]]) || [] : [];
  const needsReason = NEEDS_REASON.includes(target);

  const pickLevel = (lvl: Lvl, id: string) => {
    setErr(''); setTarget('');
    setSel((p) => {
      if (p.lvl !== lvl) return { lvl, ids: [id] };
      if (lvl === 'contract') return { lvl, ids: [id] };
      return { lvl, ids: p.ids.includes(id) ? p.ids.filter((x) => x !== id) : [...p.ids, id] };
    });
  };
  const label = (lvl: Lvl, id: string) => lvl === 'contract' ? contract.Contract_Name : lvl === 'mano' ? contract.Manot.find((m) => m.Mano_ID === id)?.Mano_Name || id : `עומד ${id}`;

  const stage = () => {
    setErr('');
    if (!target) return setErr('בחר סטטוס יעד');
    if (needsReason && !reason) return setErr('סיבה היא שדה חובה לסטטוס זה');
    if (sel.lvl === 'contract') {
      if (target === 'הסתיים' && !allDone) return setErr('לא ניתן לסיים התקשרות כשלא כל העומדים בסטטוס "בוצע"');
      if (target === 'בביצוע' && (contract.Contractor.includes('טרם') || !contract.Manot.length)) return setErr('מעבר לביצוע דורש קבלן משויך ולפחות מנה אחת');
    }
    const nc: Change[] = sel.ids.map((id) => ({ lvl: sel.lvl, id, label: label(sel.lvl, id), from: cur(sel.lvl, id), to: target, reason: needsReason ? `${reason}${notes ? ' – ' + notes : ''}` : undefined }));
    if (sel.lvl === 'contract') setCStatus(target as ContractStatus);
    if (sel.lvl === 'mano') {
      setMStatus((p) => ({ ...p, ...Object.fromEntries(sel.ids.map((i) => [i, target as StandStatus])) }));
      // הורדה למנה: כל עומדיה מקבלים את הסטטוס (cascade)
      const standIds = contract.Manot.filter((m) => sel.ids.includes(m.Mano_ID)).flatMap((m) => m.Stands.map((s) => s.Stand_ID));
      setSStatus((p) => ({ ...p, ...Object.fromEntries(standIds.map((i) => [i, target as StandStatus])) }));
    }
    if (sel.lvl === 'stand') {
      const ns = { ...sStatus, ...Object.fromEntries(sel.ids.map((i) => [i, target as StandStatus])) };
      setSStatus(ns);
      // עדכון אוטומטי של סטטוס המנה לפי עומדיה
      setMStatus((p) => {
        const n = { ...p };
        contract.Manot.forEach((m) => {
          if (!m.Stands.some((s) => sel.ids.includes(s.Stand_ID))) return;
          const v = m.Stands.map((s) => ns[s.Stand_ID]);
          n[m.Mano_ID] = v.every((x) => x === 'בוצע') ? 'בוצע' : v.every((x) => x === 'טרם החל') ? 'טרם החל' : v.some((x) => x === 'בביצוע' || x === 'בוצע') ? 'בביצוע' : v.every((x) => x === 'מושהה') ? 'מושהה' : p[m.Mano_ID];
        });
        return n;
      });
    }
    setChanges((c) => [...c, ...nc]);
    setTarget(''); setReason(''); setNotes('');
    setSel({ lvl: sel.lvl, ids: sel.lvl === 'contract' ? sel.ids : [] });
  };

  const undoAll = () => {
    setCStatus(contract.Status);
    setMStatus(Object.fromEntries(contract.Manot.map((m) => [m.Mano_ID, m.Status])));
    setSStatus(Object.fromEntries(contract.Manot.flatMap((m) => m.Stands.map((s) => [s.Stand_ID, s.Status]))));
    setChanges([]); setSel({ lvl: 'contract', ids: [contract.Contract_ID] }); setErr('');
  };
  const undoLast = () => {
    // שחזור פשוט: מחשבים מחדש מכל השינויים פרט לאחרון
    const keep = changes.slice(0, -1);
    const c0 = contract.Status; let cs: ContractStatus = c0;
    const ms: Record<string, StandStatus> = Object.fromEntries(contract.Manot.map((m) => [m.Mano_ID, m.Status]));
    const ss: Record<string, StandStatus> = Object.fromEntries(contract.Manot.flatMap((m) => m.Stands.map((s) => [s.Stand_ID, s.Status])));
    keep.forEach((k) => {
      if (k.lvl === 'contract') cs = k.to as ContractStatus;
      if (k.lvl === 'mano') { ms[k.id] = k.to as StandStatus; contract.Manot.find((m) => m.Mano_ID === k.id)?.Stands.forEach((s) => (ss[s.Stand_ID] = k.to as StandStatus)); }
      if (k.lvl === 'stand') ss[k.id] = k.to as StandStatus;
    });
    setCStatus(cs); setMStatus(ms); setSStatus(ss); setChanges(keep);
  };

  const save = () => {
    const u: Contract = {
      ...contract, Status: cStatus,
      Manot: contract.Manot.map((m) => ({ ...m, Status: mStatus[m.Mano_ID], Stands: m.Stands.map((s) => ({ ...s, Status: sStatus[s.Stand_ID] })) })),
    };
    onUpdateContractStatus(u);
    onClose();
  };

  const isSel = (lvl: Lvl, id: string) => sel.lvl === lvl && sel.ids.includes(id);
  const row = 'flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors';

  return (
    <FloatingPanel
      title="עדכון סטטוסים" subtitle={contract.Contract_Name} width={700} onClose={onClose}
      legend={[
        { step: 'בחירת פריט', kind: 'list', text: 'List widget (או Table) של מנות/עומדים עם בחירה; הבחירה מועברת לשאר הווידג׳טים (Selection).' },
        { step: 'שינוי סטטוס', kind: 'edit', text: 'Edit widget על הפריטים הנבחרים (Batch editing עד 500): שדה Status עם דומיין. הגבלת המעברים המותרים מחייבת ביטוי Arcade בטופס או Attribute rule בשרת.' },
        { step: 'סיבה', kind: 'survey', text: 'Survey123 web form מוטמע לסטטוסים הדורשים סיבה (השהיה/ביטול).' },
        { step: 'כללי מעבר', kind: 'button', text: 'בדיקות מעבר (Arcade/Attribute rules בשרת) ו-GP שמעדכן את הסטטוס ברמות התלויות.' },
      ]}
      footer={
        <div className="flex items-center justify-between gap-3">
          <button onClick={onClose} className={btnGhost}>סגור</button>
          <div className="flex items-center gap-2">
            {changes.length > 0 && <button onClick={undoAll} className={btnGhost}>בטל הכל</button>}
            <button onClick={save} disabled={!changes.length} className={btnPrimary}>שמור שינויים{changes.length ? ` (${changes.length})` : ''}</button>
          </div>
        </div>
      }
    >
      {allDone && cStatus === 'בביצוע' && (
        <div className="mb-3 flex items-center gap-2 text-[12.5px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2"><Lightbulb className="w-4 h-4" />כל העומדים בוצעו – מומלץ להעביר את ההתקשרות ל"בדיקת שטח".</div>
      )}

      <div className="grid grid-cols-5 gap-3">
        {/* עץ בחירה */}
        <div className="col-span-3 border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200"><div className="text-[12.5px] font-bold text-slate-800">בחירת פריט</div><ExbTag kind="list" /></div>
          <div className="p-2 max-h-[340px] overflow-y-auto">
            <div onClick={() => pickLevel('contract', contract.Contract_ID)} className={`${row} ${isSel('contract', contract.Contract_ID) ? 'bg-emerald-50 ring-1 ring-[#16a34a]' : 'hover:bg-slate-50'}`}>
              {dot(cStatus)}<span className="text-sm font-bold text-slate-800 flex-1 truncate">ההתקשרות כולה</span>{chip(cStatus)}
            </div>
            {contract.Manot.map((m) => {
              const isOpen2 = open.has(m.Mano_ID);
              return (
                <div key={m.Mano_ID} className="mt-1">
                  <div className={`${row} ${isSel('mano', m.Mano_ID) ? 'bg-emerald-50 ring-1 ring-[#16a34a]' : 'hover:bg-slate-50'}`} onClick={() => pickLevel('mano', m.Mano_ID)}>
                    <button onClick={(e) => { e.stopPropagation(); setOpen((p) => { const n = new Set(p); n.has(m.Mano_ID) ? n.delete(m.Mano_ID) : n.add(m.Mano_ID); return n; }); }} className="text-slate-400 cursor-pointer" title="הצג עומדים"><ChevronLeft className={`w-4 h-4 transition-transform ${isOpen2 ? '-rotate-90' : ''}`} /></button>
                    <span className="text-[13px] font-semibold text-slate-800 flex-1 truncate">{m.Mano_Name}</span><span className="text-[11.5px] text-slate-400">{m.Stands.length} עומדים</span>{chip(mStatus[m.Mano_ID])}
                  </div>
                  {isOpen2 && m.Stands.map((s) => (
                    <div key={s.Stand_ID} onClick={() => pickLevel('stand', s.Stand_ID)} className={`${row} mr-7 ${isSel('stand', s.Stand_ID) ? 'bg-emerald-50 ring-1 ring-[#16a34a]' : 'hover:bg-slate-50'}`}>
                      <input type="checkbox" readOnly checked={isSel('stand', s.Stand_ID)} className="pointer-events-none" />
                      <span className="text-[12.5px] text-slate-700 flex-1">עומד {s.Stand_ID} <span className="text-slate-400">· {s.AreaDunam} דונם</span></span>{chip(sStatus[s.Stand_ID])}
                    </div>
                  ))}
                </div>
              );
            })}
            {!contract.Manot.length && <div className="text-[12px] text-slate-400 text-center py-4">אין מנות בהתקשרות.</div>}
          </div>
        </div>

        {/* Edit widget */}
        <div className="col-span-2 border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200"><div className="text-[12.5px] font-bold text-slate-800">שינוי סטטוס</div><ExbTag kind="edit" /></div>
          <div className="p-3 flex flex-col gap-3">
            <div className="text-[12px] text-slate-600">{sel.ids.length === 0 ? 'בחר פריט מהרשימה' : sel.lvl === 'contract' ? 'ההתקשרות כולה' : `${sel.ids.length} ${sel.lvl === 'mano' ? 'מנות' : 'עומדים'} נבחרו`}</div>
            {selStatuses.length > 1 && <div className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">לפריטים שנבחרו סטטוסים שונים – בחר פריטים בסטטוס זהה.</div>}
            {sel.ids.length > 0 && selStatuses.length === 1 && (
              <>
                <div className="flex items-center gap-2 text-[12px] text-slate-500">נוכחי: {chip(selStatuses[0])}</div>
                {allowed.length === 0 ? <div className="text-[12px] text-slate-500">אין מעברים מותרים מסטטוס זה.</div> : (
                  <Field label="סטטוס חדש" required>
                    <select className={inputCls} value={target} onChange={(e) => { setTarget(e.target.value); setErr(''); }}><option value="">בחר…</option>{allowed.map((a) => <option key={a}>{a}</option>)}</select>
                  </Field>
                )}
                {needsReason && (
                  <div className="border border-amber-200 rounded-lg bg-amber-50/40 p-2.5 flex flex-col gap-2">
                    <div className="flex items-center justify-between"><span className="text-[11.5px] font-bold text-slate-700">טופס סיבה</span><ExbTag kind="survey" /></div>
                    <Field label="סיבה" required><select className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)}><option value="">בחר…</option>{REASONS.map((r) => <option key={r}>{r}</option>)}</select></Field>
                    <Field label="תאריך"><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
                    <Field label="הערות"><textarea rows={2} className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
                  </div>
                )}
                {err && <div className="flex items-start gap-1.5 text-[12px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5"><AlertCircle className="w-4 h-4 shrink-0 mt-px" />{err}</div>}
                {allowed.length > 0 && <button onClick={stage} className={`${btnPrimary} inline-flex items-center justify-center gap-2`}><Send className="w-4 h-4" />החל על הנבחרים</button>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* שינויים ממתינים */}
      <div className="mt-3 border border-slate-200 rounded-xl">
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 rounded-t-xl"><div className="text-[12.5px] font-bold text-slate-800">שינויים ממתינים לשמירה ({changes.length})</div>
          {changes.length > 0 && <button onClick={undoLast} className="inline-flex items-center gap-1 text-[12px] text-slate-600 hover:text-slate-900 cursor-pointer"><Undo2 className="w-3.5 h-3.5" />בטל אחרון</button>}</div>
        {changes.length === 0 ? <div className="text-[12px] text-slate-400 text-center py-3">עדיין לא בוצעו שינויים.</div> : (
          <div className="divide-y divide-slate-100 max-h-[130px] overflow-y-auto">
            {changes.map((c, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-[12.5px]"><span className="text-slate-400 w-12 shrink-0">{c.lvl === 'contract' ? 'התקשרות' : c.lvl === 'mano' ? 'מנה' : 'עומד'}</span><span className="font-semibold text-slate-800 truncate flex-1">{c.label}</span>{chip(c.from)}<span className="text-slate-400">←</span>{chip(c.to)}{c.reason && <span className="text-[11px] text-slate-500 truncate max-w-[120px]" title={c.reason}>{c.reason}</span>}</div>
            ))}
          </div>
        )}
      </div>
    </FloatingPanel>
  );
};
