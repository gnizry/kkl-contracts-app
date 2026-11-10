import React, { useMemo, useState } from 'react';
import { Contract } from '../types/forestry';

interface IsraelMapProps {
  contracts: Contract[];
  selectedContractId?: string | null;
  onSelectContract: (contract: Contract) => void;
}

// Web-Mercator helpers (tile math, z = 9)
const Z = 9;
const WORLD = 256 * Math.pow(2, Z);
const px = (lng: number) => ((lng + 180) / 360) * WORLD;
const py = (lat: number) => {
  const s = Math.sin((lat * Math.PI) / 180);
  return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * WORLD;
};

// Visible extent: Rosh HaNikra → Eilat
const BOUNDS = { minLng: 34.15, maxLng: 36.0, maxLat: 33.45, minLat: 29.35 };
const X0 = px(BOUNDS.minLng);
const X1 = px(BOUNDS.maxLng);
const Y0 = py(BOUNDS.maxLat);
const Y1 = py(BOUNDS.minLat);
const W = X1 - X0;
const H = Y1 - Y0;

const TILE_BASE =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile';

// Approximate state outline (lng, lat) – used as a vector fallback when tiles can't be loaded
const OUTLINE: [number, number][] = [
  [35.1, 33.09], [35.58, 33.27], [35.84, 32.95], [35.84, 32.78], [35.64, 32.69], [35.55, 32.4],
  [35.55, 31.75], [35.47, 31.45], [35.42, 31.1], [35.39, 30.75], [35.2, 30.15], [35.0, 29.55],
  [34.95, 29.5], [34.85, 29.55], [34.9, 29.9], [34.8, 30.35], [34.55, 30.4], [34.27, 31.22],
  [34.4, 31.3], [34.55, 31.55], [34.64, 31.8], [34.77, 32.08], [34.85, 32.45], [34.98, 32.82],
  [35.07, 32.92],
];

const CITIES: { n: string; lat: number; lng: number }[] = [
  { n: 'חיפה', lat: 32.794, lng: 34.99 },
  { n: 'תל אביב', lat: 32.08, lng: 34.78 },
  { n: 'ירושלים', lat: 31.77, lng: 35.21 },
  { n: 'באר שבע', lat: 31.25, lng: 34.79 },
  { n: 'אילת', lat: 29.557, lng: 34.95 },
];

// צבעי הסטטוסים כפי שמוגדרים בפופאפ ובמפת "דיווח ביצוע" של קק"ל
export const statusColor = (s: string) => {
  switch (s) {
    case 'בתכנון': return '#149ece';
    case 'לפני ביצוע':
    case 'אושר לביצוע': return '#fc921f';
    case 'בביצוע': return '#ffde3e';
    case 'הפסקת עבודה':
    case 'מושהה': return '#ed5151';
    case 'הסתיים':
    case 'בוצע': return '#a7c636';
    case 'ביטול':
    case 'בוטל': return '#f789d8';
    default: return '#64748B';
  }
};

export const IsraelMap: React.FC<IsraelMapProps> = ({ contracts, selectedContractId, onSelectContract }) => {
  const [hover, setHover] = useState<string | null>(null);

  const tiles = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    for (let ty = Math.floor(Y0 / 256); ty <= Math.floor(Y1 / 256); ty++)
      for (let tx = Math.floor(X0 / 256); tx <= Math.floor(X1 / 256); tx++) out.push({ x: tx, y: ty });
    return out;
  }, []);

  const outlinePath =
    OUTLINE.map(([lng, lat], i) => `${i ? 'L' : 'M'}${(px(lng) - X0).toFixed(1)},${(py(lat) - Y0).toFixed(1)}`).join(' ') + 'Z';

  const pts = contracts
    .filter((c) => c.Coordinates)
    .map((c) => ({
      c,
      left: ((px(c.Coordinates!.lng) - X0) / W) * 100,
      top: ((py(c.Coordinates!.lat) - Y0) / H) * 100,
    }))
    .filter((p) => p.left > 0 && p.left < 100 && p.top > 0 && p.top < 100);

  const legend = ['בביצוע', 'אושר לביצוע', 'בתכנון', 'מושהה', 'בוטל'];
  const hovered = pts.find((p) => p.c.Contract_ID === hover);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-[#d9dfe3]" style={{ aspectRatio: `${W} / ${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <rect width={W} height={H} fill="#d9dfe3" />
        <path d={outlinePath} fill="#eceeef" stroke="#c4cacd" strokeWidth={2} strokeLinejoin="round" />
        {tiles.map((t) => (
          <image
            key={`${t.x}-${t.y}`}
            href={`${TILE_BASE}/${Z}/${t.y}/${t.x}`}
            x={t.x * 256 - X0}
            y={t.y * 256 - Y0}
            width={256}
            height={256}
            onError={(e) => ((e.currentTarget as SVGImageElement).style.display = 'none')}
          />
        ))}
      </svg>

      {/* city labels */}
      {CITIES.map((ct) => (
        <div
          key={ct.n}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
          style={{ left: `${((px(ct.lng) - X0) / W) * 100}%`, top: `${((py(ct.lat) - Y0) / H) * 100}%` }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500/70" />
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 whitespace-nowrap">{ct.n}</span>
        </div>
      ))}

      {/* contract markers */}
      {pts.map(({ c, left, top }) => {
        const sel = c.Contract_ID === selectedContractId || c.Contract_ID === hover;
        return (
          <button
            key={c.Contract_ID}
            onClick={() => onSelectContract(c)}
            onMouseEnter={() => setHover(c.Contract_ID)}
            onMouseLeave={() => setHover(null)}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{ left: `${left}%`, top: `${top}%`, zIndex: sel ? 30 : 10 }}
            title={c.Contract_Name}
          >
            <span
              className="block rounded-full border-2 border-white shadow-md transition-all"
              style={{ width: sel ? 18 : 12, height: sel ? 18 : 12, background: statusColor(c.Status) }}
            />
          </button>
        );
      })}

      {hovered && (
        <div
          className="absolute z-40 pointer-events-none bg-white rounded-xl shadow-lg border border-slate-200 px-3 py-2 text-right w-52"
          style={{
            left: `${Math.min(Math.max(hovered.left, 28), 72)}%`,
            top: `${hovered.top}%`,
            transform: 'translate(-50%, calc(-100% - 14px))',
          }}
        >
          <div className="text-xs font-bold text-slate-900 truncate">{hovered.c.Contract_Number}</div>
          <div className="text-[11px] text-slate-500 truncate">{hovered.c.Contract_Name}</div>
          <div className="text-[11px] mt-0.5 font-semibold text-slate-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: statusColor(hovered.c.Status) }} />
            {hovered.c.Status} · {hovered.c.Region}
          </div>
        </div>
      )}

      {/* legend */}
      <div className="absolute bottom-2 right-2 z-20 bg-white/90 backdrop-blur rounded-xl border border-slate-200 px-2.5 py-2 text-[10px] text-slate-600 flex flex-col gap-1">
        {legend.map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor(s) }} />
            {s}
          </div>
        ))}
      </div>
      <div className="absolute bottom-1 left-2 z-20 text-[9px] text-slate-400" dir="ltr">
        Esri, HERE, Garmin
      </div>
    </div>
  );
};
