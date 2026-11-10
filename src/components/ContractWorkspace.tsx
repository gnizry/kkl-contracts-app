import React, { useMemo, useState } from 'react';
import { Trash2, Play, Loader2, Plus, Paperclip, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { Contract, Mano, RegionName, Stand } from '../types/forestry';
import { EField, EGroup, ExbTag, Field, FloatingPanel, FormGroup, Stepper, WidgetFrame, btnGhost, btnPrimary, inputCls } from './ws/Shell';
import { statusColors } from '../utils/popupModel';
import { StandPickerMap } from './ws/StandPickerMap';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaveContract: (c: Contract) => void;
  existingContract?: Contract | null;
  contracts: Contract[];
}

const SPECIES = ['אורן ירושלים', 'אורן ברוטיה', 'ברושים', 'מעורב עצי מחט', 'אקליפטוס'];
const OPS = ['דילול', 'סניטציה', 'גיזום', 'חישוף קווי אש', 'פינוי שאריות'];
const MANO_COLORS = ['#7c3aed', '#2563eb', '#d97706', '#9333ea', '#dc2626', '#0891b2'];
const TREATMENTS = ['דילול', 'סניטציה', 'גיזום', 'חישוף קווי אש'];
const REGIONS: RegionName[] = ['מרחב צפון', 'מרחב מרכז', 'מרחב דרום'];
const LOCKED_STATUSES = ['בביצוע', 'בדיקת שטח', 'הסתיים'];
const fmt = (n: number) => (Math.round(n * 10) / 10).toLocaleString('he-IL');

/** מדמה את תוצאת ה-GP service: עומדים מועמדים בסביבת היער שנבחר */
function candidatePool(seedText: string): Stand[] {
  let h = 7;
  for (const ch of seedText) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  const rnd = () => { h = (Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) + 0x297a2d39) >>> 0; return (h >>> 8) / 16777216; };
  const gush = 100 + (h % 400);
  return Array.from({ length: 20 }, (_, i) => {
    const area = Math.round((4 + rnd() * 46) * 10) / 10;
    return {
      Stand_ID: `${gush}/${101 + i}`,
      AreaDunam: area,
      DominantSpecies: SPECIES[Math.floor(rnd() * SPECIES.length)],
      TreatmentType: TREATMENTS[Math.floor(rnd() * TREATMENTS.length)],
      Status: 'טרם החל',
      TreeDensity: '-',
      TargetVolumeMQ: Math.round(area * (4 + rnd() * 8)),
    } as Stand;
  });
}

