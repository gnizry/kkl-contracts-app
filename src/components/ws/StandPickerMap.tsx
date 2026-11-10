import React, { useMemo, useRef, useState } from 'react';
import { Layers, MousePointer2, SquareDashed, Eraser } from 'lucide-react';
import { Stand } from '../../types/forestry';

export type StandKind = 'free' | 'mano' | 'foreign';
interface Props {
  stands: Stand[];
  kindOf: (s: Stand) => { kind: StandKind; color?: string; label?: string };
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  height?: number;
}

const W = 600, H = 300, COLS = 5, ROWS = 4;
const BASEMAPS = [['forest', 'יער', '#eef5ea'], ['topo', 'תבליט', '#f1efe6'], ['sat', 'תצלום אוויר', '#3a4a3b'], ['gray', 'אפור בהיר', '#f1f3f5']] as const;

/** מפת בחירת עומדים (מדמה את אינטראקציית המפה של Analysis widget: בחירה בלחיצה או במלבן) */
export const StandPickerMap: React.FC<Props> = ({ stands, kindOf, selected, onChange, height = 300 }) => {
  const [tool, setTool] = useState<'point' | 'box'>('point');
  const [bm, setBm] = useState<(typeof BASEMAPS)[number][0]>('forest');
  const [gal, setGal] = useState(false);
  const [drag, setDrag] = useState<null | { x0: number; y0: number; x1: number; y1: number }>(null);
  const svg = useRef<SVGSVGElement>(null);

  const polys = useMemo(() => {
    let h = 11;
    for (const s of stands) for (const ch of s.Stand_ID) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
    const rnd = () => { h = (Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) + 0x297a2d39) >>> 0; return (h >>> 8) / 16777216 - 0.5; };
    const cw = W / COLS, ch = H / ROWS;
    const V: [number, number][][] = [];
    for (let j = 0; j <= ROWS; j++) { V.push([]); for (let i = 0; i <= COLS; i++) V[j].push([i * cw + (i && i < COLS ? rnd() * cw * 0.45 : 0), j * ch + (j && j < ROWS ? rnd() * ch * 0.45 : 0)]); }
    return stands.map((s, k) => {
      const i = k % COLS, j = Math.floor(k / COLS);
      const pts = [V[j][i], V[j][i + 1], V[j + 1][i + 1], V[j + 1][i]];
      const cx = pts.reduce((a, p) => a + p[0], 0) / 4, cy = pts.reduce((a, p) => a + p[1], 0) / 4;
      return { s, pts, cx, cy, d: pts.map((p) => p.join(',')).join(' ') };
    });
  }, [stands]);

  const toSvg = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const free = (s: Stand) => kindOf(s).kind === 'free';
  const toggle = (id: string) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); onChange(n); };

  const down = (e: React.PointerEvent) => { if (tool !== 'box') return; const p = toSvg(e); (e.target as Element).setPointerCapture?.(e.pointerId); setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y }); };
  const move = (e: React.PointerEvent) => { if (!drag) return; const p = toSvg(e); setDrag({ ...drag, x1: p.x, y1: p.y }); };
  const up = () => {
    if (!drag) return;
    const [xa, xb] = [Math.min(drag.x0, drag.x1), Math.max(drag.x0, drag.x1)], [ya, yb] = [Math.min(drag.y0, drag.y1), Math.max(drag.y0, drag.y1)];
    const hit = polys.filter((p) => free(p.s) && p.cx >= xa && p.cx <= xb && p.cy >= ya && p.cy <= yb).map((p) => p.s.Stand_ID);
    if (hit.length) onChange(new Set([...selected, ...hit]));
    setDrag(null);
  };

  const bg = BASEMAPS.find((b) => b[0] === bm)![2];
  const dark = bm === 'sat';
  const btn = (active: boolean) => `p-1.5 bg-white/95 rounded-lg border shadow-xs cursor-pointer ${active ? 'border-[#16a34a] text-emerald-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`;

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-200 select-none" style={{ height }} dir="ltr">
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full touch-none" style={{ background: bg, cursor: tool === 'box' ? 'crosshair' : 'default' }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up}>
        <defs><pattern id="spm-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="1.5" /></pattern></defs>
        {polys.map(({ s, d, cx, cy }) => {
          const k = kindOf(s); const sel = selected.has(s.Stand_ID);
          const fill = sel ? 'rgba(14,165,233,0.45)' : k.kind === 'mano' ? (k.color || '#16a34a') + '66' : k.kind === 'foreign' ? 'url(#spm-hatch)' : dark ? 'rgba(255,255,255,0.12)' : 'rgba(22,163,74,0.14)';
          const stroke = sel ? '#0284c7' : k.kind === 'mano' ? k.color || '#16a34a' : k.kind === 'foreign' ? '#94a3b8' : dark ? '#d1fae5' : '#15803d';
          return (
            <g key={s.Stand_ID} onClick={() => tool === 'point' && free(s) && toggle(s.Stand_ID)} style={{ cursor: tool === 'point' && free(s) ? 'pointer' : 'inherit' }}>
              <polygon points={d} fill={fill} stroke={stroke} strokeWidth={sel ? 2.5 : 1.4} strokeLinejoin="round" />
              <text x={cx} y={cy - 2} textAnchor="middle" fontSize="11" fontWeight="600" fill={dark ? '#fff' : '#1e293b'} style={{ pointerEvents: 'none', fontFamily: 'Rubik, sans-serif' }}>{s.Stand_ID.split('/')[1]}</text>
              <text x={cx} y={cy + 11} textAnchor="middle" fontSize="9" fill={dark ? '#e2e8f0' : '#64748b'} style={{ pointerEvents: 'none', fontFamily: 'Rubik, sans-serif' }}>{k.kind === 'mano' ? k.label : k.kind === 'foreign' ? 'התקשרות אחרת' : `${s.AreaDunam} ד׳`}</text>
              <title>{`עומד ${s.Stand_ID} · ${s.DominantSpecies} · ${s.AreaDunam} דונם`}</title>
            </g>
          );
        })}
        {drag && <rect x={Math.min(drag.x0, drag.x1)} y={Math.min(drag.y0, drag.y1)} width={Math.abs(drag.x1 - drag.x0)} height={Math.abs(drag.y1 - drag.y0)} fill="rgba(14,165,233,0.12)" stroke="#0284c7" strokeDasharray="5 3" />}
      </svg>
      {/* כלי בחירה (Select tools) */}
      <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
        <button type="button" className={btn(tool === 'point')} onClick={() => setTool('point')} title="בחירה בלחיצה"><MousePointer2 className="w-4 h-4" /></button>
        <button type="button" className={btn(tool === 'box')} onClick={() => setTool('box')} title="בחירה במלבן"><SquareDashed className="w-4 h-4" /></button>
        <button type="button" className={btn(false)} onClick={() => onChange(new Set())} title="נקה בחירה"><Eraser className="w-4 h-4" /></button>
      </div>
      {/* גלריית מפות רקע */}
      <div className="absolute top-2 right-2 z-10">
        <button type="button" className={btn(gal)} onClick={() => setGal(!gal)} title="גלריית מפות רקע"><Layers className="w-4 h-4" /></button>
        {gal && (
          <div className="absolute right-9 top-0 w-[190px] bg-white border border-slate-200 rounded-xl shadow-lg p-2 grid grid-cols-2 gap-2" dir="rtl">
            {BASEMAPS.map(([id, label, c]) => (
              <button key={id} type="button" onClick={() => { setBm(id); setGal(false); }} className="text-center cursor-pointer">
                <div className={`h-10 rounded-lg border-2 ${bm === id ? 'border-[#16a34a]' : 'border-slate-200'}`} style={{ background: c }} />
                <div className="text-[10.5px] text-slate-600 mt-0.5">{label}</div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="absolute bottom-2 right-2 flex gap-3 text-[10.5px] bg-white/90 rounded-md px-2 py-1 text-slate-600" dir="rtl">
        <span><i className="inline-block w-2.5 h-2.5 rounded-sm align-middle ml-1" style={{ background: '#0ea5e9' }} />נבחר</span>
        <span><i className="inline-block w-2.5 h-2.5 rounded-sm align-middle ml-1" style={{ background: '#86efac' }} />פנוי</span>
        <span><i className="inline-block w-2.5 h-2.5 rounded-sm align-middle ml-1" style={{ background: '#cbd5e1' }} />משויך</span>
      </div>
    </div>
  );
};
