import React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, FileText, ClipboardPen, Check, X } from 'lucide-react';
import { PopupModel, PRem, PCut, LicState, statusColors } from '../utils/popupModel';

export const fmt = (n: number) => {
  const v = Math.round(n * 100) / 100;
  return v.toLocaleString('he-IL', { maximumFractionDigits: 2 });
};
export const vol = (n: number) => `${fmt(n)} מ"ק`;

const STATE: Record<LicState, { t: string; fg: string; bg: string }> = {
  valid: { t: 'בתוקף', fg: '#059669', bg: '#ECFDF5' },
  exhausted: { t: 'מוצה', fg: '#475569', bg: '#F1F5F9' },
  invalid: { t: 'לא בתוקף', fg: '#DC2626', bg: '#FEF2F2' },
};
export const StateChip: React.FC<{ s: LicState }> = ({ s }) => (
  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md border" style={{ color: STATE[s].fg, background: STATE[s].bg, borderColor: STATE[s].fg }}>{STATE[s].t}</span>
);

export const Section: React.FC<{ title: string; count?: string | number; tone: string; bg: string; children: React.ReactNode; open?: boolean }> = ({ title, count, tone, bg, children, open }) => (
  <details open={open} className="group mb-2.5 border border-slate-300/80 rounded-xl bg-white overflow-hidden">
    <summary className="list-none cursor-pointer flex items-center justify-between px-4 py-2.5 font-bold text-[15px]" style={{ background: bg, color: tone }}>
      <span>{title}{count !== undefined && <span className="font-medium opacity-80"> ({count})</span>}</span>
      <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
    </summary>
    <div className="p-3.5 border-t border-slate-200">{children}</div>
  </details>
);


// במצב "שטוח" (ExB) אין רכיבי כיווץ: כל התוכן מוצג פתוח, ורשימות ארוכות מקבלות "הצג עוד"
const FlatCtx = React.createContext(false);
export const FlatProvider = FlatCtx.Provider;
const Collapse: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => {
  const flat = React.useContext(FlatCtx);
  return flat ? <div className={className}>{children}</div> : <details className={className}>{children}</details>;
};
const Summary: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => {
  const flat = React.useContext(FlatCtx);
  return flat
    ? <div className={`${(className || '').replace('cursor-pointer', '')} [&_svg]:hidden`}>{children}</div>
    : <summary className={className}>{children}</summary>;
};
const PAGE = 10;
const MiniPager: React.FC<{ total: number; page: number; onPage: (p: number) => void }> = ({ total, page, onPage }) => {
  const pages = Math.ceil(total / PAGE);
  if (pages <= 1) return null;
  const b = 'w-8 h-8 rounded-full flex items-center justify-center text-xs cursor-pointer transition-colors';
  return (
    <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
      <span>{(page - 1) * PAGE + 1}–{Math.min(page * PAGE, total)} מתוך {total}</span>
      <div className="flex items-center gap-1">
        <button disabled={page === 1} onClick={() => onPage(page - 1)} className={`${b} text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed`}><ChevronRight className="w-4 h-4" /></button>
        {Array.from({ length: pages }, (_, k) => k + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1).map((n, i, arr) => (
          <React.Fragment key={n}>
            {i > 0 && n - arr[i - 1] > 1 && <span className="px-0.5">…</span>}
            <button onClick={() => onPage(n)} className={`${b} ${n === page ? 'border-2 border-[#16a34a] text-[#16a34a] font-bold bg-emerald-50/50' : 'text-slate-600 hover:bg-slate-100 font-medium'}`}>{n}</button>
          </React.Fragment>
        ))}
        <button disabled={page === pages} onClick={() => onPage(page + 1)} className={`${b} text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed`}><ChevronLeft className="w-4 h-4" /></button>
      </div>
    </div>
  );
};
const Bar: React.FC<{ label: string; value: number; max: number; color: string; title?: string }> = ({ label, value, max, color, title }) => (
  <div className="flex items-center gap-2 mb-1.5">
    <div className="w-14 shrink-0 text-[11px] font-bold text-slate-800 truncate" dir="ltr" style={{ textAlign: 'right' }}>{label}</div>
    <div className="flex-1 h-4 rounded bg-slate-200" title={title}>
      <div className="h-full rounded" style={{ width: `${max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0}%`, background: color }} />
    </div>
    <div className="w-12 text-left text-[11px] font-bold text-slate-700 shrink-0" dir="ltr">{fmt(value)}</div>
  </div>
);

