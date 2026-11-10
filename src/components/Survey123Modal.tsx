import React, { useState } from 'react';
import {
  X,
  ClipboardCheck,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { Contract, WorkLog } from '../types/forestry';

interface Survey123ModalProps {
  isOpen: boolean;
  onClose: () => void;
  contracts: Contract[];
  defaultContractId?: string;
  onAddWorkLog: (contractId: string, newLog: WorkLog) => void;
}

export const Survey123Modal: React.FC<Survey123ModalProps> = ({
  isOpen,
  onClose,
  contracts,
  defaultContractId,
  onAddWorkLog,
}) => {
  const [selectedContractId, setSelectedContractId] = useState<string>(
    defaultContractId || (contracts[0]?.Contract_ID ?? '')
  );

  const [date, setDate] = useState<string>('2024-10-26');
  const [startTime, setStartTime] = useState<string>('06:30');
  const [endTime, setEndTime] = useState<string>('15:30');
  const [standsWorked, setStandsWorked] = useState<string>('עומד 104-14');
  const [supervisorComments, setSupervisorComments] = useState<string>(
    'המשך דילול סניטרי ופינוי ענפים לשבילי גישה. העבודה בוצעה ללא אירועי בטיחות.'
  );

  // Workers
  const [workersList, setWorkersList] = useState<string[]>([
    'יוסי כהן (מנהל עבודה)',
    'מחמוד זועבי (גוזם מוסמך)',
    'סרגיי פופוב (מנסר מכני)',
  ]);
  const [newWorker, setNewWorker] = useState<string>('');

  // Equipment
  const [equipmentList, setEquipmentList] = useState<string[]>([
    'מחבט גזם בובקט (מס\' 55-12)',
    'מסור שרשרת Stihl MS 661',
  ]);
  const [newEquipment, setNewEquipment] = useState<string>('');

  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleAddWorker = () => {
    if (newWorker.trim()) {
      setWorkersList([...workersList, newWorker.trim()]);
      setNewWorker('');
    }
  };

  const handleRemoveWorker = (index: number) => {
    setWorkersList(workersList.filter((_, i) => i !== index));
  };

  const handleAddEquipment = () => {
    if (newEquipment.trim()) {
      setEquipmentList([...equipmentList, newEquipment.trim()]);
      setNewEquipment('');
    }
  };

  const handleRemoveEquipment = (index: number) => {
    setEquipmentList(equipmentList.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const createdLog: WorkLog = {
      Log_ID: `WL-2024-${Math.floor(100 + Math.random() * 900)}`,
      Date: date,
      StartTime: startTime,
      EndTime: endTime,
      Contract_ID: selectedContractId,
      SupervisorComments: supervisorComments,
      Weather: '',
      StandsWorked: standsWorked,
      Workers: workersList.join(', '),
      Equipment: equipmentList.join(', '),
      SafetyIncident: false,
    };

    onAddWorkLog(selectedContractId, createdLog);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 text-right font-['Rubik','Assistant',sans-serif]">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Soft Header */}
        <div className="bg-[#16a34a] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-white text-sm">
              S123
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-bold font-['Rubik',sans-serif]">
                  דיווח שטח חדש (ArcGIS Survey123)
                </h2>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full tabular-nums">
                  קק״ל שטח
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                טופס מקושר להתקשרות לעדכון עובדים, כלים ושעות עבודה
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-10 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#16a34a] flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">הדיווח נקלט בהצלחה!</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              יומן העבודה, רשימת העובדים והציוד עודכנו בהתקשרות וסונכרנו למערכת בזמן אמת.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 text-xs md:text-sm">
            {/* Contract Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-700">התקשרות יערנית מקושרת:</label>
              <select
                value={selectedContractId}
                onChange={(e) => setSelectedContractId(e.target.value)}
                className="p-2.5 border border-slate-200 rounded-2xl bg-slate-50 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
              >
                {contracts.map((c) => (
                  <option key={c.Contract_ID} value={c.Contract_ID}>
                    {c.Contract_Number} - {c.Contract_Name} ({c.Contractor})
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">תאריך ביצוע:</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="p-2.5 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">שעת התחלה:</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="p-2.5 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">שעת סיום:</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="p-2.5 border border-slate-200 rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Stands */}
            <div className="grid grid-cols-1 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">עומדים בהם בוצעה פעילות:</label>
                <input
                  type="text"
                  value={standsWorked}
                  onChange={(e) => setStandsWorked(e.target.value)}
                  className="p-2.5 border border-slate-200 rounded-xl"
                  placeholder="עומד 104-14, 104-19"
                  required
                />
              </div>
            </div>

            {/* Workers List */}
            <div className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/60 flex flex-col gap-2.5">
              <label className="font-bold text-slate-800">
                עובדים בשטח (FirstName + LastName + תפקיד):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newWorker}
                  onChange={(e) => setNewWorker(e.target.value)}
                  placeholder="הזן שם עובד ותפקיד..."
                  className="flex-1 p-2.5 border border-slate-200 rounded-xl bg-white text-xs md:text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddWorker();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddWorker}
                  className="px-4 py-2.5 bg-[#16a34a] text-white rounded-xl font-bold hover:bg-[#15803d] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>הוסף</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mt-1">
                {workersList.map((w, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-xl text-xs text-slate-700 shadow-2xs"
                  >
                    <span>{w}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveWorker(idx)}
                      className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Equipment List */}
            <div className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/60 flex flex-col gap-2.5">
              <label className="font-bold text-slate-800">
                כלים וציוד מכני (סוג + מספר רישוי/זיהוי):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newEquipment}
                  onChange={(e) => setNewEquipment(e.target.value)}
                  placeholder="הזן כלי/ציוד..."
                  className="flex-1 p-2.5 border border-slate-200 rounded-xl bg-white text-xs md:text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddEquipment();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddEquipment}
                  className="px-4 py-2.5 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>הוסף</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mt-1">
                {equipmentList.map((eq, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-xl text-xs text-slate-700 shadow-2xs"
                  >
                    <span>{eq}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEquipment(idx)}
                      className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Supervisor Comments */}
            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-700">הערות יערן / מפקח שטח:</label>
              <textarea
                rows={3}
                value={supervisorComments}
                onChange={(e) => setSupervisorComments(e.target.value)}
                className="p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
                required
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer font-medium text-slate-600"
              >
                ביטול
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl font-bold shadow-md transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>שמור ושדר לחוזה</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
