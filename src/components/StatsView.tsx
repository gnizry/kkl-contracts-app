import React, { useMemo, useState } from 'react';
import { FileText, Boxes, Truck, Gauge, Building2, ClipboardList } from 'lucide-react';
import { Contract } from '../types/forestry';
import { CARD } from './ListKit';
import { statusColor } from './IsraelMap';
import { hasContractor } from '../utils/insights';

const P = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
const fmt = (n: number) => Math.round(n).toLocaleString('he-IL');

const Card: React.FC<{ title: string; sub?: string; children: React.ReactNode; className?: string }> = ({ title, sub, children, className = '' }) => (
  <div className={`${CARD} p-5 flex flex-col gap-3 ${className}`}>
    <div>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
    {children}
  </div>
);

const Donut: React.FC<{ data: { label: string; value: number; color: string }[]; center: string; centerSub: string }> = ({ data, center, centerSub }) => {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const R = 15.9155;
  let acc = 0;
  return (
    <div className="flex items-center gap-5 flex-wrap justify-center">
      <div className="relative w-40 h-40 shrink-0">
        <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90">
          <circle cx="21" cy="21" r={R} fill="none" stroke="#f1f5f9" strokeWidth="5" />
          {data.map((d, i) => {
            const len = (d.value / total) * 100;
            const el = (
              <circle key={i} cx="21" cy="21" r={R} fill="none" stroke={d.color} strokeWidth={hover === i ? 6 : 5}
                strokeDasharray={`${Math.max(len - 0.8, 0)} ${100 - Math.max(len - 0.8, 0)}`} strokeDashoffset={-acc}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ transition: 'stroke-width .15s' }}>
                <title>{`${d.label}: ${fmt(d.value)} (${Math.round((d.value / total) * 100)}%)`}</title>
              </circle>
            );
            acc += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-slate-900 tabular-nums">{hover !== null ? fmt(data[hover].value) : center}</div>
          <div className="text-[11px] text-slate-500">{hover !== null ? data[hover].label : centerSub}</div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 text-xs">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-slate-600" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
            <span className="min-w-24">{d.label}</span>
            <span className="tabular-nums text-slate-800 font-semibold">{fmt(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const HBars: React.FC<{ rows: { label: string; value: number; value2?: number }[]; c1?: string; c2?: string; unit?: string }> = ({ rows, c1 = P[0], c2 = P[1], unit = '' }) => {
  const max = Math.max(1, ...rows.map((r) => Math.max(r.value, r.value2 || 0)));
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.label} className="flex flex-col gap-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-700 font-medium truncate">{r.label}</span>
            <span className="tabular-nums text-slate-500">{r.value2 !== undefined ? `מאושר ${fmt(r.value)} · פונה ${fmt(r.value2)}` : `${fmt(r.value)}${unit}`}</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden" title={`${r.label}: ${fmt(r.value)}${unit}`}>
            <div className="h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: c1 }} />
          </div>
          {r.value2 !== undefined && (
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden" title={`${r.label}: ${fmt(r.value2)}${unit}`}>
              <div className="h-full rounded-full" style={{ width: `${(r.value2 / max) * 100}%`, background: c2 }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const Columns: React.FC<{ data: { label: string; value: number }[]; color?: string; height?: number }> = ({ data, color = P[0], height = 170 }) => {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div dir="ltr" className="w-full">
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            {hover === i && <div className="absolute -top-1 -translate-y-full z-10 bg-slate-900 text-white text-[11px] px-2 py-1 rounded-lg whitespace-nowrap">{d.label}: {fmt(d.value)}</div>}
            <div className="w-full rounded-t-md" style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 2 : 0, background: color, opacity: hover === null || hover === i ? 1 : 0.55 }} />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mt-1.5 border-t border-slate-200 pt-1">
        {data.map((d, i) => <div key={i} className="flex-1 text-center text-[10px] text-slate-400 truncate">{d.label}</div>)}
      </div>
    </div>
  );
};

const Tile: React.FC<{ icon: React.ElementType; label: string; value: string; sub?: string; tone: string }> = ({ icon: Icon, label, value, sub, tone }) => (
  <div className={`${CARD} p-5 flex items-center justify-between`}>
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-3xl font-bold text-slate-900 tabular-nums mt-0.5">{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: tone + '1a', color: tone }}><Icon className="w-6 h-6" /></div>
  </div>
);

export const StatsView: React.FC<{ contracts: Contract[] }> = ({ contracts }) => {
  const d = useMemo(() => {
    const total = contracts.length;
    const approved = contracts.reduce((a, c) => a + c.TotalApprovedMQ, 0);
    const delivered = contracts.reduce((a, c) => a + c.TotalDeliveredMQ, 0);
    const live = contracts.filter((c) => c.Status === 'בביצוע');
    const avgExec = live.length ? live.reduce((a, c) => a + c.ExecutionPercent, 0) / live.length : 0;
    const contractors = new Set(contracts.filter(hasContractor).map((c) => c.Contractor)).size;
    const logs = contracts.reduce((a, c) => a + c.WorkLogs.length, 0);

    const statusOrder = ['בביצוע', 'אושר לביצוע', 'בתכנון', 'מושהה', 'בוטל', 'הסתיים'];
    const byStatus = statusOrder.map((s) => ({ label: s, value: contracts.filter((c) => c.Status === s).length, color: statusColor(s) })).filter((x) => x.value);

    const regions = Array.from(new Set(contracts.map((c) => c.Region)));
    const byRegion = regions.map((r) => ({
      label: r,
      value: contracts.filter((c) => c.Region === r).reduce((a, c) => a + c.TotalApprovedMQ, 0),
      value2: contracts.filter((c) => c.Region === r).reduce((a, c) => a + c.TotalDeliveredMQ, 0),
    })).sort((a, b) => b.value - a.value);

    const yr: Record<string, number> = {};
    const wood: Record<string, number> = {};
    contracts.forEach((c) => c.DeliveryNotes.forEach((n) => {
      const y = (n.Date || '').slice(0, 4);
      if (y) yr[y] = (yr[y] || 0) + n.QuantityMQ;
      const w = (n.WoodType || 'אחר').replace(/\s*-.*$/, '').replace(/\(.*\)/, '').trim() || 'אחר';
      wood[w] = (wood[w] || 0) + n.QuantityMQ;
    }));
    const byYear = Object.keys(yr).sort().slice(-14).map((y) => ({ label: y, value: yr[y] }));
    const woodSorted = Object.entries(wood).sort((a, b) => b[1] - a[1]);
    const woodTop = woodSorted.slice(0, 6).map(([label, value], i) => ({ label, value, color: P[i] }));
    const rest = woodSorted.slice(6).reduce((a, [, v]) => a + v, 0);
    if (rest) woodTop.push({ label: 'אחר', value: rest, color: '#94a3b8' });

    const cm: Record<string, number> = {};
    contracts.filter(hasContractor).forEach((c) => (cm[c.Contractor] = (cm[c.Contractor] || 0) + 1));
    const topContractors = Object.entries(cm).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value }));

    const bins = ['0–25%', '25–50%', '50–75%', '75–100%'];
    const execBins = bins.map((label, i) => ({ label, value: live.filter((c) => c.ExecutionPercent >= i * 25 && (i === 3 ? c.ExecutionPercent <= 100 : c.ExecutionPercent < (i + 1) * 25)).length }));

    const lm: Record<string, number> = {};
    contracts.forEach((c) => c.WorkLogs.forEach((l) => { const m = (l.Date || '').slice(0, 7); if (m) lm[m] = (lm[m] || 0) + 1; }));
    const logMonths = Object.keys(lm).sort().slice(-12).map((m) => ({ label: m.slice(5) + '/' + m.slice(2, 4), value: lm[m] }));

    const lic = contracts.flatMap((c) => c.Felling_Licenses.flatMap((f) => f.Removing_Licenses));
    const licApproved = lic.reduce((a, r) => a + r.ApprovedMQ, 0);
    const licDelivered = lic.reduce((a, r) => a + r.DeliveredMQ, 0);

    return { total, approved, delivered, avgExec, contractors, logs, byStatus, byRegion, byYear, woodTop, topContractors, execBins, logMonths, lic: lic.length, licPct: licApproved ? (licDelivered / licApproved) * 100 : 0, live: live.length };
  }, [contracts]);

  const R = 42, C = 2 * Math.PI * R;
  const ringPct = d.approved ? Math.min(100, (d.delivered / d.approved) * 100) : 0;

  return (
    <div className="flex flex-col gap-5 text-right">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Tile icon={FileText} label="התקשרויות" value={fmt(d.total)} sub={`${d.live} בביצוע`} tone="#2a78d6" />
        <Tile icon={Boxes} label="נפח מאושר" value={fmt(d.approved)} sub="מ״ק" tone="#1baf7a" />
        <Tile icon={Truck} label="נפח שפונה" value={fmt(d.delivered)} sub="מ״ק" tone="#eb6834" />
        <Tile icon={Gauge} label="ביצוע ממוצע" value={`${Math.round(d.avgExec)}%`} sub="התקשרויות בביצוע" tone="#6250d6" />
        <Tile icon={Building2} label="קבלנים פעילים" value={fmt(d.contractors)} tone="#eda100" />
        <Tile icon={ClipboardList} label="יומני עבודה" value={fmt(d.logs)} tone="#e87ba4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title="התקשרויות לפי סטטוס"><Donut data={d.byStatus} center={String(d.total)} centerSub="התקשרויות" /></Card>
        <Card title="נפח מאושר מול נפח שפונה" sub="לפי מרחב, מ״ק">
          <HBars rows={d.byRegion} />
          <div className="flex gap-4 text-[11px] text-slate-500"><span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm" style={{ background: P[0] }} />מאושר</span><span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm" style={{ background: P[1] }} />פונה</span></div>
        </Card>
        <Card title="ניצול רישיונות נטילה" sub={`${fmt(d.lic)} רישיונות`}>
          <div className="flex items-center justify-center py-2">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
                <circle cx="50" cy="50" r={R} fill="none" stroke="#e2e8f0" strokeWidth="10" />
                <circle cx="50" cy="50" r={R} fill="none" stroke="#16a34a" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(d.licPct / 100) * C} ${C}`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center"><div className="text-3xl font-bold text-slate-900">{Math.round(d.licPct)}%</div><div className="text-[11px] text-slate-500">פונה מהמאושר</div></div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 text-center">כלל התקשרויות: {Math.round(ringPct)}% פונה מהנפח המאושר</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="נפח שפונה לפי שנה" sub="מ״ק, מתעודות המשלוח במערכת (דגימה היסטורית)"><Columns data={d.byYear} /></Card>
        <Card title="יומני עבודה לפי חודש" sub="12 החודשים האחרונים עם נתונים"><Columns data={d.logMonths} color={P[2]} /></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title="סוגי עץ שפונו" sub="מ״ק"><Donut data={d.woodTop} center={fmt(d.woodTop.reduce((a, x) => a + x.value, 0))} centerSub='סה״כ מ״ק' /></Card>
        <Card title="קבלנים מובילים" sub="מספר התקשרויות"><HBars rows={d.topContractors} c1={P[6]} unit=" התקשרויות" /></Card>
        <Card title="התפלגות אחוזי ביצוע" sub={`${d.live} התקשרויות בביצוע`}><Columns data={d.execBins} color={P[3]} /></Card>
      </div>
    </div>
  );
};