const RemBlock: React.FC<{ r: PRem }> = ({ r }) => {
  const pct = r.approved > 0 ? Math.min(100, Math.max(0, (r.used / r.approved) * 100)) : 0;
  const barColor = pct >= 90 ? '#EF4444' : pct >= 75 ? '#F59E0B' : '#10B981';
  const low = r.balance <= 40;
  return (
    <div className="bg-white border border-slate-300 rounded-lg p-2.5 mb-2">
      <div className="flex items-center justify-between mb-1.5">
        <div className="font-semibold text-slate-800 text-sm">רישיון נטילה <span dir="ltr">#{r.num}</span></div>
        <StateChip s={r.state} />
      </div>
      <div className="text-[13px] text-slate-600 mb-1.5">תוקף: <b dir="ltr" className="text-slate-800">{r.from} - {r.to}</b></div>
      <div className="flex justify-between text-[13px] text-slate-600"><span>כמות מאושרת:</span><b className="text-indigo-700">{vol(r.approved)}</b></div>
      <div className="bg-slate-50 border border-slate-200 rounded p-1.5 my-1">
        {Object.keys(r.usedByMana).length === 0 ? (
          <div className="text-xs text-slate-400">ללא תעודות מקושרות מהתקשרות זו</div>
        ) : (
          Object.entries(r.usedByMana).filter(([, q]) => q > 0).map(([m, q]) => (
            <div key={m} className="flex justify-between text-xs text-slate-600"><span>נוצל במנה {m}:</span><b className="text-slate-900">{vol(q)}</b></div>
          ))
        )}
      </div>
      <div className="flex justify-between text-[13px] text-slate-600 border-t border-slate-200 pt-1.5"><span>סה"כ נוצל ברישיון (כללי):</span><b className="text-slate-900">{vol(r.used)}</b></div>
      <div className="flex justify-between text-[13px] text-slate-600 border-t border-dashed border-slate-300 pt-1.5 mt-1"><span>יתרת נטילה עדכנית:</span><b style={{ color: low ? '#DC2626' : '#0F172A' }}>{vol(r.balance)}</b></div>
      <div className="mt-2 h-1.5 rounded bg-slate-200 overflow-hidden"><div className="h-full rounded" style={{ width: `${pct}%`, background: barColor }} /></div>
      <div className="text-[12px] text-slate-500 mt-1">נוצלו {fmt(pct)}% (<span dir="ltr">{fmt(r.used)}</span> מתוך <span dir="ltr">{fmt(r.approved)}</span> מ"ק)</div>
      {low && r.balance >= 0 && <div className="text-xs font-bold text-[#DC2626] mt-1">שים לב: יתרה קטנה מ-40 מ"ק</div>}
    </div>
  );
};

const CutBlock: React.FC<{ c: PCut }> = ({ c }) => (
  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-2.5">
    <div className="flex items-center justify-between mb-1.5">
      <div className="font-semibold text-slate-800 text-sm">רישיון כריתה <span dir="ltr">#{c.num}</span></div>
      <StateChip s={c.state} />
    </div>
    <div className="text-[13px] text-slate-600">תוקף: <b dir="ltr" className="text-slate-800">{c.from} - {c.to}</b></div>
    {c.rems.length > 0 && (
      <Collapse className="mt-2.5 bg-amber-50 border border-amber-200 rounded-md">
        <Summary className="list-none cursor-pointer flex items-center justify-between px-2.5 py-2 text-[13px] font-bold text-amber-800">
          <span>רישיונות נטילה קשורים ({c.rems.length})</span><ChevronDown className="w-4 h-4" />
        </Summary>
        <div className="p-2.5 border-t border-amber-200 bg-amber-100/60">{c.rems.map((r) => <RemBlock key={r.id} r={r} />)}</div>
      </Collapse>
    )}
  </div>
);


export const ManotBody: React.FC<{ m: PopupModel }> = ({ m }) => {
  const maxMana = Math.max(0, ...m.manot.map((x) => x.area));
  return (
  <>
            {m.manot.length === 0 ? <div className="text-sm text-slate-400 text-center py-2">לא נמצאו מנות מקושרות.</div> : (
              <>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3">
                  <div className="text-[13.5px] font-bold text-center mb-3">התפלגות שטחי המנות (דונם)</div>
                  {m.manot.map((x) => <Bar key={x.id} label={`מנה ${x.order}`} value={x.area} max={maxMana} color={statusColors(x.status).main} title={`סטטוס: ${x.status}`} />)}
                </div>
                {m.manot.map((x) => (
                  <div key={x.id} className="flex items-center justify-between border-b border-dashed border-slate-200 py-2 text-[13.5px]">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: statusColors(x.status).main }} /><b>מנה {x.order}</b></div>
                    <div className="text-xs text-slate-600">{x.stands.length === 1 ? 'עומד אחד' : `${x.stands.length} עומדים`} <span className="text-slate-300 mx-1">|</span> {fmt(x.area)} דונם</div>
                    <div className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded">{x.status}</div>
                  </div>
                ))}
              </>
            )}
  </>
  );
};

