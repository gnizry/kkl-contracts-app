import React, { useEffect, useRef } from 'react';
import { Contract } from '../types/forestry';
import { statusColor } from './IsraelMap';
import { BASEMAP } from '../config';
import { loadSdk, addBasemapGallery } from '../esriSdk';

export type MapFocus = { kind: 'all' } | { kind: 'contract'; id: string } | { kind: 'region'; region: string };

interface EsriMapProps {
  contracts: Contract[];
  selectedId: string | null;
  focus: (MapFocus & { nonce: number }) | null;
  onSelect: (id: string | null) => void;
  onReady: () => void;
  onFail: () => void;
  height: number | string;
}

export const EsriMap: React.FC<EsriMapProps> = ({ contracts, selectedId, focus, onSelect, onReady, onFail, height }) => {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<any>(null); // { view, layer, Graphic, ... }
  const latest = useRef({ contracts, selectedId, onSelect });
  latest.current = { contracts, selectedId, onSelect };

  const redraw = () => {
    const a = api.current;
    if (!a) return;
    const { contracts: cs, selectedId: sel } = latest.current;
    a.layer.removeAll();
    cs.filter((c) => c.Coordinates).forEach((c) => {
      const isSel = c.Contract_ID === sel;
      a.layer.add(
        new a.Graphic({
          geometry: { type: 'point', longitude: c.Coordinates!.lng, latitude: c.Coordinates!.lat },
          attributes: { id: c.Contract_ID },
          symbol: {
            type: 'simple-marker',
            style: 'circle',
            color: statusColor(c.Status),
            size: isSel ? 20 : 13,
            outline: { color: isSel ? '#0f172a' : '#ffffff', width: isSel ? 2.5 : 1.5 },
          },
        })
      );
    });
  };

  // init
  useEffect(() => {
    let disposed = false;
    loadSdk()
      .then(() => {
        if (disposed || !host.current) return;
        window.require(
          ['esri/Map', 'esri/WebMap', 'esri/config', 'esri/views/MapView', 'esri/Graphic', 'esri/layers/GraphicsLayer'],
          (EsriMapCls: any, WebMap: any, esriConfig: any, MapView: any, Graphic: any, GraphicsLayer: any) => {
            if (disposed || !host.current) return;
                        const layer = new GraphicsLayer({ title: 'התקשרויות (מוקאפ)' });
            const map = new EsriMapCls({ basemap: BASEMAP });
            map.add(layer);
            const view = new MapView({
              container: host.current,
              map,
              center: [35.0, 31.55],
              zoom: 7,
              constraints: { minZoom: 6 },
              ui: { components: ['zoom', 'attribution'] },
            });
            api.current = { view, layer, Graphic };
            addBasemapGallery(view);
            view.when(() => {
              if (disposed) return;
              redraw();
              onReady();
            }).catch(() => onFail());
            view.on('click', (ev: any) => {
              view.hitTest(ev, { include: layer }).then((res: any) => {
                const g = res.results.find((r: any) => r.graphic?.attributes?.id);
                latest.current.onSelect(g ? g.graphic.attributes.id : null);
              });
            });
          },
          () => onFail()
        );
      })
      .catch(() => onFail());
    return () => {
      disposed = true;
      try {
        api.current?.view?.destroy();
      } catch {}
      api.current = null;
    };
    // eslint-disable-next-line
  }, []);

  useEffect(redraw, [contracts, selectedId]);

  // focus requests
  useEffect(() => {
    const a = api.current;
    if (!a || !focus) return;
    if (focus.kind === 'contract') {
      const c = latest.current.contracts.find((x) => x.Contract_ID === focus.id);
      if (c?.Coordinates) a.view.goTo({ center: [c.Coordinates.lng, c.Coordinates.lat], zoom: 13 }, { duration: 900 });
    } else {
      const list = latest.current.contracts.filter((c) => c.Coordinates && (focus.kind === 'all' || c.Region === focus.region));
      if (!list.length) return;
      if (focus.kind === 'all') {
        a.view.goTo({ center: [35.0, 31.55], zoom: 7 }, { duration: 900 });
      } else {
        const gs = a.layer.graphics.toArray().filter((g: any) => list.some((c) => c.Contract_ID === g.attributes.id));
        a.view.goTo(gs.length > 1 ? gs : { center: [list[0].Coordinates!.lng, list[0].Coordinates!.lat], zoom: 11 }, { duration: 900 });
      }
    }
  }, [focus]);

  return <div ref={host} dir="ltr" style={{ height, width: '100%' }} className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100" />;
};
