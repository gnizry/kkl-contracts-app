import { fmtDMY } from '../utils/insights';
import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  AlertTriangle,
  Truck,
  ClipboardList,
  ChevronDown,
  Layers,
  Wrench,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Building2,
  MapPin,
  Flame,
} from 'lucide-react';
import { Contract, RemovingLicense } from '../types/forestry';
import { isLowBalance } from '../utils/licenses';

interface Contract360CardProps {
  contract: Contract;
  onOpenSurvey123: (contractId: string) => void;
  onBackToList?: () => void;
}

export const Contract360Card: React.FC<Contract360CardProps> = ({
  contract,
  onOpenSurvey123,
  onBackToList,
}) => {
  // Collapsible sections toggle states (all can be opened/closed)
  const [expandAll, setExpandAll] = useState(false);

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'בתכנון':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'אושר לביצוע':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'בביצוע':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
      case 'בדיקת שטח':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'הסתיים':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Lifecycle steps for visual project lifecycle timeline
  const lifecycleSteps = [
    { id: 'בתכנון', label: '1. בתכנון' },
    { id: 'אושר לביצוע', label: '2. אושר לביצוע' },
    { id: 'בביצוע', label: '3. בביצוע' },
    { id: 'בדיקת שטח', label: '4. בדיקת שטח' },
    { id: 'הסתיים', label: '5. הסתיים' },
  ];

  const currentStepIndex = lifecycleSteps.findIndex((s) => s.id === contract.Status);

  // Stand status styling
  const getStandStatusClass = (status: string) => {
    switch (status) {
      case 'בוצע':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'בביצוע':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'טרם החל':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Helper to check if removing license has low balance
  const isLowBalance = (rl: RemovingLicense) => {
    return isLowBalance(rl);
  };

  // Sort delivery notes newest to oldest
  const sortedDeliveryNotes = [...contract.DeliveryNotes].sort(
    (a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col text-right">
      {/* 1. Header: Contract Name, Status Badge, Dates, Supervisor, Survey123 Button */}
      <div className="p-5 bg-gradient-to-l from-emerald-900 to-[#1b3d2f] text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-[300px]">
            {onBackToList && (
              <button
                onClick={onBackToList}
                className="flex items-center gap-1.5 text-xs text-emerald-300 hover:text-white mb-2 transition-colors cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>חזרה לטבלת ההתקשרויות</span>
              </button>
            )}

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs tabular-nums font-bold bg-white/10 px-2 py-0.5 rounded border border-white/20 text-emerald-200">
                {contract.Contract_Number}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full border shadow-2xs ${getStatusBadge(
                  contract.Status
                )}`}
              >
                {contract.Status}
              </span>
              <span className="text-xs text-emerald-200 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>שנת תקציב {contract.Year}</span>
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold font-['Rubik',sans-serif] mt-2 text-white">
              {contract.Contract_Name}
            </h2>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-emerald-200/90">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{contract.Region}</span> · <span>{contract.District}</span> · <span>{contract.Block}</span>
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>קבלן: {contract.Contractor}</span>
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>יערן אחראי: {contract.Supervisor}</span>
              </span>
            </div>
          </div>

          {/* Survey123 Field Form CTA & Actions */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
            <button
              onClick={() => onOpenSurvey123(contract.Contract_ID)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#4caf50] hover:bg-[#43a047] text-white rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer transform active:scale-95"
              title="פתח טופס דיווח שטח Survey123 להוספת עובדים, ציוד ויומן יומי"
            >
              <ClipboardList className="w-4 h-4 text-emerald-950" />
              <span>הוסף עובדים/ציוד/טפסים (Survey123)</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </button>

            <button
              onClick={() => setExpandAll(!expandAll)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-emerald-100 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-white/20"
            >
              {expandAll ? 'סגור הכל' : 'פתח הכל'}
            </button>
          </div>
        </div>

        {/* Volume Summary Strip inside Header */}
        <div className="mt-4 pt-4 border-t border-emerald-700/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-right">
          <div className="bg-emerald-950/40 rounded-lg p-2.5 border border-emerald-700/40">
            <div className="text-[11px] text-emerald-300">נפח מאושר כולל</div>
            <div className="text-lg font-bold tabular-nums tabular-nums text-white">
              {contract.TotalApprovedMQ.toLocaleString('he-IL')} <span className="text-xs font-normal">מ״ק</span>
            </div>
          </div>
          <div className="bg-emerald-950/40 rounded-lg p-2.5 border border-emerald-700/40">
            <div className="text-[11px] text-emerald-300">נפח שפונה בפועל</div>
            <div className="text-lg font-bold tabular-nums tabular-nums text-emerald-200">
              {contract.TotalDeliveredMQ.toLocaleString('he-IL')} <span className="text-xs font-normal">מ״ק</span>
            </div>
          </div>
          <div className="bg-emerald-950/40 rounded-lg p-2.5 border border-emerald-700/40">
            <div className="text-[11px] text-emerald-300">יתרת מ״ק לפינוי</div>
            <div className="text-lg font-bold tabular-nums tabular-nums text-emerald-100">
              {contract.BalanceMQ.toLocaleString('he-IL')} <span className="text-xs font-normal">מ״ק</span>
            </div>
          </div>
          <div className="bg-emerald-950/40 rounded-lg p-2.5 border border-emerald-700/40">
            <div className="text-[11px] text-emerald-300">אחוז ביצוע</div>
            <div className="text-lg font-bold tabular-nums tabular-nums text-emerald-300">
              {contract.ExecutionPercent}%
            </div>
          </div>
        </div>

        {/* Visual Project Lifecycle Timeline (בתכנון -> באישור -> בביצוע -> בדיקת שטח -> הסתיים) */}
        <div className="mt-4 pt-4 border-t border-emerald-700/60">
          <div className="text-xs font-semibold text-emerald-200 mb-2">ציר מחזור חיי ההתקשרות (Project Lifecycle):</div>
          <div className="grid grid-cols-5 gap-1 relative">
            {lifecycleSteps.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div key={step.id} className="flex flex-col items-center text-center">
                  <div
                    className={`w-full py-1.5 px-1 rounded text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
                      isCurrent
                        ? 'bg-amber-400 text-slate-950 shadow-sm ring-2 ring-white/50'
                        : isPast
                        ? 'bg-[#2e7d32] text-emerald-100'
                        : 'bg-emerald-950/60 text-emerald-400/60'
                    }`}
                  >
                    {isPast && <CheckCircle2 className="w-3 h-3 text-emerald-200" />}
                    {isCurrent && <Clock className="w-3 h-3 text-slate-950 animate-pulse" />}
                    <span className="truncate">{step.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Accordion / Collapsible Sections (<details>) */}
      <div className="p-5 flex flex-col gap-4 bg-[#f8fafc]">
        {/* SECTION 1: Stands (עומדים) grouped by Manot (מנות) */}
        <details
          open={expandAll || true}
          className="group bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden transition-all"
        >
          <summary className="px-4 py-3 bg-slate-50 hover:bg-slate-100 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Layers className="w-4 h-4 text-[#2e7d32]" />
              <span>עומדים ומנות יערניות (Stands & Manot)</span>
              <span className="text-xs font-normal text-slate-500 tabular-nums">
                ({contract.Manot.reduce((acc, m) => acc + m.Stands.length, 0)} עומדים ב-{contract.Manot.length} מנות)
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-180" />
          </summary>

          <div className="p-4 flex flex-col gap-4">
            {contract.Manot.map((mano) => (
              <div key={mano.Mano_ID} className="border border-slate-200 rounded-lg p-3 bg-slate-50/60">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 tabular-nums">{mano.Mano_ID}</span>
                    <span className="text-xs font-semibold text-slate-700">{mano.Mano_Name}</span>
                  </div>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded border ${getStandStatusClass(
                      mano.Status
                    )}`}
                  >
                    סטטוס מנה: {mano.Status}
                  </span>
                </div>

                {/* Stands as Chips / List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {mano.Stands.map((stand) => (
                    <div
                      key={stand.Stand_ID}
                      className="bg-white border border-slate-200 rounded-md p-2.5 text-xs flex flex-col gap-1 hover:border-[#2e7d32] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold tabular-nums text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          עומד {stand.Stand_ID}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${getStandStatusClass(
                            stand.Status
                          )}`}
                        >
                          {stand.Status}
                        </span>
                      </div>
                      <div className="text-slate-700 font-medium">{stand.DominantSpecies}</div>
                      <div className="text-slate-500 text-[11px]">{stand.TreatmentType}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 tabular-nums tabular-nums">
                        <span>{stand.AreaDunam} דונם</span>
                        <span>יעד: {stand.TargetVolumeMQ} מ״ק</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>

        {/* SECTION 2: Nested Licenses (רישיונות כריתה ונטילה) */}
        <details
          open={expandAll || true}
          className="group bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden transition-all"
        >
          <summary className="px-4 py-3 bg-slate-50 hover:bg-slate-100 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <FileText className="w-4 h-4 text-[#2e7d32]" />
              <span>רישיונות כריתה ונטילה מקוננים (Felling & Removing Licenses)</span>
              <span className="text-xs font-normal text-slate-500">
                (קישור רישיון נטילה לרישיון כריתה דרך Original_License_Id)
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-180" />
          </summary>

          <div className="p-4 flex flex-col gap-4">
            {contract.Felling_Licenses.map((felling) => (
              <div
                key={felling.Felling_License_ID}
                className="border-2 border-emerald-700/30 rounded-lg overflow-hidden bg-white"
              >
                {/* Parent Block: Felling License (רישיון כריתה) */}
                <div className="bg-emerald-50/70 p-3.5 border-b border-emerald-200/80 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs tabular-nums font-bold bg-[#1b3d2f] text-white px-2 py-0.5 rounded">
                        {felling.Felling_License_ID}
                      </span>
                      <span className="text-sm font-bold text-emerald-950 font-['Rubik',sans-serif]">
                        {felling.License_Number}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      הונפק ע״י: <strong className="text-slate-800">{felling.ForesterName}</strong> · תוקף:{' '}
                      <span className="tabular-nums">{felling.IssueDate}</span> עד{' '}
                      <span className="tabular-nums">{felling.ExpiryDate}</span>
                    </div>
                  </div>

                  <div className="text-left">
                    <span className="text-xs text-slate-500 block">נפח מאושר כולל לכריתה:</span>
                    <span className="text-base font-bold tabular-nums tabular-nums text-emerald-900">
                      {felling.ApprovedQuantityMQ.toLocaleString('he-IL')} מ״ק
                    </span>
                  </div>
                </div>

                {/* Nested Associated Removing Licenses (רישיונות נטילה) */}
                <div className="p-3.5 bg-slate-50/50 flex flex-col gap-2.5">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>רישיונות נטילה מקושרים (Removing Licenses):</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      מקשר דרך Original_License_Id: {felling.Felling_License_ID}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {felling.Removing_Licenses.map((removing) => {
                      const lowBal = isLowBalance(removing);
                      return (
                        <div
                          key={removing.Removing_License_ID}
                          className={`rounded-lg p-3 border transition-all ${
                            lowBal
                              ? 'bg-red-50/90 border-red-400 text-red-950 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs">{removing.License_Number}</span>
                                <span className="tabular-nums text-[10px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded">
                                  {removing.Removing_License_ID}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                יעד פינוי: <span className="font-medium text-slate-700">{removing.Destination}</span>
                              </div>
                            </div>

                            {/* CRITICAL WARNING: Highlight in red with warning icon (⚠️) if balance < 40 MQ */}
                            {lowBal && (
                              <div className="flex items-center gap-1 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-2xs animate-pulse shrink-0">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>יתרה נמוכה (&lt;40 מ״ק) ⚠️</span>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-slate-200/80 text-[11px] tabular-nums tabular-nums">
                            <div>
                              <span className="text-[10px] text-slate-500 block">מאושר:</span>
                              <strong>{removing.ApprovedMQ} מ״ק</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">פונה:</span>
                              <strong>{removing.DeliveredMQ} מ״ק</strong>
                            </div>
                            <div>
                              <span
                                className={`text-[10px] block ${
                                  lowBal ? 'text-red-700 font-bold' : 'text-slate-500'
                                }`}
                              >
                                יתרה:
                              </span>
                              <strong
                                className={`text-sm ${
                                  lowBal ? 'text-red-700 font-extrabold' : 'text-slate-800'
                                }`}
                              >
                                {removing.BalanceMQ} מ״ק
                              </strong>
                            </div>
                          </div>

                          {removing.Notes && (
                            <p
                              className={`text-[11px] mt-2 p-1.5 rounded ${
                                lowBal
                                  ? 'bg-red-100/70 text-red-900 border border-red-200'
                                  : 'bg-slate-50 text-slate-600'
                              }`}
                            >
                              {removing.Notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </details>

        {/* SECTION 3: Delivery Notes (תעודות משלוח) */}
        <details
          open={expandAll || true}
          className="group bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden transition-all"
        >
          <summary className="px-4 py-3 bg-slate-50 hover:bg-slate-100 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Truck className="w-4 h-4 text-[#2e7d32]" />
              <span>תעודות משלוח (Delivery Notes)</span>
              <span className="text-xs font-normal text-slate-500">
                (ממוינות מהחדשה ביותר לישנה ביותר · {sortedDeliveryNotes.length} תעודות רשומות)
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-180" />
          </summary>

          <div className="p-4">
            {sortedDeliveryNotes.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                טרם נרשמו תעודות משלוח בהתקשרות זו.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {sortedDeliveryNotes.map((dn) => (
                  <details
                    key={dn.Delivery_ID}
                    className="border border-slate-200 rounded-lg bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors"
                  >
                    <summary className="flex flex-wrap items-center justify-between gap-2 cursor-pointer list-none">
                      <div className="flex items-center gap-3">
                        <span className="font-bold tabular-nums text-xs text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {dn.Delivery_ID}
                        </span>
                        <span className="text-xs text-slate-600 tabular-nums tabular-nums">{dn.Date}</span>
                        <span className="text-xs font-semibold text-slate-800">{dn.WoodType}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold tabular-nums tabular-nums text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {dn.QuantityMQ} מ״ק
                        </span>
                        <span className="text-xs text-slate-500 tabular-nums">משאית: {dn.TruckPlate}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </summary>

                    {/* Sub-collapse to view full details per note */}
                    <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">רישיון נטילה מקושר:</span>
                        <span className="tabular-nums font-semibold text-slate-700">{dn.Removing_License_ID}</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">נהג משאית:</span>
                        <span className="font-semibold text-slate-700">{dn.DriverName}</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">תעודת שקילה:</span>
                        <span className="tabular-nums text-slate-700">{dn.WeighSlipNumber}</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">יעד פריקה:</span>
                        <span className="text-slate-700">{dn.DestinationYard}</span>
                      </div>
                      <div className="col-span-full text-[11px] text-slate-500 flex items-center justify-between pt-1">
                        <span>אישור פיקוח: {dn.SupervisorSign}</span>
                        {dn.Notes && <span>הערות: {dn.Notes}</span>}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>
        </details>

        {/* SECTION 4: Work Logs (יומני עבודה) */}
        <details
          open={expandAll || true}
          className="group bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden transition-all"
        >
          <summary className="px-4 py-3 bg-slate-50 hover:bg-slate-100 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <ClipboardList className="w-4 h-4 text-[#2e7d32]" />
              <span>יומני עבודה ושטח (Work Logs)</span>
              <span className="text-xs font-normal text-slate-500">
                (זמני פעילות, הערות מפקח, רשימות עובדים וציוד)
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-180" />
          </summary>

          <div className="p-4">
            {contract.WorkLogs.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                טרם הוזנו יומני עבודה עבור התקשרות זו. לחץ על כפתור Survey123 למעלה להזנת דיווח ראשון.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {contract.WorkLogs.map((log) => (
                  <div
                    key={log.Log_ID}
                    className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/60 flex flex-col gap-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums font-bold text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                          {log.Log_ID}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">{fmtDMY(log.Date)}</span>
                        <span className="text-xs text-slate-500 tabular-nums">
                          שעות: {log.StartTime} - {log.EndTime}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span>עומדים שבוצעו: <strong>{log.StandsWorked}</strong></span>
                      </div>
                    </div>

                    {/* Supervisor Comments */}
                    <div className="bg-white p-2.5 rounded border border-slate-200 text-xs text-slate-700">
                      <span className="font-bold text-slate-900 block mb-0.5">הערות מפקח יערני:</span>
                      {log.SupervisorComments}
                    </div>

                    {/* Workers & Equipment: Displayed from flattened strings in Work Log parent record */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {/* Workers */}
                      <div className="bg-emerald-50/60 border border-emerald-200/80 rounded p-2.5">
                        <div className="flex items-center gap-1.5 text-emerald-900 font-bold mb-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>צוות עובדים בשטח (Workers):</span>
                        </div>
                        <p className="text-emerald-950 text-[11px] leading-relaxed">{log.Workers}</p>
                      </div>

                      {/* Equipment */}
                      <div className="bg-amber-50/60 border border-amber-200/80 rounded p-2.5">
                        <div className="flex items-center gap-1.5 text-amber-900 font-bold mb-1">
                          <Wrench className="w-3.5 h-3.5" />
                          <span>כלים וציוד מכני (Equipment):</span>
                        </div>
                        <p className="text-amber-950 text-[11px] leading-relaxed">{log.Equipment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>
      </div>
    </div>
  );
};
