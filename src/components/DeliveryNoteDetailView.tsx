import React from 'react';
import {
  ArrowRight,
  Truck,
  Scale,
  Calendar,
  MapPin,
  Building2,
  FileText,
  ShieldCheck,
  User,
  CheckCircle2,
} from 'lucide-react';
import { DeliveryNote, Contract } from '../types/forestry';
import { SmartMiniMap } from './SmartMap';

interface DeliveryNoteDetailViewProps {
  note: DeliveryNote;
  contract: Contract;
  onBack: () => void;
  onSelectContract: (contract: Contract) => void;
}

export const DeliveryNoteDetailView: React.FC<DeliveryNoteDetailViewProps> = ({
  note,
  contract,
  onBack,
  onSelectContract,
}) => {
  return (
    <div className="flex flex-col gap-6 text-right">
      {/* Back Button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl border border-slate-200/80 shadow-2xs transition-colors cursor-pointer text-sm"
        >
          <ArrowRight className="w-4 h-4 text-[#16a34a]" />
          <span>חזרה לרשימת תעודות המשלוח</span>
        </button>
      </div>

      {/* Main Delivery Note Card */}
      <div className="bg-white border border-slate-200/70 rounded-3xl p-6 md:p-8 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-sm tabular-nums font-bold bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-xl">
                {note.Delivery_ID}
              </span>
              <span className="text-xs px-3.5 py-1 rounded-full bg-[#ecfdf5] text-[#059669] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                <span>משלוח נקלט ואושר</span>
              </span>
              <span className="text-xs text-slate-400 tabular-nums">תאריך: {note.Date}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold font-['Rubik',sans-serif] text-slate-900 mt-3">
              תעודת משלוח שינוע עץ: {note.Delivery_ID}
            </h1>

            <p className="text-base text-slate-700 font-semibold mt-2">
              סוג חומר: <span className="text-[#16a34a]">{note.WoodType}</span>
            </p>

            <div className="flex flex-wrap items-center gap-6 mt-3 text-xs md:text-sm text-slate-600">
              <span className="flex items-center gap-1.5 tabular-nums">
                <FileText className="w-4 h-4 text-[#16a34a]" />
                רישיון נטילה: <strong>{note.Removing_License_ID}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#16a34a]" />
                התקשרות: <strong>{contract.Contract_Name}</strong>
              </span>
            </div>
          </div>

          <div className="bg-[#ecfdf5] border border-emerald-100 rounded-3xl p-5 text-center min-w-[200px]">
            <span className="text-xs text-[#059669] font-bold block mb-1">כמות כוללת בתעודה</span>
            <div className="text-4xl font-bold tabular-nums text-[#065f46] tabular-nums">
              {note.QuantityMQ} <span className="text-base font-normal">מ״ק</span>
            </div>
            <span className="text-[11px] text-emerald-700 block mt-1">נפח עץ נטו מבוקר</span>
          </div>
        </div>

        {/* Vehicle & Weighing Slip Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-400 block mb-1">נהג משאית</span>
            <div className="text-base font-bold text-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span>{note.DriverName}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-400 block mb-1">מספר רישוי משאית</span>
            <div className="text-base font-bold tabular-nums text-slate-800 flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-400" />
              <span>{note.TruckPlate}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-400 block mb-1">תעודת שקילה</span>
            <div className="text-base font-bold tabular-nums text-slate-800 flex items-center gap-2">
              <Scale className="w-4 h-4 text-slate-400" />
              <span>{note.WeighSlipNumber}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-400 block mb-1">אתר יעד ופריקה</span>
            <div className="text-base font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="truncate">{note.DestinationYard}</span>
            </div>
          </div>
        </div>

        {/* Verification and Notes */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#16a34a]" />
            <span>אישור מפקח יערני: {note.SupervisorSign}</span>
          </div>
          {note.Notes && (
            <p className="text-slate-600 leading-relaxed pt-1 border-t border-slate-200/60">
              הערות שטח: {note.Notes}
            </p>
          )}
        </div>
      </div>

      {/* Contextual GIS Mini-Map showing Transport Route */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SmartMiniMap
            names={[contract.Contract_Name]}
            title="מסלול שינוע עץ: מיער המוצא לאתר הפריקה והשקילה"
            subtitle={`${contract.Block} ← ${note.DestinationYard}`}
            heightClass="h-80"
            type="delivery"
            locationName={`${contract.Block} מוצא`}
            routeInfo={{ from: contract.Block, to: note.DestinationYard, distanceKm: 28 }}
            coordinates={contract.Coordinates}
          />
        </div>

        {/* Contract Info Summary */}
        <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between text-xs">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100">
              פרטי התקשרות יערנית
            </h3>
            <div className="flex flex-col gap-2.5 text-slate-600">
              <div>
                <span className="text-slate-400 block">שם התקשרות:</span>
                <span className="font-bold text-slate-800 text-sm">{contract.Contract_Name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">גוש / יער:</span>
                <span className="font-semibold text-slate-800">{contract.Block}</span>
              </div>
              <div>
                <span className="text-slate-400 block">קבלן אחראי:</span>
                <span className="font-semibold text-slate-800">{contract.Contractor}</span>
              </div>
              <div>
                <span className="text-slate-400 block">יערן אחראי:</span>
                <span className="font-semibold text-slate-800">{contract.Supervisor}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => onSelectContract(contract)}
              className="w-full py-2.5 px-3 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl font-bold transition-colors cursor-pointer text-center"
            >
              צפה בכל פרטי ההתקשרות
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
