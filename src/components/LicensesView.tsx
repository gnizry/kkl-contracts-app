import React, { useState } from 'react';
import {
  FileText,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Building2,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { Contract, RemovingLicense, FellingLicense } from '../types/forestry';
import { isLowBalance } from '../utils/licenses';
import { FilterSelect, SearchBox, ViewSwitcher, ExportButton, Toolbar, Pager, MapCard, CARD, KpiRow } from './ListKit';
import { IsraelMap } from './IsraelMap';
import { SmartNationalMap } from './SmartMap';

interface LicensesViewProps {
  contracts: Contract[];
  onSelectLicense: (license: RemovingLicense, contract: Contract, felling?: FellingLicense) => void;
}

export const LicensesView: React.FC<LicensesViewProps> = ({
  contracts,
  onSelectLicense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Flatten all removing licenses
  const allRemoving: {
    license: RemovingLicense;
    contract: Contract;
    felling?: FellingLicense;
  }[] = [];

  contracts.forEach((c) => {
    c.Felling_Licenses.forEach((fl) => {
      fl.Removing_Licenses.forEach((rl) => {
        allRemoving.push({ license: rl, contract: c, felling: fl });
      });
    });
  });

  const regions = Array.from(new Set(contracts.map((c) => c.Region)));

  const filtered = allRemoving.filter(({ license, contract }) => {
    if (regionFilter && contract.Region !== regionFilter) {
      return false;
    }
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      license.License_Number.toLowerCase().includes(term) ||
      license.Removing_License_ID.toLowerCase().includes(term) ||
      license.Original_License_Id.toLowerCase().includes(term) ||
      contract.Contract_Name.toLowerCase().includes(term) ||
      contract.Contractor.toLowerCase().includes(term) ||
      license.Destination.toLowerCase().includes(term)
    );
  });

  const kApproved = filtered.reduce((a, f) => a + f.license.ApprovedMQ, 0);
  const kDelivered = filtered.reduce((a, f) => a + f.license.DeliveredMQ, 0);
  const kValid = filtered.filter((f) => !f.license.Status.startsWith('לא בתוקף')).length;
  const kLow = filtered.filter((f) => isLowBalance(f.license)).length;
  const nf = (n: number) => Math.round(n).toLocaleString('he-IL');

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="flex flex-col gap-5 text-right font-['Rubik','Assistant',sans-serif]">
      <KpiRow items={[
        { label: 'רישיונות נטילה', value: nf(filtered.length), sub: `${nf(kValid)} בתוקף` },
        { label: 'נפח מאושר', value: nf(kApproved), sub: 'מ"ק' },
        { label: 'נפח שפונה', value: nf(kDelivered), sub: `${kApproved ? Math.round((kDelivered / kApproved) * 100) : 0}% מהמאושר`, tone: '#047857' },
        { label: 'יתרה', value: nf(kApproved - kDelivered), sub: 'מ"ק' },
        { label: 'יתרה נמוכה (<40 מ"ק)', value: nf(kLow), sub: 'דורש תשומת לב', tone: kLow ? '#be123c' : undefined },
      ]} />

      <Toolbar
        left={
          <>
            <FilterSelect value={regionFilter} onChange={(v) => { setRegionFilter(v); setCurrentPage(1); }} allLabel="כל המרחבים" options={regions} />
            <SearchBox value={searchTerm} onChange={(v) => { setSearchTerm(v); setCurrentPage(1); }} placeholder="חיפוש לפי מספר רישיון, יעד פינוי, קבלן..." />
          </>
        }
        right={
          <>
            <ViewSwitcher mode={viewMode} onChange={setViewMode} />
            <ExportButton title="ייצוא רישיונות" />
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
                <th className="py-4 px-6 text-right">מס׳ רישיון נטילה</th>
                <th className="py-4 px-4 text-right">רישיון כריתה אב / התקשרות</th>
                <th className="py-4 px-4 text-right">יעד פינוי מורשה</th>
                <th className="py-4 px-4 text-center">סטטוס יתרה</th>
                <th className="py-4 px-4 text-right">נפח פונה / מאושר</th>
                <th className="py-4 px-4 text-left">יתרה</th>
                <th className="py-4 px-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                    לא נמצאו רישיונות התואמים את החיפוש או הסינון.
                  </td>
                </tr>
              ) : (
                paginated.map(({ license, contract, felling }) => {
                  const isLow = isLowBalance(license);

                  return (
                    <tr
                      key={license.Removing_License_ID}
                      onClick={() => onSelectLicense(license, contract, felling)}
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors group"
                    >
                      {/* License ID & Number */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors ml-1" />
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-[#16a34a] transition-colors">
                              {license.License_Number}
                            </div>
                            <div className="text-xs text-slate-400 tabular-nums mt-0.5">
                              {license.Removing_License_ID}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Parent Felling License & Contract */}
                      <td className="py-4 px-4 text-slate-700">
                        <div className="font-medium text-slate-800 tabular-nums text-xs">
                          {license.Original_License_Id}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{contract.Contract_Name}</div>
                      </td>

                      {/* Destination */}
                      <td className="py-4 px-4 text-slate-700">
                        <div className="font-medium">{license.Destination}</div>
                        <div className="text-xs text-slate-400 tabular-nums">תוקף: {license.ExpiryDate}</div>
                      </td>

                      {/* Status / Alert Badge */}
                      <td className="py-4 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-lg bg-rose-50 text-[#e11d48] border border-rose-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-[#e11d48]" />
                            <span>יתרה נמוכה</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-lg bg-[#ecfdf5] text-[#059669]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>תקין</span>
                          </span>
                        )}
                      </td>

                      {/* Approved vs Delivered */}
                      <td className="py-4 px-4 text-slate-600 tabular-nums text-xs">
                        <div>{license.DeliveredMQ} מ״ק פונו</div>
                        <div className="text-slate-400">מתוך {license.ApprovedMQ} מ״ק</div>
                      </td>

                      {/* Balance MQ */}
                      <td className="py-4 px-4 text-left tabular-nums">
                        <span
                          className={`text-base font-bold tabular-nums ${
                            isLow ? 'text-[#e11d48]' : 'text-slate-900'
                          }`}
                        >
                          {license.BalanceMQ} <span className="text-xs font-normal text-slate-400 font-sans">מ״ק</span>
                        </span>
                      </td>

                      {/* Action Menu */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLicense(license, contract, felling);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
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
