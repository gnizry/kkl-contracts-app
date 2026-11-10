import { Contract } from '../types/forestry';
import { isLowBalance } from './licenses';

export type Severity = 'critical' | 'warning' | 'info';
export interface AlertItem {
  id: string;
  severity: Severity;
  type: string;
  title: string;
  detail: string;
  date: string;
  contractId: string;
}

const DAY = 86400000;
export const toTime = (s?: string) => (s ? new Date(s.replace(' ', 'T')).getTime() : NaN);
export const hasContractor = (c: Contract) => !!c.Contractor && !c.Contractor.includes('טרם נבחר');
export const isLive = (c: Contract) => c.Status === 'בביצוע' || c.Status === 'אושר לביצוע';

export const buildAlerts = (contracts: Contract[], now = Date.now()): AlertItem[] => {
  const out: AlertItem[] = [];
  const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

  contracts.forEach((c) => {
    // low balance
    c.Felling_Licenses.forEach((fl) =>
      fl.Removing_Licenses.forEach((rl) => {
        if (isLowBalance(rl))
          out.push({
            id: `lb-${rl.Removing_License_ID}`,
            severity: 'warning',
            type: 'יתרה נמוכה',
            title: `יתרה נמוכה ברישיון נטילה ${rl.License_Number}`,
            detail: `${c.Contract_Name} · נותרו ${rl.BalanceMQ} מ״ק (מתוך ${rl.ApprovedMQ})`,
            date: rl.ExpiryDate || '',
            contractId: c.Contract_ID,
          });
        if (c.Status === 'בביצוע' && rl.BalanceMQ > 0 && !rl.Status.startsWith('לא בתוקף')) {
          const exp = toTime(rl.ExpiryDate);
          if (exp && exp > now && exp - now < 30 * DAY)
            out.push({
              id: `ex-${rl.Removing_License_ID}`,
              severity: 'warning',
              type: 'פקיעת רישיון',
              title: `רישיון נטילה ${rl.License_Number} פג בעוד ${Math.ceil((exp - now) / DAY)} ימים`,
              detail: `${c.Contract_Name} · יתרה ${rl.BalanceMQ} מ״ק`,
              date: rl.ExpiryDate,
              contractId: c.Contract_ID,
            });
        }
      })
    );

    // safety incidents
    c.WorkLogs.filter((l) => l.SafetyIncident).forEach((l) =>
      out.push({
        id: `sf-${l.Log_ID}`,
        severity: 'critical',
        type: 'אירוע בטיחות',
        title: `אירוע בטיחות ביומן ${l.Log_ID}`,
        detail: `${c.Contract_Name}${l.SafetyNotes ? ' · ' + l.SafetyNotes : ''}`,
        date: l.Date,
        contractId: c.Contract_ID,
      })
    );

    if (c.Status === 'בביצוע') {
      const end = toTime(c.EndDate);
      if (end && end < now)
        out.push({
          id: `od-${c.Contract_ID}`,
          severity: 'critical',
          type: 'חריגה מלו״ז',
          title: `חריגה מתאריך סיום – ${c.Contract_Number}`,
          detail: `${c.Contract_Name} · תאריך סיום ${c.EndDate} · ביצוע ${Math.round(c.ExecutionPercent)}%`,
          date: c.EndDate,
          contractId: c.Contract_ID,
        });

      const last = Math.max(0, ...c.WorkLogs.map((l) => toTime(l.Date) || 0));
      const days = last ? Math.floor((now - last) / DAY) : null;
      if (days === null || days > 14)
        out.push({
          id: `nl-${c.Contract_ID}`,
          severity: 'warning',
          type: 'אין פעילות שטח',
          title: days === null ? `התקשרות בביצוע ללא יומני עבודה – ${c.Contract_Number}` : `לא נקלט יומן עבודה ${days} ימים – ${c.Contract_Number}`,
          detail: c.Contract_Name,
          date: last ? iso(last) : '',
          contractId: c.Contract_ID,
        });

      const s = toTime(c.StartDate);
      if (s && end && end > s) {
        const elapsed = Math.min(1, Math.max(0, (now - s) / (end - s))) * 100;
        if (elapsed - c.ExecutionPercent > 30)
          out.push({
            id: `sl-${c.Contract_ID}`,
            severity: 'info',
            type: 'פיגור בביצוע',
            title: `ביצוע ${Math.round(c.ExecutionPercent)}% לעומת ${Math.round(elapsed)}% מהזמן – ${c.Contract_Number}`,
            detail: c.Contract_Name,
            date: iso(now),
            contractId: c.Contract_ID,
          });
      }
    }

    if (isLive(c) && !hasContractor(c))
      out.push({
        id: `nc-${c.Contract_ID}`,
        severity: c.Status === 'בביצוע' ? 'critical' : 'warning',
        type: 'ללא קבלן',
        title: `התקשרות ${c.Status} ללא קבלן מבצע – ${c.Contract_Number}`,
        detail: c.Contract_Name,
        date: c.StartDate || '',
        contractId: c.Contract_ID,
      });
  });

  const w = { critical: 0, warning: 1, info: 2 };
  return out.sort((a, b) => w[a.severity] - w[b.severity] || (b.date || '').localeCompare(a.date || ''));
};

export interface DqIssue { label: string; sub: string; contractId: string }
export interface DqRule {
  id: string;
  title: string;
  hint: string;
  severity: Severity;
  bad: number;
  total: number;
  items: DqIssue[];
}

