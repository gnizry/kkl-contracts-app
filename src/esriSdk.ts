import { ARCGIS_JS_URL } from './config';

declare global {
  interface Window {
    require?: any;
  }
}

let sdkPromise: Promise<void> | null = null;

/** טוען את ArcGIS Maps SDK for JavaScript (AMD) מה-CDN של Esri */
export const loadSdk = (): Promise<void> => {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<void>((resolve, reject) => {
    if (window.require && (window as any).dojoConfig !== undefined) return resolve();
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = `${ARCGIS_JS_URL}esri/themes/light/main.css`;
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = ARCGIS_JS_URL;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('sdk'));
    document.head.appendChild(s);
    setTimeout(() => reject(new Error('timeout')), 9000);
  });
  sdkPromise.catch(() => (sdkPromise = null));
  return sdkPromise;
};

export const esriRequire = <T extends any[]>(mods: string[]): Promise<T> =>
  new Promise((resolve, reject) => window.require(mods, (...m: any) => resolve(m as T), (e: any) => reject(e)));

/** מוסיף למפה כפתור "גלריית מפות רקע" (BasemapGallery בתוך Expand) – כמו ווידג'ט Basemap gallery ב-ExB */
export const addBasemapGallery = async (view: any) => {
  try {
    const [BasemapGallery, Expand] = await esriRequire<[any, any]>(['esri/widgets/BasemapGallery', 'esri/widgets/Expand']);
    const gallery = new BasemapGallery({ view });
    const expand = new Expand({ view, content: gallery, expandIcon: 'basemap', expandTooltip: 'גלריית מפות רקע', group: 'map-tools' });
    view.ui.add(expand, 'top-left');
  } catch { /* ללא גלריה אם ה-SDK לא נטען */ }
};
