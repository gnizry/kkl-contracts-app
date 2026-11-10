import React, { useState } from 'react';
import { X, Plug, LogOut, ShieldCheck } from 'lucide-react';
import { useConnection, parseWebMapId } from '../connection';

export const ConnectionModal: React.FC = () => {
  const c = useConnection();
  const [portalUrl, setPortalUrl] = useState(c.settings.portalUrl);
  const [webMap, setWebMap] = useState(c.settings.webMapId);
  const [username, setUsername] = useState(c.settings.username);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(!!c.settings.username);
  if (!c.modalOpen) return null;
  const input = 'w-full text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16a34a] text-slate-800';
  const connected = c.status === 'connected';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" onClick={c.closeModal}>
      <div dir="rtl" className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Plug className="w-5 h-5 text-[#16a34a]" /> חיבור ל-ArcGIS Online</h2>
          <button onClick={c.closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-xs text-slate-500 mb-4">התחברו עם שם המשתמש והסיסמה של חשבון ArcGIS Online כדי להציג את מפת "דיווח ביצוע" האמיתית. הסיסמה נשלחת ישירות לפורטל ואינה נשמרת.</p>

        {connected && (
          <div className="mb-4 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 text-sm">
            <span className="flex items-center gap-2 text-emerald-800 font-semibold"><ShieldCheck className="w-4 h-4" /> מחובר{c.user ? `: ${c.user}` : ''}</span>
            <button onClick={c.disconnect} className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline cursor-pointer"><LogOut className="w-3.5 h-3.5" /> התנתק</button>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <label className="text-xs font-semibold text-slate-600">כתובת הפורטל
            <input dir="ltr" className={`${input} mt-1`} value={portalUrl} onChange={(e) => setPortalUrl(e.target.value)} placeholder="https://kkl.maps.arcgis.com" />
          </label>
          <label className="text-xs font-semibold text-slate-600">Web Map (מזהה או קישור ל-Map Viewer)
            <input dir="ltr" className={`${input} mt-1`} value={webMap} onChange={(e) => setWebMap(e.target.value)} placeholder="https://…/mapviewer/index.html?webmap=…" />
            <span className="text-[11px] text-slate-400 font-normal">מזהה שזוהה: <span dir="ltr" className="tabular-nums">{parseWebMapId(webMap)}</span></span>
          </label>
          <label className="text-xs font-semibold text-slate-600">שם משתמש
            <input dir="ltr" className={`${input} mt-1`} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" autoComplete="username" />
          </label>
          <label className="text-xs font-semibold text-slate-600">סיסמה
            <input dir="ltr" type="password" className={`${input} mt-1`} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') c.connect({ portalUrl, webMapId: webMap, username }, password, remember); }} placeholder="••••••••" autoComplete="current-password" />
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> זכור פורטל, מפה ושם משתמש בדפדפן זה (הסיסמה לא נשמרת)
          </label>
        </div>

        {c.status === 'error' && <div className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">{c.error}</div>}
        <div className="mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
          בתצוגה המקוונת של הארטיפקט הרשת והחלונות הקופצים חסומים – החיבור יעבוד כשמריצים את הפרויקט מקומית (npm run dev) או מארחים אותו. חשבונות עם כניסה ארגונית (SSO) או אימות דו-שלבי לא נתמכים בשיטה זו – אפשר ליצור משתמש ארגוני רגיל לצורך זה.
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button onClick={c.closeModal} className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">סגור</button>
          <button
            disabled={c.status === 'connecting'}
            onClick={() => c.connect({ portalUrl, webMapId: webMap, username }, password, remember)}
            className="px-5 py-2.5 text-sm font-bold bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-60 text-white rounded-xl shadow-xs cursor-pointer"
          >
            {c.status === 'connecting' ? 'מתחבר…' : connected ? 'התחבר מחדש' : 'התחבר והצג מפה'}
          </button>
        </div>
      </div>
    </div>
  );
};