export const StandsBody: React.FC<{ m: PopupModel }> = ({ m }) => {
  const maxMana = Math.max(0, ...m.manot.map((x) => x.area));
  return (
  <>
              <div className="bg-white border border-slate-200 rounded-lg p-3 mb-3">
                <div className="text-[13.5px] text-slate-700 mb-2.5">
                  <b>{m.actions.length === 1 ? 'פעולה:' : 'פעולות:'}</b> {m.actions.length === 1 ? m.actions[0].name : m.actions.map((a) => `${a.name} (${a.count})`).join(' | ')}
                </div>
                {m.groups.map((g) => (
                  <div key={g.status} className="flex justify-between items-center text-[13px] pb-1 mb-1 border-b border-dashed border-slate-100">
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: statusColors(g.status).main }} /><b>{g.status}</b></div>
                    <div className="text-slate-600 text-xs">{g.count === 1 ? 'עומד אחד' : `${g.count} עומדים`} | {fmt(g.area)} דונם | <b>{g.pct}% משטח ההתקשרות</b></div>
                  </div>
                ))}
              </div>
              {m.manot.filter((x) => x.stands.length > 0).map((x) => {
                const maxS = Math.max(...x.stands.map((s) => s.area));
                return (
                  <Collapse key={x.id} className="mb-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <Summary className="list-none cursor-pointer flex justify-between items-center px-3 py-2.5 text-sm font-bold"><span>מנה {x.order} <span className="font-normal text-slate-500 text-[13px]">({x.stands.length === 1 ? 'עומד אחד' : `${x.stands.length} עומדים`})</span></span><ChevronDown className="w-4 h-4 text-slate-500" /></Summary>
                    <div className="bg-white p-2.5 border-t border-slate-200">
                      <div className="bg-slate-100 border border-slate-200 rounded-md p-2.5 mb-2.5">
                        <div className="text-[12.5px] font-bold text-center mb-2">שטחי העומדים במנה (דונם)</div>
                        {x.stands.map((s, i) => <Bar key={i} label={s.label} value={s.area} max={maxS} color={statusColors(s.status).main} title={`סטטוס: ${s.status}`} />)}
                      </div>
                      {x.stands.map((s, i) => (
                        <div key={i} className="flex justify-between items-center gap-2 py-2 border-b border-dashed border-slate-200 last:border-0 text-[13.5px]">
                          <div className="w-[32%]"><span className="inline-block w-2 h-2 rounded-full ml-1" style={{ background: statusColors(s.status).main }} /><b>עומד {s.label}</b><br /><span className="text-[11.5px] text-slate-500 bg-slate-50 px-1.5 rounded">{s.status}</span></div>
                          <div className="w-[38%]"><span className="bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded text-xs font-bold">{s.action}</span></div>
                          <div className="w-[30%] text-left leading-tight"><b>{fmt(s.area)} דונם</b><br /><span className="text-xs text-slate-500 font-bold">{x.area > 0 ? Math.round((s.area / x.area) * 1000) / 10 : 0}% מהמנה</span></div>
                        </div>
                      ))}
                    </div>
                  </Collapse>
                );
              })}
  </>
  );
};

