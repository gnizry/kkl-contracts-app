import React, { useState } from 'react';
import { Layers, MapPin, ZoomIn, ZoomOut, Check, Info } from 'lucide-react';
import { Contract } from '../types/forestry';
import { isLowBalance } from '../utils/licenses';

interface GisMapPreviewProps {
  contracts: Contract[];
  selectedContract: Contract | null;
  onSelectContract: (contract: Contract) => void;
}

export const GisMapPreview: React.FC<GisMapPreviewProps> = ({
  contracts,
  selectedContract,
  onSelectContract,
}) => {
  const [activeLayer, setActiveLayer] = useState<'all' | 'stands' | 'licenses'>('all');
  const [hoveredContract, setHoveredContract] = useState<Contract | null>(null);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col text-right">
      {/* Map Widget Header */}
      <div className="p-3.5 bg-white border-b border-slate-100 text-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs md:text-sm font-bold font-['Rubik',sans-serif]">
            תצוגת מפה יערנית (ArcGIS WebMap Widget)
          </h3>
          <span className="text-[10px] tabular-nums bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
            KKL GIS Layer
          </span>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-slate-400 hidden sm:inline">שכבות:</span>
          {(
            [
              { id: 'all', label: 'הכל' },
              { id: 'stands', label: 'עומדים' },
              { id: 'licenses', label: 'רישיונות' },
            ] as const
          ).map((l) => (
            <button
              key={l.id}
              onClick={() => setActiveLayer(l.id)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                activeLayer === l.id
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Canvas / Simulated GIS Viewport */}
      <div className="relative h-72 sm:h-80 md:h-96 bg-[#d9e6d5] overflow-hidden select-none border-b border-slate-200">
        {/* Stylized GIS Topographic background lines & forest polygons */}
        <svg
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="contour" width="80" height="80" patternUnits="userSpaceOnUse">
              <path
                d="M0,40 Q20,10 40,40 T80,40 M0,20 Q20,0 40,20 T80,20 M0,60 Q20,30 40,60 T80,60"
                fill="none"
                stroke="#c1d6ba"
                strokeWidth="1.2"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#contour)" />

          {/* Simulated Mediterranean Shoreline */}
          <path
            d="M 60,0 Q 80,100 65,200 T 50,400"
            fill="none"
            stroke="#90caf9"
            strokeWidth="38"
            strokeOpacity="0.4"
          />

          {/* Simulated Forest Polygons */}
          <polygon
            points="180,80 260,65 310,120 250,160 170,120"
            fill="#81c784"
            fillOpacity="0.45"
            stroke="#2e7d32"
            strokeWidth="1.5"
            strokeDasharray="4,2"
          />
          <polygon
            points="380,110 460,95 500,160 440,200 370,170"
            fill="#a5d6a7"
            fillOpacity="0.4"
            stroke="#388e3c"
            strokeWidth="1.5"
          />
          <polygon
            points="220,240 330,220 370,290 290,320 210,280"
            fill="#81c784"
            fillOpacity="0.45"
            stroke="#2e7d32"
            strokeWidth="1.5"
            strokeDasharray="4,2"
          />
        </svg>

        {/* GIS Controls simulation */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
          <div className="bg-white/95 rounded-md shadow-md border border-slate-300 flex flex-col divide-y divide-slate-200">
            <button className="p-1.5 text-slate-700 hover:bg-slate-100" title="הגדל מפה">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-slate-700 hover:bg-slate-100" title="הקטן מפה">
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Forest Contract Pins */}
        <div className="absolute inset-0 p-6 flex flex-wrap items-center justify-around z-10 pointer-events-none">
          {contracts.map((c, idx) => {
            const isSelected = selectedContract?.Contract_ID === c.Contract_ID;
            const hasLowBalance = c.Felling_Licenses.some((fl) =>
              fl.Removing_Licenses.some((rl) => isLowBalance(rl))
            );

            // Coordinates mapping into relative box
            const positions = [
              { top: '22%', right: '28%' }, // עמק יזרעאל
              { top: '12%', right: '48%' }, // ביריה
              { top: '48%', right: '35%' }, // בן שמן
              { top: '75%', right: '42%' }, // יתיר
              { top: '56%', right: '55%' }, // ירושלים
              { top: '26%', right: '18%' }, // כרמל
              { top: '8%', right: '38%' },  // ברעם
              { top: '82%', right: '32%' }, // להב
            ];

            const pos = positions[idx % positions.length];

            return (
              <div
                key={c.Contract_ID}
                style={{ top: pos.top, right: pos.right }}
                className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                onClick={() => onSelectContract(c)}
                onMouseEnter={() => setHoveredContract(c)}
                onMouseLeave={() => setHoveredContract(null)}
              >
                {/* Pin element */}
                <div
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-md ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-200 scale-110 z-20'
                      : hasLowBalance
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-[#1b3d2f] text-emerald-100 hover:bg-[#2e7d32]'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="tabular-nums text-[11px]">{c.Contract_Name.length > 22 ? c.Contract_Name.slice(0, 22) + '…' : c.Contract_Name}</span>
                  {hasLowBalance && <span className="text-[10px]">⚠️</span>}
                </div>

                {/* Hover Tooltip */}
                <div className="hidden group-hover:block absolute bottom-full mb-2 right-1/2 translate-x-1/2 w-56 bg-slate-900/95 text-white p-2.5 rounded-lg shadow-xl text-right z-30 pointer-events-none text-xs border border-slate-700">
                  <div className="font-bold text-emerald-300 truncate">{c.Contract_Name}</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">גוש: {c.Block}</div>
                  <div className="text-[11px] text-slate-300">קבלן: {c.Contractor}</div>
                  <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-700 text-[10px] tabular-nums">
                    <span>פונה: {c.TotalDeliveredMQ} מ״ק</span>
                    <span>ביצוע: {c.ExecutionPercent}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Map Legend */}
        <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs p-2.5 rounded-lg shadow-md border border-slate-300 text-[11px] text-slate-700 z-10 text-right">
          <div className="font-bold mb-1 text-slate-900 flex items-center gap-1">
            <Info className="w-3 h-3 text-[#2e7d32]" />
            <span>מקרא שכבות עומדים</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1b3d2f]" />
              <span>התקשרות פעילה</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
              <span>רישיון ביתרה נמוכה (&lt;40 מ״ק ⚠️)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>התקשרות נבחרת</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
