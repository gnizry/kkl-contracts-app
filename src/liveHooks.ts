import { useEffect, useState } from 'react';
import { useConnection } from './connection';
import { fetchPopupModel, findTendersByName, getLiveLayers } from './utils/liveData';
import { Attr, PopupModel } from './utils/popupModel';

export type LivePhase = 'idle' | 'loading' | 'found' | 'none' | 'error';

/** התאמת התקשרות/ות מהדמו להתקשרויות חיות בפורטל (לפי שם) */
export function useLiveMatch(names: string[]) {
  const { status, settings } = useConnection();
  const key = names.join('|');
  const [st, setSt] = useState<{ phase: LivePhase; attrs: Attr[] }>({ phase: 'idle', attrs: [] });
  useEffect(() => {
    if (status !== 'connected') { setSt({ phase: 'idle', attrs: [] }); return; }
    let off = false;
    setSt({ phase: 'loading', attrs: [] });
    (async () => {
      try {
        const L = await getLiveLayers(settings.webMapId);
        const attrs = await findTendersByName(L, names);
        if (!off) setSt({ phase: attrs.length ? 'found' : 'none', attrs });
      } catch { if (!off) setSt({ phase: 'error', attrs: [] }); }
    })();
    return () => { off = true; };
    // eslint-disable-next-line
  }, [status, settings.webMapId, key]);
  return st;
}

/** מודל פופאפ חי להתקשרות לפי שם */
export function useLiveContractModel(name: string) {
  const { settings } = useConnection();
  const m = useLiveMatch([name]);
  const [model, setModel] = useState<PopupModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => {
    setModel(null); setErr('');
    if (m.phase !== 'found') return;
    let off = false;
    setLoading(true);
    (async () => {
      try {
        const L = await getLiveLayers(settings.webMapId);
        const mod = await fetchPopupModel(L, m.attrs[0]);
        if (!off) setModel(mod);
      } catch (e: any) { if (!off) setErr(e?.message || String(e)); }
      finally { if (!off) setLoading(false); }
    })();
    return () => { off = true; };
    // eslint-disable-next-line
  }, [m.phase, m.attrs, settings.webMapId]);
  return { phase: m.phase, model, loading: loading || m.phase === 'loading', err };
}
