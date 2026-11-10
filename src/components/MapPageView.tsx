import React, { useMemo, useState } from 'react';
import { Crosshair } from 'lucide-react';
import { Contract } from '../types/forestry';
import { MapPanel } from './MapPanel';
import { CARD, FilterSelect, SearchBox } from './ListKit';
import { statusColor } from './IsraelMap';
import { useConnection } from '../connection';
import { LiveMapPanel } from './LiveMapPanel';

interface Props {
  contracts: Contract[];
  onSelectContract: (c: Contract) => void;
  initialFocus?: { id: string; nonce: number } | null;
}

export const MapPageView: React.FC<Props> = (props) => {
  const { status } = useConnection();
  if (status === 'connected') return <div className={`${CARD} p-5`}><LiveMapPanel height={700} withList /></div>;
  return <MockMapPage {...props} />;
};

const MockMapPage: React.FC<Props> = ({ contracts, onSelectContract, initialFocus }) => {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('בביצוע');
  const [focus, setFocus] = useState<{ id: string; nonce: number } | null>(initialFocus || null);

  const list = useMemo(
    () =>
      contracts
        .filter((c) => c.Coordinates && (!status || c.Status === status))
        .filter((c) => !q || (c.Contract_Name + c.Contract_Number + c.Block + c.Region + c.Contractor).includes(q)),
    [contracts, status, q]
  );
  const statuses = Array.from(new Set(contracts.map((c) => c.Status)));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-5 text-right items-start">
      <div className={`${CARD} p-4 flex flex-col gap-3`}>
        <h3 className="text-base font-bold text-slate-900">התקשרויות במפה</h3>
        <FilterSelect value={status} onChange={setStatus} allLabel="כל הסטטוסים" options={statuses} />
        <div className="flex"><SearchBox value={q} onChange={setQ} placeholder="חיפוש התקשרות, יער, קבלן…" /></div>
        <div className="text-[11px] text-slate-400">{list.length} התקשרויות · לחיצה = התמקדות במפה</div>
        <div className="flex flex-col divide-y divide-slate-100 max-h-[620px] overflow-y-auto -mx-1">
          {list.map((c) => (
            <button
              key={c.Contract_ID}
              onClick={() => setFocus({ id: c.Contract_ID, nonce: Date.now() })}
              className={`text-right px-2 py-2.5 hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer ${focus?.id === c.Contract_ID ? 'bg-emerald-50/60' : ''}`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: statusColor(c.Status) }} />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-slate-800 truncate">{c.Contract_Name}</span>
                <span className="block text-[11px] text-slate-400 truncate">{c.Contract_Number} · {c.Region}</span>
              </span>
              <Crosshair className="w-4 h-4 text-slate-300 shrink-0" />
            </button>
          ))}
          {list.length === 0 && <div className="py-8 text-center text-sm text-slate-400">אין התקשרויות</div>}
        </div>
      </div>
      <div className={`${CARD} p-5`}>
        <MapPanel contracts={contracts} onOpenContract={onSelectContract} height={700} focusRequest={focus} defaultStatuses={['בביצוע']} />
      </div>
    </div>
  );
};