export const LicensesBody: React.FC<{ m: PopupModel }> = ({ m }) => {
  const maxMana = Math.max(0, ...m.manot.map((x) => x.area));
  return (
  <>
            {m.totalActiveBalance >= 1 ? (
              <div className="mb-3 text-center text-[15px] font-bold py-2.5 rounded-lg border" style={{ color: m.totalActiveBalance <= 40 ? '#D97706' : '#059669', background: m.totalActiveBalance <= 40 ? '#FEF3C7' : '#D1FAE5', borderColor: m.totalActiveBalance <= 40 ? '#FDE68A' : '#A7F3D0' }}>
                עתודה פנויה מכלל הרישיונות (נטילה): {vol(m.totalActiveBalance)}
              </div>
            ) : m.overdrafts.length ? (
              <div className="mb-3 bg-red-50 border border-red-200 p-3.5 rounded-lg text-center">
                <div className="text-base font-bold text-red-800">[!] חריגה מיתרת הנטילה</div>
                <div className="text-[13px] font-semibold text-red-700 mb-2">{m.hasActiveStands ? '(קריטי - יש עומד פעיל)' : '(חריגה אדמיניסטרטיבית - אין עומדים פעילים)'}</div>
                {m.overdrafts.map((o, i) => <div key={i} className="text-sm text-red-900 mb-1"><b>רישיון מס' {o.num}</b> בחריגה של <b dir="ltr">{vol(o.bal)}</b></div>)}
                {m.hasActiveStands && <div className="text-[13px] text-red-800 bg-red-100 px-2.5 py-1.5 rounded text-right font-bold mt-2">משפיע על עומדים פעילים: <span className="font-normal" dir="ltr">{m.activeStandsList.join(' | ')}</span></div>}
              </div>
            ) : m.hasActiveStands ? (
              <div className="mb-3 bg-red-50 border border-red-200 p-3 rounded-lg">
                <div className="font-bold text-red-800 mb-1">התראה: חסרה יתרת נטילה פעילה</div>
                <div className="text-[13.5px] text-red-900 mb-2">קיימים עומדים בסטטוס ביצוע או חריגה, אך לא נותרה יתרה פנויה ברישיונות הנטילה (מוצו או פג תוקף). לא ניתן להנפיק תעודות משלוח נוספות.</div>
                <div className="text-[13px] text-red-800 bg-red-100 px-2.5 py-1.5 rounded font-bold">עומדים מושפעים: <span className="font-normal" dir="ltr">{m.activeStandsList.join(' | ')}</span></div>
              </div>
            ) : (
              <div className="mb-3 text-center text-[15px] font-bold text-slate-500 bg-slate-50 py-2.5 rounded-lg border border-slate-200">עתודה פנויה מכלל הרישיונות (נטילה): {vol(m.totalActiveBalance)}</div>
            )}
            {m.cuts.length === 0 && m.orphanRems.length === 0 && <div className="text-sm text-slate-400 text-center py-3">לא נמצאו רישיונות בתוקף להתקשרות זו.</div>}
            {m.cuts.map((c) => <CutBlock key={c.id} c={c} />)}
            {m.orphanRems.length > 0 && (<><div className="font-bold text-amber-800 text-sm mt-4 mb-2">רישיונות נטילה ללא רישיון אב</div>{m.orphanRems.map((r) => <RemBlock key={r.id} r={r} />)}</>)}
  </>
  );
};

export const CertsBody: React.FC<{ m: PopupModel }> = ({ m }) => {
  const flat = React.useContext(FlatCtx);
  const [pCerts, setPCerts] = React.useState(1);
  const maxMana = Math.max(0, ...m.manot.map((x) => x.area));
  return (
  <>
            <div className="mb-3 text-center text-[17px] font-bold text-blue-900 bg-blue-50 py-2.5 rounded-lg">סה"כ כמות בתעודות שהונפקו: <span dir="ltr">{vol(m.certsVolume)}</span></div>
            {m.certs.length === 0 && <div className="text-sm text-slate-400 text-center py-3">לא נמצאו תעודות משלוח.</div>}
            {(flat ? m.certs.slice((pCerts - 1) * PAGE, pCerts * PAGE) : m.certs.slice(0, 60)).map((c, i) => (
              <Collapse key={i} className="mb-3 bg-white border border-slate-300 rounded-xl p-3">
                <Summary className="list-none cursor-pointer flex justify-between items-center">
                  <div><div className="font-bold text-[15px]">תעודה #{c.id}</div><div className="text-[13px] font-semibold" style={{ color: statusColors(c.status).main === '#ffde3e' ? '#A16207' : statusColors(c.status).main }}>{c.status}</div></div>
                  <div className="text-left"><div className="text-[13px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">{vol(c.qty)}</div><div className="text-xs text-slate-500" dir="ltr">{c.date}</div></div>
                </Summary>
                <div className="mt-3 border-t border-slate-100 pt-3">
                  {c.blocks.map((b, j) => (
                    <div key={j} className="mb-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex justify-between text-sm font-bold text-blue-900 mb-2"><span>רישיון נטילה מס' {b.num}</span><StateChip s={b.state} /></div>
                      <div className="flex justify-between text-sm text-slate-500 mb-2"><span>כמות בתעודה מרישיון זה:</span><b className="text-sky-700">{vol(b.qty)}</b></div>
                      <div className="flex justify-between items-center border-t border-dashed border-slate-300 pt-2"><span className="text-sm font-semibold text-slate-600">יתרה מתגלגלת בעת ההנפקה:</span><b className="text-base" style={{ color: b.rolling <= 40 ? '#DC2626' : '#0F172A' }}>{vol(b.rolling)}</b></div>
                      <div className="flex justify-between text-xs text-slate-400 mt-1"><span>יתרה עדכנית כיום:</span><span>{vol(b.current)}</span></div>
                      {b.rolling <= 40 && <div className="text-[13px] font-bold text-red-600 mt-1">שים לב: נותרו פחות מ-40 מ"ק (נכון להנפקה)</div>}
                    </div>
                  ))}
                  <div className="text-[13px] text-slate-600 bg-slate-100 p-2 rounded-md leading-snug">
                    {c.stands && <><b>מקושרת לעומדים:</b> <span dir="ltr">{c.stands}</span> <span className="text-slate-300 mx-1">|</span></>}<b>מנה:</b> <b className="text-slate-900">{c.mana}</b>
                    {c.shared && <div className="text-[13px] text-amber-600 font-semibold mt-1">שים לב: תעודה משותפת ל-{c.stands.split(',').length} עומדים</div>}
                  </div>
                  {Object.keys(c.extra).length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2.5 text-sm">
                      {Object.entries(c.extra).filter(([k]) => ['IssuerName', 'OuputType', 'TreeSpeciesName', 'HelkaStand', 'ShippingCompany', 'DriverName', 'LicensePlate', 'DestinationYard'].includes(k)).map(([k, v]) => (
                        <div key={k}><div className="text-[11px] text-slate-500">{({ IssuerName: 'מנפיק התעודה', OuputType: 'סוג תוצרת', TreeSpeciesName: 'מין עץ', HelkaStand: 'חלקה/עומד', ShippingCompany: 'חברת הובלה', DriverName: 'שם נהג', LicensePlate: 'מספר רכב', DestinationYard: 'אתר יעד' } as Record<string, string>)[k]}</div><div className="font-semibold">{v}</div></div>
                      ))}
                    </div>
                  )}
                  {c.comments && <div className="mt-2.5 bg-amber-50 border border-amber-200 p-2.5 rounded-md text-[13px] text-amber-900">{c.comments}</div>}
                </div>
              </Collapse>
            ))}
            {flat && <MiniPager total={m.certs.length} page={pCerts} onPage={setPCerts} />}
  </>
  );
};

export const LogsBody: React.FC<{ m: PopupModel }> = ({ m }) => {
  const flat = React.useContext(FlatCtx);
  const [pLogs, setPLogs] = React.useState(1);
  const maxMana = Math.max(0, ...m.manot.map((x) => x.area));
  return (
  <>
            {m.logs.length === 0 && <div className="text-sm text-slate-400 text-center py-3">לא נמצאו יומני עבודה להתקשרות זו.</div>}
            {(flat ? m.logs.slice((pLogs - 1) * PAGE, pLogs * PAGE) : m.logs.slice(0, 40)).map((l, i) => (
              <Collapse key={i} className="mb-3 bg-white border border-slate-300 rounded-xl p-3">
                <Summary className="list-none cursor-pointer flex justify-between items-center">
                  <div><div className="font-bold text-base">יומן עבודה #{l.id}</div><div className="text-[13px] font-semibold text-slate-600">{l.status}</div></div>
                  <span className="text-[13px] text-slate-500" dir="ltr">{l.date}</span>
                </Summary>
                <div className="mt-3 border-t border-slate-100 pt-3 text-sm">
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div><div className="text-[12px] text-slate-500">שעות פעילות</div><b dir="ltr">{l.start} - {l.end}</b></div>
                    <div><div className="text-[12px] text-slate-500">פעילות</div><b>{l.workType}</b></div>
                    <div className="col-span-2"><div className="text-[12px] text-slate-500">קבלן מבצע</div><b>{l.contractor}</b>
                      {l.onSite !== null && <span className={`mr-2 text-[11px] font-bold px-2 py-0.5 rounded-full border ${l.onSite ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>{l.onSite ? '✓ נוכח' : '✕ לא נוכח'}</span>}</div>
                  </div>
                  {(l.stands || l.mana) && <div className="text-[13px] text-slate-600 bg-slate-100 p-2 rounded-md mb-2"><b>מקושר לעומדים:</b> <span dir="ltr">{l.stands}</span> <span className="text-slate-300 mx-1">|</span> <b>מנה:</b> {l.mana}</div>}
                  {l.events.length > 0 && <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-2"><div className="font-bold text-red-600">אירועים חריגים</div><div className="text-red-900">{l.events.join(' | ')}</div></div>}
                  {l.violations.length > 0 && <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg mb-2"><div className="font-bold text-rose-600">הפרות שתועדו</div>{l.violations.map((v, k) => <div key={k} className="text-rose-900">• {v}</div>)}</div>}
                  {(l.summary || l.condition) && <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg mb-2">{l.summary && <div className="mb-2"><b>סיכום העבודה:</b><div className="text-slate-600">{l.summary}</div></div>}{l.condition && <div><b>מצב השטח בעת עזיבה:</b><div className="text-slate-600">{l.condition}</div></div>}</div>}
                  {l.supervisorComments && <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg mb-2"><b>הערות מדריך (מפקח):</b><div className="text-slate-600">{l.supervisorComments}</div></div>}
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <div className="font-bold text-blue-800 border-b border-blue-200 pb-1.5 mb-2">משאבים בשטח</div>
                    <div className="font-semibold text-blue-900 mb-1">עובדים ({l.workers.length}) {l.hours > 0 && <span className="font-normal text-slate-500 text-[13px]">(סה"כ {l.hours} שעות)</span>}</div>
                    <div className="bg-white border border-blue-100 rounded p-2 mb-2">{l.workers.length ? l.workers.map((w, k) => <div key={k} className="py-1 border-b border-dashed border-slate-200 last:border-0">{w}</div>) : <div className="text-[13px] text-slate-400">לא תועדו עובדים</div>}</div>
                    <div className="font-semibold text-blue-900 mb-1">ציוד ({l.equipment.length})</div>
                    <div className="bg-white border border-blue-100 rounded p-2">{l.equipment.length ? l.equipment.map((w, k) => <div key={k} className="py-1 border-b border-dashed border-slate-200 last:border-0 font-semibold">{w}</div>) : <div className="text-[13px] text-slate-400">לא תועד ציוד</div>}</div>
                  </div>
                </div>
              </Collapse>
            ))}
            {m.hasMoreLogs && <div className="text-center text-[13px] font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-md p-2.5">מטעמי ביצועים, מוצגים 100 היומנים האחרונים בלבד.</div>}
            {flat && <MiniPager total={m.logs.length} page={pLogs} onPage={setPLogs} />}
  </>
  );
};


export const StatusStepper: React.FC<{ m: PopupModel; title?: boolean }> = ({ m, title = true }) => {
  const sc = statusColors(m.status);
  return (
    <>
          {title && <div className="text-[15px] font-bold text-blue-900 text-center mb-4 mt-1">סטטוס התקשרות</div>}
          <div className="relative flex justify-between items-start mb-5">
            <div className="absolute top-3.5 right-9 left-9 h-1 bg-slate-200 rounded" >
              <div className="absolute right-0 top-0 h-full rounded" style={{ width: `${(Math.max(0, m.steps.findIndex((s) => s.current) < 0 ? m.steps.length - 1 : m.steps.findIndex((s) => s.current)) / Math.max(m.steps.length - 1, 1)) * 100}%`, background: sc.main }} />
            </div>
            {m.steps.map((s, i) => {
              const color = s.active ? (s.current ? sc.main : s.color) : '#CBD5E1';
              const dark = color === '#ffde3e';
              const op = s.current ? 1 : s.active ? 0.55 : 0.35;
              return (
                <div key={i} className="flex flex-col items-center z-10 w-[72px]">
                  <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center border-2 shadow-sm" style={{ background: s.active ? color : '#F8FAFC', borderColor: s.active ? color : '#CBD5E1', opacity: op }}>
                    {s.active && (s.current && i !== m.steps.length - 1 ? <span className="w-2.5 h-2.5 rounded-full" style={{ background: sc.text }} /> : m.cancelled && i === m.steps.length - 1 ? <X className="w-3.5 h-3.5" style={{ color: sc.text }} /> : <Check className="w-3.5 h-3.5" style={{ color: dark ? '#1E293B' : '#fff' }} />)}
                  </div>
                  <div className="text-[13px] mt-2 text-center leading-tight" style={{ fontWeight: s.current ? 800 : 500, color: s.active ? '#0F172A' : '#94A3B8', opacity: op }}>{s.name}</div>
                  {s.date && <div className="text-[10.5px] font-semibold text-center mt-0.5 leading-tight" style={{ color: s.active ? '#0F172A' : '#94A3B8', opacity: op }}>{s.date}{s.days !== null && <><br /><span className="text-[9.5px] font-medium">({s.days} ימים)</span></>}</div>}
                </div>
              );
            })}
          </div>
    </>
  );
};

export const DetailsGrid: React.FC<{ m: PopupModel }> = ({ m }) => (
          <div className="grid grid-cols-2 gap-3 text-[15px] bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-4">
            <div><span className="text-slate-500">אזור:</span> <b>{m.region}</b></div>
            <div><span className="text-slate-500">גוש:</span> <b>{m.gush}</b></div>
            <div className="col-span-2"><span className="text-slate-500">יערות:</span> <b>{m.forests}</b></div>
            <div><span className="text-slate-500">שנת תוכנית:</span> <b>{m.year}</b></div>
            <div><span className="text-slate-500">שטח כולל:</span> <b>{fmt(m.areaDunam)} דונם</b></div>
            <div className="col-span-2 border-t border-dashed border-slate-300 pt-2.5"><span className="text-slate-500 block mb-1">פעולות בהתקשרות:</span><b>{m.workType}</b></div>
            {m.stopped && (
              <div className="col-span-2 bg-red-50 rounded-lg p-2.5 border-t border-dashed border-red-300">
                <b className="text-red-800 block mb-1">הפסקת עבודה:</b>
                <span className="text-red-900">תאריך: <b>{m.stopped.date}</b> <span className="text-red-300 mx-1">|</span> סיבה: <b>{m.stopped.reason}</b></span>
              </div>
            )}
          </div>
);

export const balanceBadge = (m: PopupModel) => {
  if (m.totalActiveBalance >= 1) {
    const low = m.totalActiveBalance <= 40;
    return { t: `יתרת נטילה: ${fmt(m.totalActiveBalance)} מ"ק`, fg: low ? '#D97706' : '#059669', bg: low ? '#FEF3C7' : '#D1FAE5', bd: low ? '#FDE68A' : '#A7F3D0' };
  }
  if (m.overdrafts.length) return { t: 'חריגת נטילה', fg: '#991B1B', bg: '#FEE2E2', bd: '#FECACA' };
  if (m.hasActiveStands) return { t: 'חסרה יתרת נטילה', fg: '#991B1B', bg: '#FEE2E2', bd: '#FECACA' };
  return null;
};


export const ContractPopupCard: React.FC<{ m: PopupModel; onClose?: () => void }> = ({ m, onClose }) => {
  const sc = statusColors(m.status);
  const ringColor = m.execPct === 100 ? '#059669' : m.execPct > 0 ? '#3B82F6' : '#CBD5E1';
  const maxMana = Math.max(0, ...m.manot.map((x) => x.area));

  // כותרת יתרת נטילה
  let balBadge: { t: string; fg: string; bg: string; bd: string } | null = null;
  if (m.totalActiveBalance >= 1) {
    const low = m.totalActiveBalance <= 40;
    balBadge = { t: `יתרת נטילה: ${fmt(m.totalActiveBalance)} מ"ק`, fg: low ? '#D97706' : '#059669', bg: low ? '#FEF3C7' : '#D1FAE5', bd: low ? '#FDE68A' : '#A7F3D0' };
  } else if (m.overdrafts.length) balBadge = { t: 'חריגת נטילה', fg: '#991B1B', bg: '#FEE2E2', bd: '#FECACA' };
  else if (m.hasActiveStands) balBadge = { t: 'חסרה יתרת נטילה', fg: '#991B1B', bg: '#FEE2E2', bd: '#FECACA' };

  return (
    <div dir="rtl" className="text-right text-slate-800" style={{ fontFamily: "'Rubik','Assistant',sans-serif" }}>
      {m.reportUrl && (
        <div className="mb-2 text-left">
          <a href={m.reportUrl} target="_blank" rel="noreferrer" className="inline-block bg-[#f0f9f4] text-[#1a7431] border border-[#1a7431] rounded-full px-4 py-1.5 text-sm font-bold shadow-sm no-underline">📄 הפקת דוח (PDF)</a>
        </div>
      )}
      <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm">
        {/* כותרת */}
        <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xl font-bold text-blue-900 leading-snug">{m.name}</div>
            <div className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
              קבלן זוכה: <b className="text-slate-900">{m.contractor}</b>
              {m.subContractor && m.subContractor !== '-' && <> <span className="text-slate-300 mx-1">|</span> קבלן משנה: <b className="text-slate-900">{m.subContractor}</b></>}
              {m.workManager && m.workManager !== '-' && <> <span className="text-slate-300 mx-1">|</span> מנהל עבודה: <b className="text-slate-900">{m.workManager}</b></>}
            </div>
            {balBadge && <div className="mt-2.5 inline-block text-[13px] font-bold px-2.5 py-1 rounded-md border" style={{ color: balBadge.fg, background: balBadge.bg, borderColor: balBadge.bd }}>{balBadge.t}</div>}
          </div>
          <div className="flex flex-col items-center gap-2 shrink-0 min-w-[84px]">
            <div className="w-full text-center text-sm font-bold py-1.5 rounded-lg shadow-sm" style={{ background: sc.main, color: sc.text }}>{m.status}</div>
            <div className="relative w-12 h-12" title="מבוסס על שטח העומדים בסטטוס בוצע מתוך שטח ההתקשרות">
              <svg viewBox="0 0 36 36" className="w-12 h-12">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="3.5" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={ringColor} strokeWidth="3.5" strokeDasharray={`${m.execPct}, 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[12px] font-extrabold">{m.execPct}%</div>
            </div>
            <div className="text-[11px] font-bold text-slate-600">ביצוע</div>
            <div className="text-[11px] text-slate-600 -mt-1.5" dir="ltr">{fmt(m.doneArea)} / {fmt(m.areaDunam)}</div>
          </div>
        </div>

        {m.surveyLink && (
          <div className="px-4 pt-3.5">
            <a href={m.surveyLink} className="flex justify-center items-center bg-[#5C6BC0] text-white py-3 px-4 rounded-lg shadow border border-[#3F51B5] font-bold text-[15px] no-underline gap-2">
              <ClipboardPen className="w-4 h-4" /> לחץ לצילום מסמכי התקשרות ורישום עובדים וציוד
            </a>
          </div>
        )}

        <div className="p-4">
          {/* ציר סטטוס */}
          <StatusStepper m={m} />

          <DetailsGrid m={m} />

          {/* מנות */}
          <Section title="מנות" count={m.manot.filter((x) => x.order !== 'ללא שיוך').length} tone="#1E3A8A" bg="#DBEAFE">
            <ManotBody m={m} />
          </Section>

          {/* עומדים */}
          {m.manot.some((x) => x.stands.length > 0) && (
            <Section title="עומדים" count={m.manot.reduce((a, x) => a + x.stands.length, 0)} tone="#059669" bg="#ECFDF5">
            <StandsBody m={m} />
            </Section>
          )}

          {/* רישיונות */}
          <Section title="רישיונות" count={`${m.cuts.length} כריתה, ${m.cuts.reduce((a, c) => a + c.rems.length, 0) + m.orphanRems.length} נטילה`} tone="#3730A3" bg="#EEF2FF">
            <LicensesBody m={m} />
          </Section>

          {/* תעודות משלוח */}
          <Section title="תעודות משלוח" count={m.certs.length} tone="#0369A1" bg="#F0F9FF">
            <CertsBody m={m} />
          </Section>

          {/* יומני עבודה */}
          <Section title="יומני עבודה" count={`${m.logs.length}${m.hasMoreLogs ? '+' : ''}`} tone="#B45309" bg="#FFFBEB">
            <LogsBody m={m} />
          </Section>
        </div>
      </div>
      {onClose && null}
    </div>
  );
};
