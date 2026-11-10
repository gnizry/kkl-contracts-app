import { fmtDMY } from '../utils/insights';
import React from 'react';
import {
  ArrowRight,
  ClipboardList,
  Calendar,
  Clock,
  CloudSun,
  Users,
  Wrench,
  ShieldCheck,
  Building2,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { WorkLog, Contract } from '../types/forestry';
import { SmartMiniMap } from './SmartMap';

interface WorkLogDetailViewProps {
  log: WorkLog;
  contract: Contract;
  onBack: () => void;
  onSelectContract: (contract: Contract) => void;
}

export const WorkLogDetailView: React.FC<WorkLogDetailViewProps> = ({
  log,
  contract,
  onBack,
  onSelectContract,
}) => {
  const workersArray = log.Workers.split(',').map((w) => w.trim()).filter(Boolean);
  const equipmentArray = log.Equipment.split(',').map((e) => e.trim()).filter(Boolean);

  return (
    <div className="flex flex-col gap-6 text-right">
      {/* Back Button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl border border-slate-200/80 shadow-2xs transition-colors cursor-pointer text-sm"
        >
          <ArrowRight className="w-4 h-4 text-[#16a34a]" />
          <span>חזרה לרשימת יומני העבודה</span>
        </button>
      </div>

      {/* Main Work Log Card */}
      <div className="bg-white border border-slate-200/70 rounded-3xl p-6 md:p-8 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-sm tabular-nums font-bold bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-xl">
                {log.Log_ID}
              </span>
              <span className="text-xs px-3.5 py-1 rounded-full bg-[#ecfdf5] text-[#059669] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                <span>יומן עבודה מאושר</span>
              </span>
              <span className="text-xs text-slate-400 tabular-nums">תאריך: {fmtDMY(log.Date)}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold font-['Rubik',sans-serif] text-slate-900 mt-3">
              יומן עבודה: {fmtDMY(log.Date)}
            </h1>

            <div className="flex flex-wrap items-center gap-6 mt-3 text-xs md:text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#16a34a]" />
                שעות עבודה: <strong className="tabular-nums">{log.StartTime} - {log.EndTime}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#16a34a]" />
                עומדים: <strong>{log.StandsWorked}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#16a34a]" />
                קבלן: <strong>{contract.Contractor}</strong>
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs flex flex-col gap-1 min-w-[200px]">
            <div className="text-emerald-700 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ללא אירועי בטיחות</span>
            </div>
          </div>
        </div>

        {/* Supervisor Comments Box */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <span className="text-xs font-bold text-slate-400 block mb-1">דו״ח מפקח יערני והערות שטח:</span>
          <p className="text-base text-slate-800 leading-relaxed font-medium">
            {log.SupervisorComments}
          </p>
          <div className="mt-3 pt-2 border-t border-slate-200/60 text-xs text-slate-500 flex justify-between">
            <span>מפקח שטח מאשר: <strong>{contract.Supervisor}</strong></span>
            <span>התקשרות: {contract.Contract_Name} ({contract.Contract_Number})</span>
          </div>
        </div>

        {/* Crew and Machinery Badges Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Workers */}
          <div className="border border-emerald-100 rounded-2xl p-4 bg-[#ecfdf5]/60">
            <h3 className="text-sm font-bold text-[#065f46] flex items-center gap-2 mb-3 pb-2 border-b border-emerald-200/60">
              <Users className="w-4 h-4 text-[#059669]" />
              <span>צוות עובדים בשטח ({workersArray.length})</span>
            </h3>
            <div className="flex flex-col gap-2">
              {workersArray.map((worker, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3 rounded-xl border border-emerald-100 text-xs text-slate-800 font-medium shadow-2xs flex items-center gap-2"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <span>{worker}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Machinery & Equipment */}
          <div className="border border-amber-100 rounded-2xl p-4 bg-amber-50/50">
            <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2 mb-3 pb-2 border-b border-amber-200/60">
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>כלים וציוד מכני שהופעלו ({equipmentArray.length})</span>
            </h3>
            <div className="flex flex-col gap-2">
              {equipmentArray.map((eq, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3 rounded-xl border border-amber-100 text-xs text-slate-800 font-medium shadow-2xs flex items-center gap-2"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <span>{eq}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contextual GIS Mini-Map showing Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SmartMiniMap
            names={[contract.Contract_Name]}
            title={`מפת עומד הפעילות: ${log.StandsWorked}`}
            subtitle={`${contract.Block} · פריסת צוות שטח וקווי חישוף`}
            heightClass="h-72"
            type="worklog"
            locationName={`${contract.Block} - ${log.StandsWorked}`}
            coordinates={contract.Coordinates}
          />
        </div>

        {/* Contract Quick Jump */}
        <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between text-xs">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100">
              התקשרות יערנית מקושרת
            </h3>
            <div className="flex flex-col gap-2 text-slate-600">
              <span className="font-bold text-slate-900 text-sm">{contract.Contract_Name}</span>
              <span>מספר חוזה: {contract.Contract_Number}</span>
              <span>מרחב: {contract.Region}</span>
              <span>גוש: {contract.Block}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => onSelectContract(contract)}
              className="w-full py-2.5 px-3 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl font-bold transition-colors cursor-pointer text-center"
            >
              מעבר לפרטי התקשרות זו
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
