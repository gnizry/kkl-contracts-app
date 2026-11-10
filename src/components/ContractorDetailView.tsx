import React from 'react';
import {
  ArrowRight,
  Building2,
  Phone,
  Mail,
  Truck,
  Star,
  Trees,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import { ContractorInfo, Contract } from '../types/forestry';
import { SmartMiniMap } from './SmartMap';

interface ContractorDetailViewProps {
  contractor: ContractorInfo;
  contracts: Contract[];
  onBack: () => void;
  onSelectContract: (contract: Contract) => void;
}

export const ContractorDetailView: React.FC<ContractorDetailViewProps> = ({
  contractor,
  contracts,
  onBack,
  onSelectContract,
}) => {
  const assignedContracts = contracts.filter((c) => c.Contractor === contractor.Name);
  const totalVolume = assignedContracts.reduce((acc, c) => acc + c.TotalDeliveredMQ, 0);

  return (
    <div className="flex flex-col gap-6 text-right">
      {/* Back Button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl border border-slate-200/80 shadow-2xs transition-colors cursor-pointer text-sm"
        >
          <ArrowRight className="w-4 h-4 text-[#16a34a]" />
          <span>חזרה לרשימת הקבלנים</span>
        </button>
      </div>

      {/* Main Contractor Card */}
      <div className="bg-white border border-slate-200/70 rounded-3xl p-6 md:p-8 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-sm tabular-nums font-bold bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-xl">
                {contractor.RegNumber}
              </span>
              <span className="text-xs px-3.5 py-1 rounded-full bg-[#ecfdf5] text-[#059669] font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                <span>קבלן יערני מורשה קק״ל</span>
              </span>
              {contractor.Rating > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-xs font-bold text-amber-800">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>דירוג איכות: {contractor.Rating}</span>
                </div>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold font-['Rubik',sans-serif] text-slate-900 mt-3">
              {contractor.Name}
            </h1>

            <div className="flex flex-wrap items-center gap-6 mt-3 text-xs md:text-sm text-slate-600">
              <span className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#16a34a]" />
                טלפון ישיר: <strong className="tabular-nums">{contractor.Phone}</strong>
              </span>
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#16a34a]" />
                דוא״ל: <strong className="tabular-nums">{contractor.Email}</strong>
              </span>
            </div>
          </div>

          <div className="bg-[#ecfdf5] border border-emerald-100 rounded-3xl p-5 text-center min-w-[200px]">
            <span className="text-xs text-[#059669] font-bold block mb-1">נפח שפונה במצטבר</span>
            <div className="text-3xl font-bold tabular-nums text-[#065f46] tabular-nums">
              {totalVolume.toLocaleString('he-IL')} <span className="text-sm font-normal">מ״ק</span>
            </div>
            <span className="text-xs text-slate-500 block mt-1">
              ב-{assignedContracts.length} התקשרויות יערניות
            </span>
          </div>
        </div>

        {/* Machinery and Fleet Details */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <span className="text-xs font-bold text-slate-400 block mb-1">
            צי רכבים, ציוד מכני ואישורי בטיחות רשומים:
          </span>
          <p className="text-base text-slate-800 leading-relaxed font-medium">
            {contractor.FleetSummary}
          </p>
        </div>
      </div>

      {/* Grid: Contextual GIS Mini-Map showing Contractor's Operations + Assigned Contracts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SmartMiniMap
            names={assignedContracts.map((c) => c.Contract_Name)}
            title="פריסת אתרי עבודה של הקבלן"
            subtitle={`${assignedContracts.length} חוזים פעילים בשטח`}
            heightClass="h-72"
            type="contractor"
            locationName={contractor.Name}
            contractorProjects={assignedContracts.map((c) => ({
              name: c.Contract_Name,
              region: c.Region,
              block: c.Block,
            }))}
          />
        </div>

        {/* Assigned Contracts List */}
        <div className="lg:col-span-2 bg-white border border-slate-200/70 rounded-3xl p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col gap-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Trees className="w-5 h-5 text-[#16a34a]" />
            <span>התקשרויות באחריות הקבלן ({assignedContracts.length})</span>
          </h3>

          <div className="flex flex-col gap-3">
            {assignedContracts.map((c) => (
              <div
                key={c.Contract_ID}
                onClick={() => onSelectContract(c)}
                className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl p-4 transition-all cursor-pointer flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="tabular-nums font-bold text-[#16a34a] bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                      {c.Contract_Number}
                    </span>
                    <span className="font-bold text-slate-800 text-sm">{c.Contract_Name}</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    {c.Region} · {c.Block} · יערן מלווה: {c.Supervisor}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-left tabular-nums">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">ביצוע</span>
                    <span className="font-bold text-slate-800 text-sm">{c.ExecutionPercent}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">פונה</span>
                    <span className="font-bold text-[#059669] text-sm">{c.TotalDeliveredMQ} מ״ק</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#16a34a] shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
