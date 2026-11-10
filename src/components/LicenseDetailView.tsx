import React from 'react';
import {
  ArrowRight,
  FileText,
  Calendar,
  AlertTriangle,
  Building2,
  MapPin,
  Truck,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { RemovingLicense, Contract, FellingLicense } from '../types/forestry';
import { SmartMiniMap } from './SmartMap';
import { isLowBalance as checkLowBalance } from '../utils/licenses';

interface LicenseDetailViewProps {
  license: RemovingLicense;
  fellingLicense?: FellingLicense;
  contract: Contract;
  onBack: () => void;
  onSelectContract: (contract: Contract) => void;
}

export const LicenseDetailView: React.FC<LicenseDetailViewProps> = ({
  license,
  fellingLicense,
  contract,
  onBack,
  onSelectContract,
}) => {
  const isLowBalance = checkLowBalance(license);
  const executionPercent =
    license.ApprovedMQ > 0 ? Math.round((license.DeliveredMQ / license.ApprovedMQ) * 100) : 0;

  const relatedDeliveries = contract.DeliveryNotes.filter(
    (dn) => dn.Removing_License_ID === license.Removing_License_ID
  );

  return (
    <div className="flex flex-col gap-6 text-right">
      {/* Back Button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl border border-slate-200/80 shadow-2xs transition-colors cursor-pointer text-sm"
        >
          <ArrowRight className="w-4 h-4 text-[#16a34a]" />
          <span>חזרה לרשימת הרישיונות</span>
        </button>
      </div>

      {/* Main License Card */}
      <div className="bg-white border border-slate-200/70 rounded-3xl p-6 md:p-8 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-sm tabular-nums font-bold bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-xl">
                {license.Removing_License_ID}
              </span>
              <span className="text-xs px-3.5 py-1 rounded-full bg-[#ecfdf5] text-[#059669] font-bold">
                רישיון נטילה פעיל
              </span>
              {isLowBalance && (
                <span className="text-xs px-3.5 py-1 rounded-full bg-[#fff1f2] text-[#e11d48] border border-[#fecdd3] font-bold flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>התראת יתרה קריטית (&lt;40 מ״ק) ⚠️</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold font-['Rubik',sans-serif] text-slate-900 mt-3">
              {license.License_Number}
            </h1>

            <div className="flex flex-wrap items-center gap-6 mt-3 text-xs md:text-sm text-slate-600">
              <span className="flex items-center gap-1.5 tabular-nums">
                <FileText className="w-4 h-4 text-[#16a34a]" />
                רישיון כריתה אב: <strong>{license.Original_License_Id}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#16a34a]" />
                קבלן: <strong>{contract.Contractor}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#16a34a]" />
                יעד מורשה: <strong>{license.Destination}</strong>
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs flex flex-col gap-1 min-w-[220px]">
            <span className="text-slate-500">תוקף הרישיון:</span>
            <div className="tabular-nums text-sm font-bold text-slate-800">
              {license.IssueDate} עד {license.ExpiryDate}
            </div>
            <span className="text-emerald-700 text-[11px] font-semibold mt-1">
              פקיד מנפיק: {fellingLicense?.ForesterName || 'פקיד יערות אזורי'}
            </span>
          </div>
        </div>

        {/* Critical Low Balance Warning Box if applicable */}
        {isLowBalance && (
          <div className="bg-[#fff1f2] border border-[#fecdd3] rounded-2xl p-4 text-[#9f1239] flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-[#e11d48] shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong className="block text-base text-[#9f1239] font-bold">
                התראה: נותרו {license.BalanceMQ} מ״ק בלבד ברישיון זה!
              </strong>
              <p className="mt-1 text-[#881337] leading-relaxed">
                יתרת הפינוי נמוכה מקיבולת משאית כפולה סטנדרטית (40 מ״ק). יש להיערך לסגירת הרישיון או להנפקת רישיון נטילה נוסף.
              </p>
            </div>
          </div>
        )}

        {/* Quota Extraction Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
            <span className="text-xs text-slate-500 block mb-1">מכסה מאושרת</span>
            <div className="text-3xl font-bold tabular-nums text-slate-900 tabular-nums">
              {license.ApprovedMQ} <span className="text-sm font-normal">מ״ק</span>
            </div>
          </div>

          <div className="bg-[#ecfdf5] p-5 rounded-2xl border border-emerald-100 text-center">
            <span className="text-xs text-[#059669] font-bold block mb-1">פונה בפועל</span>
            <div className="text-3xl font-bold tabular-nums text-[#065f46] tabular-nums">
              {license.DeliveredMQ} <span className="text-sm font-normal">מ״ק</span>
            </div>
            <span className="text-xs text-[#059669] font-semibold">{executionPercent}% ניצול</span>
          </div>

          <div
            className={`p-5 rounded-2xl border text-center ${
              isLowBalance ? 'bg-[#fff1f2] border-[#fecdd3]' : 'bg-slate-50 border-slate-100'
            }`}
          >
            <span className={`text-xs block mb-1 ${isLowBalance ? 'text-[#e11d48] font-bold' : 'text-slate-500'}`}>
              יתרה נותרת
            </span>
            <div
              className={`text-3xl font-bold tabular-nums tabular-nums ${
                isLowBalance ? 'text-[#e11d48]' : 'text-slate-900'
              }`}
            >
              {license.BalanceMQ} <span className="text-sm font-normal">מ״ק</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Contextual GIS Mini-Map + Deliveries against this license */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SmartMiniMap
            names={[contract.Contract_Name]}
            title="תחום רישיון כריתה ונטילה"
            subtitle={license.Destination}
            heightClass="h-72"
            type="license"
            locationName={`${contract.Block} - גבולות כריתה`}
            coordinates={contract.Coordinates}
          />
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200/70 rounded-3xl p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col gap-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Truck className="w-5 h-5 text-[#16a34a]" />
            <span>תעודות משלוח שנקלטו תחת רישיון זה ({relatedDeliveries.length})</span>
          </h3>

          {relatedDeliveries.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              טרם נרשמו תעודות משלוח עבור רישיון נטילה זה.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {relatedDeliveries.map((dn) => (
                <div
                  key={dn.Delivery_ID}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <span className="tabular-nums font-bold text-slate-900 text-sm">{dn.Delivery_ID}</span>
                    <span className="text-slate-400 tabular-nums mr-3">{dn.Date}</span>
                    <div className="text-slate-700 mt-1">{dn.WoodType}</div>
                  </div>

                  <div className="flex items-center gap-4 text-left tabular-nums">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">משאית</span>
                      <span className="font-semibold text-slate-800">{dn.TruckPlate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">כמות</span>
                      <span className="font-bold text-[#059669] text-sm">{dn.QuantityMQ} מ״ק</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>משויך להתקשרות: <strong>{contract.Contract_Name}</strong></span>
            <button
              onClick={() => onSelectContract(contract)}
              className="text-[#16a34a] font-bold hover:underline cursor-pointer"
            >
              פתח פרטי התקשרות ←
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
