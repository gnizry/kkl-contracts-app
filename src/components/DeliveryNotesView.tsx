import React, { useState } from 'react';
import {
  Truck,
  Search,
  Scale,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MapPin,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { Contract, DeliveryNote } from '../types/forestry';
import { FilterSelect, SearchBox, ViewSwitcher, ExportButton, Toolbar, Pager, MapCard, CARD, KpiRow } from './ListKit';
import { IsraelMap } from './IsraelMap';
import { SmartNationalMap } from './SmartMap';

interface DeliveryNotesViewProps {
  contracts: Contract[];
  onSelectDeliveryNote: (note: DeliveryNote, contract: Contract) => void;
}

export const DeliveryNotesView: React.FC<DeliveryNotesViewProps> = ({
  contracts,
  onSelectDeliveryNote,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [woodFilter, setWoodFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Collect all delivery notes
  const allNotes: { note: DeliveryNote; contract: Contract }[] = [];
  contracts.forEach((c) => {
    c.DeliveryNotes.forEach((dn) => {
      allNotes.push({ note: dn, contract: c });
    });
  });

  // Sort newest first
  allNotes.sort(
    (a, b) => new Date(b.note.Date).getTime() - new Date(a.note.Date).getTime()
  );

  const woodTypes = Array.from(new Set(allNotes.map((n) => n.note.WoodType)));

  const regions = Array.from(new Set(contracts.map((c) => c.Region)));

  const filtered = allNotes.filter(({ note, contract }) => {
    if (woodFilter && note.WoodType !== woodFilter) return false;
    if (regionFilter && contract.Region !== regionFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      note.Delivery_ID.toLowerCase().includes(term) ||
      note.DriverName.toLowerCase().includes(term) ||
      note.TruckPlate.toLowerCase().includes(term) ||
      note.WoodType.toLowerCase().includes(term) ||
      note.DestinationYard.toLowerCase().includes(term) ||
      note.Removing_License_ID.toLowerCase().includes(term) ||
      contract.Contract_Name.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const totalDelivered = allNotes.reduce((acc, item) => acc + item.note.QuantityMQ, 0);

  const nf = (n: number) => Math.round(n).toLocaleString('he-IL');
  const kVol = filtered.reduce((a, f) => a + f.note.QuantityMQ, 0);
  const kDest = new Set(filtered.map((f) => f.note.DestinationYard)).size;
  const kContracts = new Set(filtered.map((f) => f.contract.Contract_ID)).size;

  return (
    <div className="flex flex-col gap-5 text-right font-['Rubik','Assistant',sans-serif]">
      <KpiRow items={[
        { label: 'תעודות משלוח', value: nf(filtered.length) },
        { label: 'נפח שפונה', value: nf(kVol), sub: 'מ"ק', tone: '#047857' },
        { label: 'ממוצע לתעודה', value: filtered.length ? (kVol / filtered.length).toFixed(1) : '0', sub: 'מ"ק' },
        { label: 'יעדי פינוי', value: nf(kDest) },
        { label: 'התקשרויות עם פינוי', value: nf(kContracts) },
      ]} />

      <Toolbar
        left={
          <>
            <FilterSelect value={woodFilter} onChange={(v) => { setWoodFilter(v); setCurrentPage(1); }} allLabel="כל סוגי העץ" options={woodTypes} />
            <FilterSelect value={regionFilter} onChange={(v) => { setRegionFilter(v); setCurrentPage(1); }} allLabel="כל המרחבים" options={regions} />
            <SearchBox value={searchTerm} onChange={(v) => { setSearchTerm(v); setCurrentPage(1); }} placeholder="חיפוש לפי מספר תעודה, נהג, משאית, יעד..." />
          </>
        }
        right={
          <>
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 px-2">
              סה״כ פונה: <strong className="tabular-nums text-slate-800">{totalDelivered.toFixed(1)} מ״ק</strong>
            </div>
            <ViewSwitcher mode={viewMode} onChange={setViewMode} />
            <ExportButton title="ייצוא תעודות משלוח" />
          </>
        }
      />

      {viewMode === 'map' ? (
        <MapCard>
          <SmartNationalMap><IsraelMap contracts={Array.from(new Set(filtered.map((f) => f.contract)))} onSelectContract={(c) => { setSearchTerm(c.Contract_Name); setViewMode('table'); setCurrentPage(1); }} /></SmartNationalMap>
        </MapCard>
      ) : (
      <div className={`${CARD} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-medium text-xs select-none">
                <th className="py-4 px-6 text-right">מס׳ תעודת משלוח</th>
                <th className="py-4 px-4 text-right">סוג עץ / חומר</th>
                <th className="py-4 px-4 text-right">נהג ומשאית</th>
                <th className="py-4 px-4 text-right">יעד פריקה</th>
                <th className="py-4 px-4 text-right">תאריך משלוח</th>
                <th className="py-4 px-4 text-left">כמות משלוח</th>
                <th className="py-4 px-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                    לא נמצאו תעודות משלוח התואמות את החיפוש.
                  </td>
                </tr>
              ) : (
                paginated.map(({ note, contract }) => (
                  <tr
                    key={note.Delivery_ID}
                    onClick={() => onSelectDeliveryNote(note, contract)}
                    className="hover:bg-slate-50/70 cursor-pointer transition-colors group"
                  >
                    {/* Delivery ID */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors ml-1" />
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-[#16a34a] transition-colors tabular-nums">
                            {note.Delivery_ID}
                          </div>
                          <div className="text-xs text-slate-400 tabular-nums mt-0.5">
                            {note.Removing_License_ID}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Wood Type */}
                    <td className="py-4 px-4 text-slate-700">
                      <div className="font-medium text-slate-900">{note.WoodType}</div>
                      <div className="text-xs text-slate-400 truncate max-w-xs">{contract.Contract_Name}</div>
                    </td>

                    {/* Driver & Plate */}
                    <td className="py-4 px-4 text-slate-700">
                      <div className="font-medium">{note.DriverName}</div>
                      <div className="text-xs text-slate-400 tabular-nums">משאית: {note.TruckPlate}</div>
                    </td>

                    {/* Destination Yard */}
                    <td className="py-4 px-4 text-slate-700">
                      <div className="font-medium">{note.DestinationYard}</div>
                      <div className="text-xs text-slate-400">{contract.District}</div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 text-slate-600 tabular-nums text-xs">
                      {note.Date}
                    </td>

                    {/* Quantity MQ */}
                    <td className="py-4 px-4 text-left tabular-nums">
                      <span className="text-base font-bold text-slate-900 tabular-nums">
                        {note.QuantityMQ}{' '}
                        <span className="text-xs font-normal text-slate-400 font-sans">מ״ק</span>
                      </span>
                    </td>

                    {/* Action Menu */}
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDeliveryNote(note, contract);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pager total={filtered.length} page={currentPage} totalPages={totalPages} onPage={setCurrentPage} />
      </div>
      )}
    </div>
  );
};
