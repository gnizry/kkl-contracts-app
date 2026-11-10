import { KpiRow } from './ListKit';
import React, { useState } from 'react';
import {
  Building2,
  Phone,
  Mail,
  Truck,
  Trees,
  Search,
  Star,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { ContractorInfo, Contract } from '../types/forestry';
import { MOCK_CONTRACTORS } from '../data/mockKklData';

interface ContractorsViewProps {
  contracts: Contract[];
  onSelectContractor: (contractor: ContractorInfo) => void;
}

export const ContractorsView: React.FC<ContractorsViewProps> = ({
  contracts,
  onSelectContractor,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = MOCK_CONTRACTORS.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.Name.toLowerCase().includes(term) ||
      c.RegNumber.toLowerCase().includes(term) ||
      c.FleetSummary.toLowerCase().includes(term) ||
      c.Email.toLowerCase().includes(term)
    );
  });

  const nf = (n: number) => Math.round(n).toLocaleString('he-IL');
  const names = new Set(filtered.map((c) => c.Name));
  const mine = contracts.filter((c) => names.has(c.Contractor));
  const kExec = new Set(mine.filter((c) => c.Status === 'בביצוע').map((c) => c.Contractor)).size;
  const kDelivered = mine.reduce((a, c) => a + c.TotalDeliveredMQ, 0);
  const rated = filtered.filter((c) => c.Rating > 0);
  const kRating = rated.length ? (rated.reduce((a, c) => a + c.Rating, 0) / rated.length).toFixed(1) : '—';

  return (
    <div className="flex flex-col gap-5 text-right font-['Rubik','Assistant',sans-serif]">
      <KpiRow items={[
        { label: 'קבלנים מורשים', value: nf(filtered.length) },
        { label: 'קבלנים עם התקשרות בביצוע', value: nf(kExec) },
        { label: 'התקשרויות', value: nf(mine.length) },
        { label: 'נפח שפונה', value: nf(kDelivered), sub: 'מ"ק', tone: '#047857' },
        { label: 'דירוג ממוצע', value: kRating },
      ]} />

      {/* 1. Unified Modern Search & Filter Strip */}
      <div className="bg-white rounded-3xl p-3 md:p-4 border border-slate-200/70 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש קבלן לפי שם, מספר ח.פ, צי כלים, כתובת מייל..."
              className="w-full text-xs md:text-sm pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16a34a] text-slate-800 placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="text-xs text-slate-400 tabular-nums">
          נמצאו: <strong className="text-slate-700">{filtered.length}</strong> קבלנים מורשים
        </div>
      </div>

      {/* 2. Soft Modern Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((contr) => {
          const contractorContracts = contracts.filter((c) => c.Contractor === contr.Name);
          const totalDelivered = contractorContracts.reduce((acc, c) => acc + c.TotalDeliveredMQ, 0);

          return (
            <div
              key={contr.Contractor_ID}
              onClick={() => onSelectContractor(contr)}
              className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] hover:border-[#16a34a] transition-all cursor-pointer flex flex-col justify-between gap-5 group"
            >
              <div>
                {/* Header Strip */}
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#16a34a] transition-colors">
                        {contr.Name}
                      </h3>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-xs text-slate-400 tabular-nums font-medium mt-0.5 block">
                      ח.פ / רישום: {contr.RegNumber}
                    </span>
                  </div>

                  {/* Rating Badge */}
                  {contr.Rating > 0 && (
                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl text-xs font-bold text-amber-800">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{contr.Rating}</span>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-4 text-xs text-slate-600">
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="tabular-nums text-slate-800 font-medium">{contr.Phone}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="tabular-nums text-slate-800 truncate">{contr.Email}</span>
                  </div>
                </div>

                {/* Equipment Fleet */}
                <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block mb-1">צי כלים ורכבים:</span>
                  <p className="text-slate-600 leading-relaxed">{contr.FleetSummary}</p>
                </div>
              </div>

              {/* Bottom Volume & CTA */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-5 text-xs tabular-nums tabular-nums text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">התקשרויות באחריות</span>
                    <strong className="text-slate-900 text-sm">{contr.ActiveContractsCount}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">פונה במצטבר</span>
                    <strong className="text-[#065f46] text-sm font-bold">
                      {totalDelivered.toLocaleString('he-IL')} מ״ק
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#16a34a] font-bold group-hover:translate-x-[-3px] transition-transform">
                  <span>כרטיס מלא ומפה</span>
                  <ChevronLeft className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
