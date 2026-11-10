import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DEFAULT_PORTAL_URL, DEFAULT_WEBMAP_ID } from './config';
import { loadSdk, esriRequire } from './esriSdk';
import type { PopupModel } from './utils/popupModel';

export type ConnStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export interface ConnSettings { portalUrl: string; webMapId: string; username: string }
interface Ctx {
  settings: ConnSettings;
  status: ConnStatus;
  user: string;
  error: string;
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  connect: (s: ConnSettings, password: string, remember?: boolean) => Promise<void>;
  disconnect: () => Promise<void>;
  liveModel: PopupModel | null;
  openLive: (m: PopupModel | null) => void;
}

const KEY = 'kkl-conn-settings';
const SKEY = 'kkl-conn-session'; // טוקן זמני בלבד (sessionStorage, נמחק עם סגירת הלשונית)

async function activateToken(portalUrl: string, token: string, expires: number, username: string) {
  await loadSdk();
  const [esriId, esriConfig] = await esriRequire<[any, any]>(['esri/identity/IdentityManager', 'esri/config']);
  esriConfig.portalUrl = portalUrl;
  esriId.registerToken({ server: portalUrl + '/sharing/rest', token, userId: username, expires, ssl: true });
  const ic = esriConfig.request.interceptors || (esriConfig.request.interceptors = []);
  ic.push({ urls: /arcgis\.com/i, before(params: any) { const q = params.requestOptions.query || (params.requestOptions.query = {}); if (!q.token) q.token = token; } });
}
export const parseWebMapId = (v: string): string => {
  const m = v.match(/webmap=([0-9a-f]{32})/i) || v.match(/\b([0-9a-f]{32})\b/i);
  return m ? m[1] : v.trim();
};
const loadSaved = (): ConnSettings => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { portalUrl: DEFAULT_PORTAL_URL, webMapId: DEFAULT_WEBMAP_ID, username: '', ...JSON.parse(raw) };
  } catch {}
  return { portalUrl: DEFAULT_PORTAL_URL, webMapId: DEFAULT_WEBMAP_ID, username: '' };
};

const ConnectionContext = createContext<Ctx>(null as any);
export const useConnection = () => useContext(ConnectionContext);

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ConnSettings>(loadSaved);
  const [status, setStatus] = useState<ConnStatus>('disconnected');
  const [user, setUser] = useState('');
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [liveModel, setLiveModel] = useState<PopupModel | null>(null);

  const connect = useCallback<Ctx['connect']>(async (s, password, remember = false) => {
    const next = { ...s, portalUrl: s.portalUrl.replace(/\/+$/, ''), webMapId: parseWebMapId(s.webMapId), username: s.username.trim() };
    setSettings(next);
    setStatus('connecting');
    setError('');
    try {
      if (remember) localStorage.setItem(KEY, JSON.stringify({ portalUrl: next.portalUrl, webMapId: next.webMapId, username: next.username }));
      else localStorage.removeItem(KEY);
    } catch {}
    try {
      if (!next.username || !password) throw new Error('נא להזין שם משתמש וסיסמה.');
      // הסיסמה נשלחת ישירות לפורטל (generateToken) ואינה נשמרת בשום מקום; נשמר רק הטוקן בזיכרון.
      const body = new URLSearchParams({ username: next.username, password, client: 'referer', referer: window.location.origin, expiration: '120', f: 'json' });
      let json: any;
      try {
        const r = await fetch(next.portalUrl + '/sharing/rest/generateToken', { method: 'POST', body });
        json = await r.json();
      } catch { throw new Error('לא ניתן להגיע לפורטל (רשת/CORS חסומים). בתצוגה המקוונת של הארטיפקט זה צפוי – הריצו מקומית עם npm run dev.'); }
      if (json.error) throw new Error(json.error.message === 'Unable to generate token.' ? 'שם משתמש או סיסמה שגויים.' : (json.error.message || 'ההתחברות נכשלה.') + (json.error.details?.length ? ' – ' + json.error.details.join(' ') : ''));
      const token: string = json.token;
      await activateToken(next.portalUrl, token, json.expires, next.username);
      try { sessionStorage.setItem(SKEY, JSON.stringify({ token, expires: json.expires, username: next.username, portalUrl: next.portalUrl })); } catch {}
      setUser(next.username);
      setStatus('connected');
      setModalOpen(false);
    } catch (e: any) {
      setStatus('error');
      setError(e?.message || 'החיבור נכשל.');
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const [esriId] = await esriRequire<[any]>(['esri/identity/IdentityManager']);
      esriId.destroyCredentials();
    } catch {}
    try { sessionStorage.removeItem(SKEY); } catch {}
    setStatus('disconnected');
    setUser('');
    window.location.reload(); // מנקה interceptors וטוקן מהזיכרון
  }, []);

  // שחזור חיבור אחרי רענון הדף (כל עוד הטוקן בתוקף ובאותה לשונית)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SKEY);
      if (!raw) return;
      const t = JSON.parse(raw);
      if (!t.token || t.expires < Date.now() + 60000) { sessionStorage.removeItem(SKEY); return; }
      setStatus('connecting');
      activateToken(t.portalUrl, t.token, t.expires, t.username).then(() => { setUser(t.username); setStatus('connected'); }).catch(() => setStatus('disconnected'));
    } catch {}
  }, []);

  return (
    <ConnectionContext.Provider value={{ settings, status, user, error, modalOpen, openModal: () => setModalOpen(true), closeModal: () => setModalOpen(false), connect, disconnect, liveModel, openLive: setLiveModel }}>
      {children}
    </ConnectionContext.Provider>
  );
};
