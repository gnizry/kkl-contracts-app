import React, { useState } from 'react';
import {
  MapPin,
  Layers,
  ZoomIn,
  ZoomOut,
  Navigation,
  Compass,
  Trees,
  Truck,
  CheckCircle2,
} from 'lucide-react';

export interface GisMiniMapProps {
  title?: string;
  subtitle?: string;
  heightClass?: string;
  type: 'contract' | 'license' | 'delivery' | 'worklog' | 'contractor' | 'national';
  locationName?: string;
  coordinates?: { lat: number; lng: number };
  stands?: Array<{ id: string; status: string; species?: string; area?: number }>;
  routeInfo?: { from: string; to: string; distanceKm?: number };
  contractorProjects?: Array<{ name: string; region: string; block: string }>;
  accentColor?: string;
}

export const GisMiniMap: React.FC<GisMiniMapProps> = ({
  title = 'מפת שטח GIS',
  subtitle,
  heightClass = 'h-64',
  type,
  locationName = 'יער קק״ל',
  coordinates = { lat: 32.618, lng: 35.292 },
  stands = [],
  routeInfo,
  contractorProjects = [],
  accentColor = '#16a34a',
}) => {
  const [basemap, setBasemap] = useState<'forest' | 'topo' | 'satellite' | 'gray'>('forest');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const getBgStyle = () => {
    switch (basemap) {
      case 'satellite':
        return 'bg-gradient-to-br from-[#2a382b] via-[#3d4b3c] to-[#202c21]';
      case 'topo':
        return 'bg-[#eef2eb]';
      case 'gray':
        return 'bg-[#f1f3f5]';
      case 'forest':
      default:
        return 'bg-[#e5f0e2]';
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col text-right">
      {/* Map Widget Top Bar */}
      <div className="bg-white border-b border-slate-100 text-slate-800 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-emerald-600" />
          <div>
            <h4 className="text-xs md:text-sm font-bold font-['Rubik',sans-serif] text-slate-800">
              {title}
            </h4>
            {subtitle && <p className="text-[11px] text-slate-500 leading-none mt-0.5">{subtitle}</p>}
          </div>
        </div>

      </div>

      {/* Map Viewport Canvas */}
      <div className={`relative ${heightClass} ${getBgStyle()} overflow-hidden select-none`}>
        {/* Topographic Contours / Grid SVG */}
        <svg className="absolute inset-0 w-full h-full object-cover opacity-70" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern-modern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(22, 163, 74, 0.12)" strokeWidth="1" />
            </pattern>
            <pattern id="contour-pattern-modern" width="120" height="120" patternUnits="userSpaceOnUse">
              <path
                d="M0,60 Q30,20 60,60 T120,60 M0,30 Q30,5 60,30 T120,30 M0,90 Q30,45 60,90 T120,90"
                fill="none"
                stroke="rgba(22, 163, 74, 0.22)"
                strokeWidth="1.2"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern-modern)" />
          <rect width="100%" height="100%" fill="url(#contour-pattern-modern)" />

          {/* Type-Specific Vector Visualizations */}
          {type === 'contract' && (
            <g>
              <polygon
                points="80,40 220,30 310,90 260,190 140,210 60,130"
                fill="rgba(22, 163, 74, 0.2)"
                stroke="#16a34a"
                strokeWidth="2"
                strokeDasharray="6,3"
              />
              <polygon
                points="95,55 190,48 180,110 110,120"
                fill="rgba(22, 163, 74, 0.45)"
                stroke="#15803d"
                strokeWidth="1.5"
              />
              <polygon
                points="190,48 275,85 240,150 180,110"
                fill="rgba(245, 158, 11, 0.45)"
                stroke="#b45309"
                strokeWidth="1.5"
              />
              <polygon
                points="110,120 180,110 240,150 210,190 135,195"
                fill="rgba(59, 130, 246, 0.35)"
                stroke="#1d4ed8"
                strokeWidth="1.5"
              />
              <path
                d="M20,180 Q100,160 140,115 T290,60"
                fill="none"
                stroke="#ca8a04"
                strokeWidth="2.5"
                strokeDasharray="4,2"
              />
            </g>
          )}

          {type === 'license' && (
            <g>
              <polygon
                points="70,50 250,40 320,120 270,190 90,170"
                fill="rgba(22, 163, 74, 0.25)"
                stroke="#16a34a"
                strokeWidth="2.5"
              />
              <polygon
                points="100,70 210,65 240,140 120,150"
                fill="rgba(16, 185, 129, 0.5)"
                stroke="#047857"
                strokeWidth="1.5"
              />
            </g>
          )}

          {type === 'delivery' && (
            <g>
              <path
                d="M90,70 Q160,50 200,110 T330,170"
                fill="none"
                stroke="#0284c7"
                strokeWidth="3.5"
                strokeDasharray="6,4"
              />
              <circle cx="90" cy="70" r="8" fill="#16a34a" stroke="#ffffff" strokeWidth="2" />
              <circle cx="330" cy="170" r="9" fill="#e11d48" stroke="#ffffff" strokeWidth="2" />
            </g>
          )}

          {type === 'worklog' && (
            <g>
              <polygon
                points="110,60 260,50 290,150 170,180 80,130"
                fill="rgba(22, 163, 74, 0.35)"
                stroke="#16a34a"
                strokeWidth="2"
              />
              <line x1="120" y1="80" x2="250" y2="150" stroke="#f97316" strokeWidth="3" strokeDasharray="5,3" />
              <circle cx="180" cy="115" r="7" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
            </g>
          )}

          {type === 'contractor' && (
            <g>
              <circle cx="140" cy="60" r="16" fill="rgba(22, 163, 74, 0.35)" stroke="#16a34a" strokeWidth="1.5" />
              <circle cx="200" cy="85" r="20" fill="rgba(22, 163, 74, 0.35)" stroke="#16a34a" strokeWidth="1.5" />
              <circle cx="160" cy="150" r="18" fill="rgba(22, 163, 74, 0.35)" stroke="#16a34a" strokeWidth="1.5" />
            </g>
          )}
        </svg>

        {/* Map Controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
          {/* Basemap gallery (כמו ווידג'ט Basemap gallery ב-ExB) */}
          <div className="relative">
            <button type="button" onClick={() => setGalleryOpen((v) => !v)} className={`p-1.5 bg-white/95 rounded-xl shadow-xs border border-slate-200 cursor-pointer ${galleryOpen ? 'text-emerald-700' : 'text-slate-700 hover:bg-slate-50'}`} title="גלריית מפות רקע"><Layers className="w-3.5 h-3.5" /></button>
            {galleryOpen && (
              <div className="absolute right-9 top-0 w-[200px] bg-white border border-slate-200 rounded-xl shadow-lg p-2 grid grid-cols-2 gap-2 z-20">
                {([['forest', 'יער', '#e5f0e2'], ['topo', 'תבליט', '#eef2eb'], ['satellite', 'תצלום אוויר', '#2f3d30'], ['gray', 'אפור בהיר', '#f1f3f5']] as const).map(([id, label, c]) => (
                  <button key={id} type="button" onClick={() => { setBasemap(id); setGalleryOpen(false); }} className="text-center cursor-pointer">
                    <div className={`h-12 rounded-lg border-2 ${basemap === id ? 'border-[#16a34a]' : 'border-slate-200'}`} style={{ background: c }} />
                    <div className="text-[10.5px] text-slate-600 mt-0.5">{label}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white/95 rounded-xl shadow-xs border border-slate-200 flex flex-col divide-y divide-slate-100">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 1.8))}
              className="p-1.5 text-slate-700 hover:bg-slate-50 cursor-pointer"
              title="הגדל"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
              className="p-1.5 text-slate-700 hover:bg-slate-50 cursor-pointer"
              title="הקטן"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Compass */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-xl text-[10px] tabular-nums text-slate-600 shadow-2xs border border-slate-200/80 flex items-center gap-1.5 z-10">
          <Compass className="w-3.5 h-3.5 text-slate-700" />
          <span>צפון (N)</span>
        </div>

        {/* Center Dynamic Label & Details */}
        <div className="absolute inset-0 p-4 flex flex-col justify-end pointer-events-none z-10">
          <div className="bg-white/95 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-200/80 shadow-sm max-w-sm pointer-events-auto">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#16a34a] shrink-0" />
              <div className="font-bold text-xs text-slate-900 font-['Rubik',sans-serif]">
                {locationName}
              </div>
            </div>

            {type === 'contract' && (
              <div className="mt-1.5 text-[11px] text-slate-600 flex flex-wrap gap-x-3 gap-y-0.5">
                <span>קואורדינטות: {coordinates.lat.toFixed(3)}N, {coordinates.lng.toFixed(3)}E</span>
                <span>עומדים פעילים: {stands.length > 0 ? stands.length : '3'}</span>
              </div>
            )}

            {type === 'license' && (
              <div className="mt-1.5 text-[11px] text-slate-600 flex flex-wrap gap-x-3">
                <span>שכבת גבולות כריתה מאושרת</span>
                <span className="text-emerald-700 font-medium">שטח מוגדר: 145 דונם</span>
              </div>
            )}

            {type === 'delivery' && routeInfo && (
              <div className="mt-1.5 text-[11px] text-slate-600 flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
                  <span>מוצא: {routeInfo.from}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#e11d48]" />
                  <span>יעד שקילה ופריקה: {routeInfo.to}</span>
                </div>
              </div>
            )}

            {type === 'worklog' && (
              <div className="mt-1.5 text-[11px] text-slate-600 flex items-center justify-between">
                <span>אזור ביצוע: קו חיץ אש</span>
                <span className="text-amber-800 font-medium">צוות שטח פעיל</span>
              </div>
            )}

            {type === 'contractor' && (
              <div className="mt-1.5 text-[11px] text-slate-600">
                <span>פריסת אתרי עבודה: גליל תחתון, יזרעאל וכרמל</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