export const buildDataQuality = (contracts: Contract[]): DqRule[] => {
  const rules: DqRule[] = [];
  const add = (id: string, title: string, hint: string, severity: Severity, total: number, items: DqIssue[]) =>
    rules.push({ id, title, hint, severity, total, bad: items.length, items });

  add('c-contractor', 'התקשרויות ללא קבלן', 'שדה קבלן ריק או "טרם נבחר קבלן"', 'warning', contracts.length,
    contracts.filter((c) => !hasContractor(c)).map((c) => ({ label: c.Contract_Number, sub: `${c.Contract_Name} · ${c.Status}`, contractId: c.Contract_ID })));

  add('c-dates', 'התקשרויות ללא תאריך התחלה', 'נדרש להצגה בציר הזמן ולחישוב פיגור', 'info', contracts.length,
    contracts.filter((c) => !c.StartDate).map((c) => ({ label: c.Contract_Number, sub: `${c.Contract_Name} · ${c.Status}`, contractId: c.Contract_ID })));

  add('c-geo', 'התקשרויות ללא מיקום', 'אין גיאומטריה/קואורדינטה – לא יוצגו במפה', 'warning', contracts.length,
    contracts.filter((c) => !c.Coordinates).map((c) => ({ label: c.Contract_Number, sub: c.Contract_Name, contractId: c.Contract_ID })));

  add('c-mano', 'התקשרויות ללא מנות', 'אין רשומות ב-SubWorkUnits המקושרות להתקשרות', 'info', contracts.length,
    contracts.filter((c) => c.Manot.length === 0).map((c) => ({ label: c.Contract_Number, sub: `${c.Contract_Name} · ${c.Status}`, contractId: c.Contract_ID })));

  add('c-nolog', 'התקשרויות בביצוע ללא יומני עבודה', 'התקשרות פעילה בלי אף יומן', 'critical', contracts.filter((c) => c.Status === 'בביצוע').length,
    contracts.filter((c) => c.Status === 'בביצוע' && c.WorkLogs.length === 0).map((c) => ({ label: c.Contract_Number, sub: c.Contract_Name, contractId: c.Contract_ID })));

  const dns = contracts.flatMap((c) => c.DeliveryNotes.map((n) => ({ n, c })));
  add('dn-lic', 'תעודות משלוח שלא משויכות לרישיון נטילה', 'Removing_License_ID ריק – לא ניתן לחשב יתרה', 'critical', dns.length,
    dns.filter(({ n }) => !n.Removing_License_ID).map(({ n, c }) => ({ label: n.Delivery_ID, sub: `${n.QuantityMQ} מ״ק · ${c.Contract_Name}`, contractId: c.Contract_ID })));

  add('dn-guess', 'תעודות עם שיוך משוער להתקשרות', 'השיוך נעשה לפי יער/אזור ולא לפי מפתח – דורש קישור אמיתי', 'warning', dns.length,
    dns.filter(({ n }) => (n.Notes || '').includes('משוער')).map(({ n, c }) => ({ label: n.Delivery_ID, sub: c.Contract_Name, contractId: c.Contract_ID })));

  const fls = contracts.flatMap((c) => c.Felling_Licenses.map((f) => ({ f, c })));
  add('fl-forest', 'רישיונות כריתה ללא יער', 'אין יער/פקיד מנפיק ברישיון', 'critical', fls.length,
    fls.filter(({ f }) => !f.ForesterName || !f.ForesterName.trim()).map(({ f, c }) => ({ label: f.License_Number, sub: c.Contract_Name, contractId: c.Contract_ID })));

  add('fl-qty', 'רישיונות כריתה ללא כמות מאושרת', 'ApprovedQuantityMQ = 0', 'warning', fls.length,
    fls.filter(({ f }) => !f.ApprovedQuantityMQ).map(({ f, c }) => ({ label: f.License_Number, sub: `${f.Felling_License_ID} · ${c.Contract_Name}`, contractId: c.Contract_ID })));

  const rls = fls.flatMap(({ f, c }) => f.Removing_Licenses.map((r) => ({ r, f, c })));
  add('rl-over', 'רישיונות נטילה עם פינוי מעל המאושר', 'DeliveredMQ > ApprovedMQ', 'critical', rls.length,
    rls.filter(({ r }) => r.DeliveredMQ > r.ApprovedMQ).map(({ r, c }) => ({ label: r.License_Number, sub: `פונה ${r.DeliveredMQ} מתוך ${r.ApprovedMQ}`, contractId: c.Contract_ID })));

  add('rl-dest', 'רישיונות נטילה ללא יעד פינוי', 'שדה יעד ריק', 'info', rls.length,
    rls.filter(({ r }) => !r.Destination || !r.Destination.trim()).map(({ r, c }) => ({ label: r.License_Number, sub: c.Contract_Name, contractId: c.Contract_ID })));

  const wls = contracts.flatMap((c) => c.WorkLogs.map((l) => ({ l, c })));
  add('wl-workers', 'יומני עבודה ללא רשימת עובדים', 'WorkersList ריק', 'info', wls.length,
    wls.filter(({ l }) => !l.Workers || !l.Workers.trim() || l.Workers === '-').map(({ l, c }) => ({ label: l.Log_ID, sub: c.Contract_Name, contractId: c.Contract_ID })));

  return rules;
};

/** תאריך בפורמט dd/mm/yyyy (08/11/2026) */
export const fmtDMY = (s?: string) => {
  if (!s) return '';
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(s);
};
