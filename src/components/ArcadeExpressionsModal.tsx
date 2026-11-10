import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Play,
  X,
  FileCode,
  Layers,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import {
  ARCADE_SCRIPTS,
  ARCADE_EXPRESSION_PIVOT_TABLE,
  ARCADE_EXPRESSION_CONTRACT_360,
} from '../data/arcadeScripts';
import { Contract } from '../types/forestry';

interface ArcadeExpressionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contracts: Contract[];
}

export const ArcadeExpressionsModal: React.FC<ArcadeExpressionsModalProps> = ({
  isOpen,
  onClose,
  contracts,
}) => {
  const [selectedScriptId, setSelectedScriptId] = useState<string>('arcade-pivot-table');
  const [copied, setCopied] = useState(false);
  const [simulatedOutput, setSimulatedOutput] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentScript =
    ARCADE_SCRIPTS.find((s) => s.id === selectedScriptId) || ARCADE_SCRIPTS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentScript.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Run in-browser simulation of the Arcade Data Expression
  const handleRunSimulation = () => {
    if (selectedScriptId === 'arcade-pivot-table') {
      // Simulate Expression 1 (Pivot Table with OBJECTID)
      const groups: Record<string, any> = {};
      contracts.forEach((c) => {
        const key = `${c.Region}|${c.District}|${c.Block}`;
        if (!groups[key]) {
          groups[key] = {
            Region: c.Region,
            District: c.District,
            Block: c.Block,
            TotalContracts: 0,
            ActiveContracts: 0,
            TotalApprovedMQ: 0,
            TotalDeliveredMQ: 0,
          };
        }
        groups[key].TotalContracts += 1;
        if (c.Status === 'בביצוע' || c.Status === 'בתכנון' || c.Status === 'אושר לביצוע') {
          groups[key].ActiveContracts += 1;
        }
        groups[key].TotalApprovedMQ += c.TotalApprovedMQ;
        groups[key].TotalDeliveredMQ += c.TotalDeliveredMQ;
      });

      const features = Object.values(groups).map((g, idx) => {
        const balance = g.TotalApprovedMQ - g.TotalDeliveredMQ;
        return {
          attributes: {
            OBJECTID: idx + 1, // esriFieldTypeOID required for CSV export in ExB!
            Region: g.Region,
            District: g.District,
            Block: g.Block,
            TotalContracts: g.TotalContracts,
            ActiveContracts: g.ActiveContracts,
            TotalApprovedMQ: g.TotalApprovedMQ,
            TotalDeliveredMQ: g.TotalDeliveredMQ,
            TotalBalanceMQ: balance,
            ExecutionPercent: Math.round((g.TotalDeliveredMQ / g.TotalApprovedMQ) * 100),
            LowBalanceLicensesCount: balance > 0 && balance < 40 ? 1 : 0,
          },
        };
      });

      const featureSetResult = {
        fields: [
          { name: 'OBJECTID', type: 'esriFieldTypeOID', alias: 'מזהה ייחודי' },
          { name: 'Region', type: 'esriFieldTypeString', alias: 'מרחב' },
          { name: 'District', type: 'esriFieldTypeString', alias: 'אזור' },
          { name: 'Block', type: 'esriFieldTypeString', alias: 'גוש / יער' },
          { name: 'TotalContracts', type: 'esriFieldTypeInteger', alias: 'מספר התקשרויות' },
          { name: 'ActiveContracts', type: 'esriFieldTypeInteger', alias: 'התקשרויות פעילות' },
          { name: 'TotalApprovedMQ', type: 'esriFieldTypeDouble', alias: 'נפח מאושר כולל (מ״ק)' },
          { name: 'TotalDeliveredMQ', type: 'esriFieldTypeDouble', alias: 'נפח שפונה בפועל (מ״ק)' },
          { name: 'TotalBalanceMQ', type: 'esriFieldTypeDouble', alias: 'יתרה כוללת (מ״ק)' },
          { name: 'ExecutionPercent', type: 'esriFieldTypeDouble', alias: 'אחוז ביצוע כולל (%)' },
        ],
        geometryType: '',
        featuresCount: features.length,
        features: features,
      };

      setSimulatedOutput(JSON.stringify(featureSetResult, null, 2));
    } else {
      // Simulate Expression 2 (Contract 360 nested tree with Original_License_Id)
      const simulated360 = contracts.slice(0, 2).map((c, idx) => ({
        attributes: {
          OBJECTID: idx + 1,
          Contract_ID: c.Contract_ID,
          Contract_Number: c.Contract_Number,
          Contract_Name: c.Contract_Name,
          Status: c.Status,
          Region: c.Region,
          District: c.District,
          Block: c.Block,
          HasCriticalLowBalance: c.Felling_Licenses.some((fl) =>
            fl.Removing_Licenses.some((rl) => rl.BalanceMQ > 0 && rl.BalanceMQ < 40)
          )
            ? 1
            : 0,
          JSON_Data: {
            Contract_ID: c.Contract_ID,
            TotalApprovedMQ: c.TotalApprovedMQ,
            TotalDeliveredMQ: c.TotalDeliveredMQ,
            ManotCount: c.Manot.length,
            Felling_Licenses: c.Felling_Licenses.map((fl) => ({
              Felling_License_ID: fl.Felling_License_ID,
              License_Number: fl.License_Number,
              Removing_Licenses: fl.Removing_Licenses.map((rl) => ({
                Removing_License_ID: rl.Removing_License_ID,
                Original_License_Id: rl.Original_License_Id, // Linked relationship
                ApprovedMQ: rl.ApprovedMQ,
                DeliveredMQ: rl.DeliveredMQ,
                BalanceMQ: rl.BalanceMQ,
                LowBalanceAlert: rl.BalanceMQ > 0 && rl.BalanceMQ < 40, // < 40 MQ Alert flag!
              })),
            })),
            DeliveryNotesSorted: c.DeliveryNotes.slice(0, 3),
            WorkLogsSample: c.WorkLogs.slice(0, 2).map((w) => ({
              Log_ID: w.Log_ID,
              Date: w.Date,
              Workers: w.Workers,
              Equipment: w.Equipment,
            })),
          },
        },
      }));

      setSimulatedOutput(
        JSON.stringify(
          {
            description: 'Arcade Data Expression 2 output FeatureSet for ExB Card / List Widget',
            features: simulated360,
          },
          null,
          2
        )
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 text-right">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="bg-[#1b3d2f] text-white p-4 flex items-center justify-between border-b-2 border-emerald-600">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-700/60 text-white">
              <Code2 className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold font-['Rubik',sans-serif]">
                מעבדת סקריפטים Arcade ל-ArcGIS Experience Builder
              </h2>
              <p className="text-xs text-emerald-200/80">
                Core Arcade Data Expressions להזנת ווידג'טים בפורטל קק״ל (Table, List, Cards)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="bg-slate-100 p-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {ARCADE_SCRIPTS.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedScriptId(s.id);
                  setSimulatedOutput(null);
                }}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  selectedScriptId === s.id
                    ? 'bg-[#2e7d32] text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>הרץ סימולציה חיה</span>
            </button>

            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-900 text-white'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'הועתק ללוח!' : 'העתק קוד Arcade'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col gap-4 text-xs">
          {/* Script Details & ExB Context Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-emerald-950 font-['Rubik',sans-serif]">
                {currentScript.hebrewTitle}
              </span>
              <span className="text-[11px] font-mono bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded">
                Arcade Data Expression
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed">{currentScript.description}</p>
            <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-900 flex flex-wrap gap-4">
              <span>
                <strong>ייעוד ב-ExB:</strong> {currentScript.useCaseExB}
              </span>
              <span>
                <strong>מבנה פלט:</strong> {currentScript.outputSchemaDescription}
              </span>
            </div>
          </div>

          {/* Critical Requirement Highlights */}
          {selectedScriptId === 'arcade-pivot-table' ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-900 text-[11px] flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>דגש קריטי לייצוא CSV ב-Experience Builder:</strong> שדה ה-
                <code className="bg-blue-100 px-1 py-0.2 rounded font-bold">OBJECTID</code> מוגדר
                בסכמה כ-
                <code className="bg-blue-100 px-1 py-0.2 rounded font-bold">esriFieldTypeOID</code>.
                ללא שדה OID תקני זה, ווידג'ט Table של ExB לא יאפשר למשתמש לבצע הורדת CSV או סינון
                לפי בחירה.
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900 text-[11px] flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>דגש רישיונות נטילה והתראה:</strong> קישור רישיון נטילה לרישיון כריתה מתבצע באמצעות{' '}
                <code className="bg-amber-100 px-1 py-0.2 rounded font-bold">Original_License_Id</code>.
                בנוסף מוגדר דגל{' '}
                <code className="bg-amber-100 px-1 py-0.2 rounded font-bold">LowBalanceAlert</code>{' '}
                (בעץ רישיונות הנטילה) כאשר היתרה קטנה מ-40 מ״ק לצביעה מיידית באדום (⚠️).
              </div>
            </div>
          )}

          {/* Simulated Output (If Run) */}
          {simulatedOutput && (
            <div className="bg-slate-900 text-slate-100 rounded-lg p-3.5 border border-slate-700 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5" />
                  <span>תוצאת הרצת סימולציה חיה (Esri FeatureSet JSON):</span>
                </span>
                <button
                  onClick={() => setSimulatedOutput(null)}
                  className="text-slate-400 hover:text-white"
                >
                  סגור תצוגת פלט
                </button>
              </div>
              <pre className="text-[11px] font-mono overflow-x-auto max-h-56 p-2 bg-slate-950 rounded text-emerald-300">
                {simulatedOutput}
              </pre>
            </div>
          )}

          {/* Arcade Code Editor View */}
          <div className="border border-slate-300 rounded-lg overflow-hidden bg-slate-900 text-slate-100 flex flex-col shadow-inner">
            <div className="bg-slate-950 px-3.5 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono">{currentScript.id}.arcade</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Arcade 1.24 / ExB 1.15+</span>
            </div>

            <div className="overflow-x-auto p-4 max-h-[380px] font-mono text-[11px] leading-relaxed select-text" dir="ltr">
              <pre className="text-slate-200 text-left" dir="ltr">
                <code>{currentScript.code}</code>
              </pre>
            </div>
          </div>

          {/* How to implement in Experience Builder Guide */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-600 text-[11px] flex flex-col gap-1">
            <span className="font-bold text-slate-800">איך להטמיע ב-ArcGIS Experience Builder:</span>
            <ol className="list-decimal list-inside space-y-0.5 text-slate-600">
              <li>בלוח השמאלי של ExB עברו לטאב <strong>Data</strong> (נתונים) ולחצו על <strong>Add data</strong>.</li>
              <li>בחרו ב-<strong>Data expression</strong> (ביטוי נתונים).</li>
              <li>הדביקו את קוד ה-Arcade הנ״ל ועשו Save (שמירה).</li>
              <li>חברו את מקור הנתונים החדש לווידג'ט <strong>Table</strong> או <strong>List/Card</strong>.</li>
              <li>ה-CSV Export יפעל מיד מתוך תפריט 3 הנקודות בווידג'ט הטבלה!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>תואם לפורטל ArcGIS Enterprise & AGOL של קק״ל</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
