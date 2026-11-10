import React, { useEffect, useRef, useState } from 'react';
import { Layers, Loader2 } from 'lucide-react';
import { loadSdk, esriRequire, addBasemapGallery } from '../esriSdk';
import { useConnection } from '../connection';
import { discoverLayers } from '../utils/liveData';

interface Props {
  /** תנאי סינון על שכבת ההתקשרויות (למשל OBJECTID IN (1,2)) */
  where: string;
  height?: number;
  title?: string;
  subtitle?: string;
  note?: string;
  noHeader?: boolean;
}

/** מפה חיה קטנה מהפורטל, מסוננת להתקשרות/ות מסוימות ומתמקדת בהן */
export const LiveMiniMap: React.FC<Props> = ({ where, height = 300, title = 'מפת התקשרות', subtitle, note, noHeader }) => {
  const { settings } = useConnection();
  const host = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [err, setErr] = useState('');
  const ref = useRef<{ view?: any; layer?: any }>({});

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        await loadSdk();
        const [WebMap, MapView] = await esriRequire<[any, any]>(['esri/WebMap', 'esri/views/MapView']);
        if (off || !host.current) return;
        const map = new WebMap({ portalItem: { id: settings.webMapId } });
        const view = new MapView({ container: host.current, map, ui: { components: ['zoom'] } });
        view.popup.autoOpenEnabled = false;
        addBasemapGallery(view);
        ref.current.view = view;
        await view.when();
        const L = await discoverLayers(map);
        L.tender.visible = true; L.tender.popupEnabled = false;
        ref.current.layer = L.tender;
        if (!off) setPhase('ready');
      } catch (e: any) { if (!off) { setErr(e?.message || String(e)); setPhase('error'); } }
    })();
    return () => { off = true; try { ref.current.view?.destroy(); } catch {} ref.current = {}; };
    // eslint-disable-next-line
  }, [settings.webMapId]);

  useEffect(() => {
    const { view, layer } = ref.current;
    if (phase !== 'ready' || !layer) return;
    layer.definitionExpression = where;
    (async () => {
      try {
        const res = await layer.queryFeatures({ where, returnGeometry: true, outFields: ['OBJECTID'] });
        if (!res.features.length) return;
        const g = res.features.length === 1 ? res.features[0].geometry : null;
        if (g && g.type === 'point') await view.goTo({ target: g, zoom: 15 }, { duration: 700 });
        else await view.goTo(res.features, { duration: 700 });
        if (res.features.length <= 3) { try { const lv = await view.whenLayerView(layer); lv.highlight(res.features); } catch {} }
      } catch {}
    })();
  }, [where, phase]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col text-right">
      {!noHeader && (
        <div className="bg-white border-b border-slate-100 text-slate-800 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-sm font-bold">{title}</div>
              {subtitle && <div className="text-[11px] text-slate-500">{subtitle}</div>}
            </div>
          </div>
          <span className="text-[10px] tabular-nums bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">ArcGIS · חי</span>
        </div>
      )}
      <div className="relative">
        <div ref={host} dir="ltr" style={{ height, width: '100%' }} className="bg-slate-100" />
        {phase === 'loading' && <div className="absolute inset-0 bg-slate-100/90 flex items-center justify-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> טוען מהפורטל…</div>}
        {phase === 'error' && <div className="absolute inset-0 bg-white/95 flex items-center justify-center p-4 text-center text-xs text-rose-700">שגיאה בטעינת המפה: {err}</div>}
      </div>
      {note && <div className="px-4 py-2 text-[11px] text-slate-500 bg-slate-50 border-t border-slate-100">{note}</div>}
    </div>
  );
};