export const ContractWorkspace: React.FC<Props> = ({ isOpen, onClose, onSaveContract, existingContract, contracts }) => {
  const ex = existingContract || null;
  const locked = !!ex && LOCKED_STATUSES.includes(ex.Status);

  const [step, setStep] = useState(0);
  const [reach, setReach] = useState(0);
  const [f, setF] = useState({
    number: ex?.Contract_Number || '',
    name: ex?.Contract_Name || '',
    region: (ex?.Region || '') as string,
    district: ex?.District || '',
    block: ex?.Block || '',
    year: String(ex?.Year || new Date().getFullYear()),
    start: ex?.StartDate || '',
    end: ex?.EndDate || '',
    desc: ex?.Description || '',
    contractor: ex?.Contractor || 'טרם נבחר קבלן',
    supervisor: ex?.Supervisor || 'טרם הוקצה יערן',
    sub: '',
    manager: '',
    signDate: '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<any>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const [manot, setManot] = useState<Mano[]>(() => (ex ? ex.Manot.map((m) => ({ ...m, Stands: [...m.Stands] })) : []));
  const [selMano, setSelMano] = useState(0);
  const [docs, setDocs] = useState<string[]>([]);
  const [surveySent, setSurveySent] = useState(false);

  // כלי הבחירה (Analysis widget → GP)
  const [running, setRunning] = useState(false);
  const [pick, setPick] = useState<Set<string>>(new Set());
  const [mName, setMName] = useState('');
  const [ops, setOps] = useState<Set<string>>(new Set());
  const [prio, setPrio] = useState('רגילה');
  const [mNote, setMNote] = useState('');
  const [lastRun, setLastRun] = useState<null | { rows: [string, string][]; name: string }>(null);
  const [showErr, setShowErr] = useState(false);

  const pool = useMemo(() => candidatePool(f.block || f.name || 'x'), [f.block, f.name]);
  const assigned = useMemo(() => new Map(manot.flatMap((m) => m.Stands.map((s) => [s.Stand_ID, m.Mano_Name] as const))), [manot]);
  // עומדים ששויכו להתקשרות אחרת (שכבה שנייה של בדיקת ה-GP)
  const foreign = useMemo(() => new Set(pool.filter((_, i) => i % 7 === 3).map((s) => s.Stand_ID)), [pool]);

  const regionContracts = contracts.filter((c) => !f.region || c.Region === f.region);
  const districts = Array.from(new Set([...regionContracts.map((c) => c.District), f.district].filter(Boolean)));
  const blocks = Array.from(new Set([...regionContracts.filter((c) => !f.district || c.District === f.district).map((c) => c.Block), f.block].filter(Boolean)));
  const contractors = Array.from(new Set([...contracts.map((c) => c.Contractor), f.contractor].filter(Boolean)));

  if (!isOpen) return null;

  const errs = {
    number: !f.number.trim() ? 'שדה חובה' : '',
    name: !f.name.trim() ? 'שדה חובה' : '',
    region: !f.region ? 'שדה חובה' : '',
    end: f.start && f.end && f.end < f.start ? 'תאריך הסיום מוקדם מההתחלה' : '',
  };
  const step1Ok = !errs.number && !errs.name && !errs.region && !errs.end;
  const totalArea = manot.reduce((a, m) => a + m.Stands.reduce((x, s) => x + s.AreaDunam, 0), 0);
  const totalVol = manot.reduce((a, m) => a + m.Stands.reduce((x, s) => x + s.TargetVolumeMQ, 0), 0);
  const standCount = manot.reduce((a, m) => a + m.Stands.length, 0);

  const go = (i: number) => { setStep(i); setReach((r) => Math.max(r, i)); };
  const next = () => {
    if (step === 0 && !step1Ok) { setShowErr(true); return; }
    go(Math.min(step + 1, 3));
  };

  const poolSel = pool.filter((x) => pick.has(x.Stand_ID));
  const selArea = poolSel.reduce((a, x) => a + x.AreaDunam, 0);
  const selVol = poolSel.reduce((a, x) => a + x.TargetVolumeMQ, 0);
  const defaultName = `מנה ${manot.length + 1}${f.block ? ' - ' + f.block : ''}`;
  const toggleOp = (o: string) => setOps((p) => { const n = new Set(p); n.has(o) ? n.delete(o) : n.add(o); return n; });
  const kindOf = (st: Stand) => {
    const mi = manot.findIndex((m) => m.Stands.some((x) => x.Stand_ID === st.Stand_ID));
    if (mi >= 0) return { kind: 'mano' as const, color: MANO_COLORS[mi % MANO_COLORS.length], label: `מנה ${mi + 1}` };
    return foreign.has(st.Stand_ID) ? { kind: 'foreign' as const } : { kind: 'free' as const };
  };
  // הרצת הכלי: שליחת הפרמטרים ל-GP service שיוצר את המנה
  const runTool = () => {
    if (!pick.size || !ops.size) return;
    const name = mName.trim() || defaultName;
    const actions = Array.from(ops).join(', ');
    const chosen = poolSel.map((x) => ({ ...x, TreatmentType: actions }));
    setRunning(true);
    setTimeout(() => {
      const n = manot.length + 1;
      setManot((m) => [...m, { Mano_ID: `M-${n}-${Date.now() % 1000}`, Mano_Name: name, Status: 'טרם החל', Stands: chosen }]);
      setLastRun({ name, rows: [['Contract_Number', f.number || '—'], ['Mano_Name', name], ['Stand_IDs', chosen.map((x) => x.Stand_ID).join(', ')], ['Actions', actions], ['Priority', prio], ['Notes', mNote || '—']] });
      setSelMano(manot.length); setPick(new Set()); setMName(''); setOps(new Set()); setMNote(''); setPrio('רגילה');
      setRunning(false);
    }, 800);
  };
  const removeMano = (i: number) => { setManot((m) => m.filter((_, k) => k !== i)); setSelMano(0); };
  const removeStand = (mi: number, sid: string) => setManot((m) => m.map((x, k) => (k === mi ? { ...x, Stands: x.Stands.filter((s) => s.Stand_ID !== sid) } : x)));

  const save = () => {
    const id = ex?.Contract_ID || `CNT-${f.year}-${Math.floor(100 + Math.random() * 900)}`;
    const c: Contract = {
      Contract_ID: id, Contract_Number: f.number, Contract_Name: f.name,
      Region: (f.region || 'מרחב צפון') as RegionName, District: f.district, Block: f.block,
      Contractor: f.contractor, Status: ex?.Status || 'בתכנון', Year: Number(f.year) || new Date().getFullYear(),
      StartDate: f.start, EndDate: f.end,
      TotalApprovedMQ: totalVol, TotalDeliveredMQ: ex?.TotalDeliveredMQ || 0, BalanceMQ: totalVol - (ex?.TotalDeliveredMQ || 0),
      ExecutionPercent: ex?.ExecutionPercent || 0, Description: f.desc, Supervisor: f.supervisor,
      Coordinates: ex?.Coordinates || { lat: 32.85, lng: 35.25 },
      Manot: manot, Felling_Licenses: ex?.Felling_Licenses || [], DeliveryNotes: ex?.DeliveryNotes || [], WorkLogs: ex?.WorkLogs || [],
    };
    onSaveContract(c);
    onClose();
  };

  const checks = [
    { ok: !!f.number.trim() && !!f.name.trim(), t: 'מספר ושם התקשרות' },
    { ok: !!f.region, t: 'מרחב ואזור' },
    { ok: !errs.end && !!f.start && !!f.end, t: 'תאריכי התחלה וסיום תקינים', warn: true },
    { ok: manot.length > 0 && standCount > 0, t: 'לפחות מנה אחת עם עומדים', warn: true },
    { ok: f.contractor !== 'טרם נבחר קבלן', t: 'קבלן זוכה נבחר (נדרש לאישור לביצוע)', warn: true },
  ];

  const stepsDef = [
    { label: 'פרטי התקשרות', done: step1Ok && reach > 0 },
    { label: 'מנות ועומדים', done: manot.length > 0 && reach > 1 },
    { label: 'מסמכים וקבלן', done: surveySent },
    { label: 'סיכום', done: false },
  ];

  const footer = (
    <div className="flex items-center justify-between gap-3">
      <button onClick={step === 0 ? onClose : () => go(step - 1)} className={btnGhost}>{step === 0 ? 'ביטול' : 'חזרה'}</button>
      <div className="flex items-center gap-3">
        {step > 0 && <div className="text-[12px] text-slate-500 hidden sm:block">{manot.length} מנות · {standCount} עומדים · {fmt(totalArea)} דונם</div>}
        {step < 3 ? <button onClick={next} className={btnPrimary}>{step === 0 ? 'המשך למנות' : 'המשך'}</button> : <button onClick={save} className={btnPrimary}>{ex ? 'שמור שינויים' : 'צור התקשרות'}</button>}
      </div>
    </div>
  );

  return (
    <FloatingPanel
      title={ex ? 'עריכת התקשרות' : 'התקשרות חדשה'}
      subtitle={ex ? ex.Contract_Name : 'מילוי פרטים, בניית מנות ושיוך קבלן'}
      width={660}
      onClose={onClose}
      footer={footer}
      legend={[
        { step: 'התקשרות חדשה', kind: 'survey', text: 'יצירת רשומה חדשה – Survey123 web form מוטמע (ה-Edit widget עובד רק על פריטים שנבחרו בווידג׳ט אחר, ובתצורת טופס של עמודה אחת).' },
        { step: 'עריכת קיימת', kind: 'edit', text: 'Edit widget על ההתקשרות הנבחרת ב-List: שדות בעמודה אחת, קבוצות עם תיאור, נעילה לפי סטטוס. הוא שומר בעצמו – אין כפתור שמירה גלובלי.' },
        { step: 'מנות ועומדים', kind: 'list', text: 'List widget לרשימת המנות (מצב Selected מציג את עומדי המנה).' },
        { step: '', kind: 'analysis', text: 'Analysis widget עם Custom tool: פרמטר העומדים נבחר במפה (Select), פעולות/שם/עדיפות בטופס הכלי, והרצה שולחת את הפרמטרים ל-GP service שיוצר את המנה.' },
        { step: 'מסמכים וקבלן', kind: 'survey', text: 'Survey123 web form מוטמע (Embed), עם prefill של מזהה ההתקשרות.' },
      ]}
    >
      <Stepper steps={stepsDef} current={step} onGo={go} maxReach={reach} />

      {/* ---- שלב 1: יצירה = Survey123 (עמודות + choice filter) ; עריכה = Edit widget (עמודה אחת + קבוצות) ---- */}
      {step === 0 && !ex && (
        <WidgetFrame kind="survey" title="טופס התקשרות חדשה" note="Survey123 web form מוטמע (Embed). עמודות דרך appearance w2, רשימות מקוננות דרך choice_filter, חובה/ולידציה דרך required ו-constraint">
          <div className="grid grid-cols-2 gap-3">
            <Field label="מספר התקשרות" required error={showErr ? errs.number : ''}><input className={inputCls} value={f.number} onChange={set('number')} placeholder="לדוגמה 2026/17" /></Field>
            <Field label="שנת תכנית"><input className={inputCls} value={f.year} onChange={set('year')} inputMode="numeric" /></Field>
            <Field label="שם התקשרות" required className="col-span-2" error={showErr ? errs.name : ''}><input className={inputCls} value={f.name} onChange={set('name')} /></Field>
            <Field label="מרחב" required error={showErr ? errs.region : ''}>
              <select className={inputCls} value={f.region} onChange={(e) => setF((p) => ({ ...p, region: e.target.value, district: '', block: '' }))}><option value="">בחר…</option>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select>
            </Field>
            <Field label="אזור">
              <select className={inputCls} value={f.district} disabled={!f.region} onChange={(e) => setF((p) => ({ ...p, district: e.target.value, block: '' }))}><option value="">בחר…</option>{districts.map((d) => <option key={d}>{d}</option>)}</select>
            </Field>
            <Field label="גוש / יער" className="col-span-2"><select className={inputCls} value={f.block} disabled={!f.region} onChange={set('block')}><option value="">בחר…</option>{blocks.map((b) => <option key={b}>{b}</option>)}</select></Field>
            <Field label="תאריך התחלה"><input type="date" className={inputCls} value={f.start} onChange={set('start')} /></Field>
            <Field label="תאריך סיום" error={errs.end}><input type="date" className={inputCls} value={f.end} onChange={set('end')} /></Field>
            <Field label="תיאור / פעולות בהתקשרות" className="col-span-2"><textarea rows={2} className={inputCls} value={f.desc} onChange={set('desc')} /></Field>
          </div>
        </WidgetFrame>
      )}
      {step === 0 && ex && (
        <>
          <div className="text-[12px] text-slate-500 mb-2">ה-Edit widget עורך את ההתקשרות שנבחרה ברשימה: <b className="text-slate-700">{ex.Contract_Name}</b></div>
          <WidgetFrame kind="edit" title="עריכת התקשרות" note="Edit widget על שכבת ההתקשרויות, Configure fields = Customize, קבוצות שדות עם תיאור. נעילה לפי סטטוס דרך ביטוי Editable בטופס (Arcade)">
            <EGroup title="זיהוי" desc="מספר ההתקשרות אינו ניתן לשינוי.">
              <EField label="מספר התקשרות" required><input className={inputCls} value={f.number} disabled /></EField>
              <EField label="שם התקשרות" required error={showErr ? errs.name : ''}><input className={inputCls} value={f.name} onChange={set('name')} /></EField>
              <EField label="שנת תכנית" desc={locked ? 'נעול כשההתקשרות בביצוע ואילך.' : undefined}><input className={inputCls} value={f.year} onChange={set('year')} disabled={locked} inputMode="numeric" /></EField>
            </EGroup>
            <EGroup title="מיקום" desc={locked ? 'שדות המיקום נעולים כשההתקשרות בביצוע ואילך.' : 'בחירת מרחב מסננת את רשימות האזור והיער.'}>
              <EField label="מרחב" required error={showErr ? errs.region : ''}>
                <select className={inputCls} value={f.region} disabled={locked} onChange={(e) => setF((p) => ({ ...p, region: e.target.value, district: '', block: '' }))}><option value="">בחר…</option>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select>
              </EField>
              <EField label="אזור"><select className={inputCls} value={f.district} disabled={locked || !f.region} onChange={(e) => setF((p) => ({ ...p, district: e.target.value, block: '' }))}><option value="">בחר…</option>{districts.map((d) => <option key={d}>{d}</option>)}</select></EField>
              <EField label="גוש / יער"><select className={inputCls} value={f.block} disabled={locked || !f.region} onChange={set('block')}><option value="">בחר…</option>{blocks.map((b) => <option key={b}>{b}</option>)}</select></EField>
            </EGroup>
            <EGroup title="לוח זמנים ותיאור">
              <EField label="תאריך התחלה"><input type="date" className={inputCls} value={f.start} onChange={set('start')} /></EField>
              <EField label="תאריך סיום" error={errs.end}><input type="date" className={inputCls} value={f.end} onChange={set('end')} /></EField>
              <EField label="תיאור / פעולות בהתקשרות"><textarea rows={2} className={inputCls} value={f.desc} onChange={set('desc')} /></EField>
            </EGroup>
          </WidgetFrame>
        </>
      )}

      {/* ---- שלב 2: List + Analysis ---- */}
      {step === 1 && (
        <>
          <div className="flex items-center justify-between mb-2"><div className="text-[13px] font-bold text-slate-800">מנות בהתקשרות ({manot.length})</div><ExbTag kind="list" /></div>
          {manot.length === 0 ? (
            <div className="text-[12.5px] text-slate-400 border border-dashed border-slate-300 rounded-xl py-5 text-center mb-4">עדיין אין מנות. הפעל את כלי הבחירה למטה כדי ליצור מנה.</div>
          ) : (
            <div className="flex flex-col gap-2 mb-3">
              {manot.map((m, i) => {
                const a = m.Stands.reduce((x, s) => x + s.AreaDunam, 0);
                const v = m.Stands.reduce((x, s) => x + s.TargetVolumeMQ, 0);
                const sel = i === selMano;
                return (
                  <div key={m.Mano_ID} onClick={() => setSelMano(i)} className={`rounded-xl border px-3.5 py-2.5 cursor-pointer transition-colors ${sel ? 'border-[#16a34a] bg-emerald-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: statusColors(m.Status).main }} /><span className="text-sm font-bold text-slate-800 truncate">{m.Mano_Name}</span></div>
                      <div className="flex items-center gap-3 text-[12px] text-slate-500 shrink-0"><span>{m.Stands.length} עומדים</span><span>{fmt(a)} דונם</span><span>{fmt(v)} מ"ק</span>
                        <button onClick={(e) => { e.stopPropagation(); removeMano(i); }} className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" title="מחיקת מנה"><Trash2 className="w-4 h-4" /></button></div>
                    </div>
                    {sel && m.Stands.length > 0 && (
                      <div className="mt-2.5 border-t border-slate-200/70 pt-2 flex flex-wrap gap-1.5">
                        {m.Stands.map((s) => (
                          <span key={s.Stand_ID} className="inline-flex items-center gap-1.5 text-[11.5px] bg-white border border-slate-200 rounded-full pl-1.5 pr-2.5 py-0.5 text-slate-700">
                            <b>{s.Stand_ID}</b><span className="text-slate-400">{fmt(s.AreaDunam)} דונם</span>
                            <button onClick={(e) => { e.stopPropagation(); removeStand(i, s.Stand_ID); }} className="text-slate-400 hover:text-rose-600 cursor-pointer" title="הסרה מהמנה">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <WidgetFrame kind="analysis" title="כלי: יצירת מנה מעומדים" note="Analysis widget עם Custom tool: פרמטר 'עומדים' נבחר בהקשה על המפה (Select), שאר הפרמטרים בטופס הכלי, וההרצה שולחת אותם ל-GP service שיוצר את המנה">
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12.5px] text-slate-800">עומדים <span className="text-rose-500">*</span></span>
                  <span className="text-[12px] text-slate-500">{pick.size ? <><b className="text-slate-800">{pick.size}</b> נבחרו · {fmt(selArea)} דונם · {fmt(selVol)} מ"ק</> : 'לא נבחרו עומדים'}</span>
                </div>
                <div className="text-[11.5px] text-slate-500 mb-1.5">בחירה בלחיצה על עומד, או גרירת מלבן (הכלי השני בצד המפה). עומדים משויכים אינם ניתנים לבחירה.</div>
                <StandPickerMap stands={pool} kindOf={kindOf} selected={pick} onChange={setPick} height={290} />
              </div>
              <EField label="שם המנה" desc="ברירת מחדל לפי מספר המנה והיער."><input className={inputCls} value={mName} onChange={(e) => setMName(e.target.value)} placeholder={defaultName} /></EField>
              <div className="flex flex-col gap-1">
                <span className="text-[12.5px] text-slate-800">פעולות נדרשות <span className="text-rose-500">*</span></span>
                <span className="text-[11.5px] text-slate-500">הפעולות יירשמו בכל עומדי המנה.</span>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1">
                  {OPS.map((o) => <label key={o} className="inline-flex items-center gap-1.5 text-[13px] text-slate-700 cursor-pointer"><input type="checkbox" checked={ops.has(o)} onChange={() => toggleOp(o)} />{o}</label>)}
                </div>
              </div>
              <EField label="עדיפות ביצוע"><select className={inputCls} value={prio} onChange={(e) => setPrio(e.target.value)}>{['רגילה', 'גבוהה', 'דחופה (סיכון אש)'].map((o) => <option key={o}>{o}</option>)}</select></EField>
              <EField label="הערות למנה"><textarea rows={2} className={inputCls} value={mNote} onChange={(e) => setMNote(e.target.value)} /></EField>
              <div className="flex items-center gap-3">
                <button onClick={runTool} disabled={running || !pick.size || !ops.size} className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-bold bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg cursor-pointer">
                  {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}{running ? 'שולח ל-GP…' : 'הרץ כלי'}
                </button>
                {(!pick.size || !ops.size) && <span className="text-[11.5px] text-slate-400">{!pick.size ? 'בחר עומדים במפה' : 'בחר לפחות פעולה אחת'}</span>}
              </div>
              {lastRun && (
                <div className="border border-emerald-200 bg-emerald-50/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-[13px] font-bold text-emerald-800 mb-1.5"><CheckCircle2 className="w-4 h-4" />המנה "{lastRun.name}" נוצרה</div>
                  <div className="text-[11.5px] text-slate-500 mb-1">פרמטרים שנשלחו ל-GP service:</div>
                  <div className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-0.5 text-[12px]">
                    {lastRun.rows.map(([k, v]) => <React.Fragment key={k}><span className="text-slate-500">{k}</span><span className="text-slate-800 break-words">{v}</span></React.Fragment>)}
                  </div>
                </div>
              )}
            </div>
          </WidgetFrame>
        </>
      )}

      {/* ---- שלב 3: Survey123 web form מוטמע ---- */}
      {step === 2 && (
        <div className="border border-amber-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-amber-50/70 border-b border-amber-200">
            <div className="text-[13px] font-bold text-slate-800">רישום מסמכים וקבלן – Survey123</div><ExbTag kind="survey" note="Embed widget עם כתובת ה-web form ופרמטרי prefill" />
          </div>
          {surveySent ? (
            <div className="p-8 text-center"><CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" /><div className="text-sm font-bold text-slate-800">הטופס נשלח</div><div className="text-[12px] text-slate-500 mt-1">נתוני הקבלן והמסמכים נקלטו בהתקשרות.</div><button onClick={() => setSurveySent(false)} className="mt-3 text-[12px] text-slate-500 underline cursor-pointer">עריכה מחדש</button></div>
          ) : (
            <div className="p-4 grid grid-cols-2 gap-3 bg-white">
              <Field label="קבלן זוכה"><select className={inputCls} value={f.contractor} onChange={set('contractor')}>{contractors.map((c) => <option key={c}>{c}</option>)}</select></Field>
              <Field label="קבלן משנה"><input className={inputCls} value={f.sub} onChange={set('sub')} /></Field>
              <Field label="מנהל עבודה"><input className={inputCls} value={f.manager} onChange={set('manager')} /></Field>
              <Field label="יערן אחראי"><input className={inputCls} value={f.supervisor} onChange={set('supervisor')} /></Field>
              <Field label="תאריך חתימה על החוזה"><input type="date" className={inputCls} value={f.signDate} onChange={set('signDate')} /></Field>
              <Field label="מזהה התקשרות (prefill)"><input className={inputCls} value={f.number || '—'} disabled /></Field>
              <div className="col-span-2">
                <div className="text-[12px] font-semibold text-slate-700 mb-1.5">צילום / צירוף מסמכי התקשרות</div>
                <div className="flex flex-wrap gap-2 items-center">
                  {docs.map((d, i) => <span key={i} className="inline-flex items-center gap-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1"><Paperclip className="w-3 h-3" />{d}</span>)}
                  <button onClick={() => setDocs((d) => [...d, `מסמך_${d.length + 1}.pdf`])} className="text-[12px] font-semibold text-slate-600 border border-dashed border-slate-300 rounded-full px-3 py-1 hover:bg-slate-50 cursor-pointer">+ הוסף קובץ</button>
                </div>
              </div>
              <div className="col-span-2 flex justify-end pt-1"><button onClick={() => setSurveySent(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg cursor-pointer"><Send className="w-4 h-4" />שלח</button></div>
            </div>
          )}
        </div>
      )}

      {/* ---- שלב 4: סיכום ---- */}
      {step === 3 && (
        <>
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {[['מנות', manot.length], ['עומדים', standCount], ['שטח (דונם)', fmt(totalArea)]].map(([l, v]) => (
              <div key={String(l)} className="border border-slate-200 rounded-xl p-3 text-center"><div className="text-[11.5px] text-slate-500">{l}</div><div className="text-xl font-bold text-slate-900">{v}</div></div>
            ))}
          </div>
          <div className="border border-slate-200 rounded-xl p-3.5 mb-3 text-[13px] grid grid-cols-2 gap-y-1.5 gap-x-4">
            <div><span className="text-slate-500">שם:</span> <b>{f.name || '—'}</b></div><div><span className="text-slate-500">מספר:</span> <b>{f.number || '—'}</b></div>
            <div><span className="text-slate-500">מיקום:</span> <b>{[f.region, f.district, f.block].filter(Boolean).join(' · ') || '—'}</b></div><div><span className="text-slate-500">קבלן:</span> <b>{f.contractor}</b></div>
            <div><span className="text-slate-500">תקופה:</span> <b>{f.start || '—'} ← {f.end || '—'}</b></div><div><span className="text-slate-500">נפח יעד:</span> <b>{fmt(totalVol)} מ"ק</b></div>
          </div>
          <div className="border border-slate-200 rounded-xl p-3.5">
            <div className="text-[13px] font-bold text-slate-800 mb-2">בדיקות לפני שמירה</div>
            {checks.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-[13px] py-1">{c.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className={`w-4 h-4 ${c.warn ? 'text-amber-500' : 'text-rose-500'}`} />}<span className={c.ok ? 'text-slate-700' : 'text-slate-500'}>{c.t}</span></div>
            ))}
            <div className="text-[11.5px] text-slate-400 mt-2">ב-ExB אין שלב שמירה כללי: הנתונים נשמרים ישירות בשכבה בעת שליחת Survey123 / שמירת Edit widget. ההתקשרות נשמרת בסטטוס "{ex?.Status || 'בתכנון'}". אישור לביצוע – דרך "עדכון סטטוס".</div>
          </div>
        </>
      )}
    </FloatingPanel>
  );
};
