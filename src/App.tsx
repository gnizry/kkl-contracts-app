import React, { useState, useMemo } from 'react';
import { ModernRightSidebar } from './components/ModernRightSidebar';
import { ModernTopBar } from './components/ModernTopBar';
import { LandingPageView } from './components/LandingPageView';
import { MapPageView } from './components/MapPageView';
import { MonitoringView } from './components/MonitoringView';
import { StatsView } from './components/StatsView';
import { ConnectionModal } from './components/ConnectionModal';
import { AggregatedTableView } from './components/AggregatedTableView';
import { ContractDetailView } from './components/ContractDetailView';
import { ContractPage } from './components/ContractPage';
import { LiveMiniMap } from './components/LiveMiniMap';
import { useConnection } from './connection';
import { LicensesView } from './components/LicensesView';
import { LicenseDetailView } from './components/LicenseDetailView';
import { DeliveryNotesView } from './components/DeliveryNotesView';
import { DeliveryNoteDetailView } from './components/DeliveryNoteDetailView';
import { WorkLogsView } from './components/WorkLogsView';
import { WorkLogDetailView } from './components/WorkLogDetailView';
import { ContractorsView } from './components/ContractorsView';
import { ContractorDetailView } from './components/ContractorDetailView';
import { ContractWorkspace } from './components/ContractWorkspace';
import { StatusWorkspace } from './components/StatusWorkspace';
import { Survey123Modal } from './components/Survey123Modal';
import { ExbSidebarFilters } from './components/ExbSidebarFilters';
import { ArcadeExpressionsModal } from './components/ArcadeExpressionsModal';
import { MOCK_CONTRACTS, USE_REAL_DATA } from './data/mockKklData';
import {
  Contract,
  FilterState,
  WorkLog,
  RemovingLicense,
  FellingLicense,
  DeliveryNote,
  ContractorInfo,
} from './types/forestry';
import { Check, X } from 'lucide-react';
import { isLowBalance } from './utils/licenses';

export default function App() {
  const [contracts, setContracts] = useState<Contract[]>(MOCK_CONTRACTS);

  // Global filters (מרחב / אזור / גוש / סטטוס / שנה) – apply to the whole dashboard
  const EMPTY_FILTERS: FilterState = {
    region: '', district: '', block: '', status: '', year: '', lowBalanceOnly: false, searchTerm: '',
  };
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);
  const [isArcadeOpen, setIsArcadeOpen] = useState<boolean>(false);

  const filteredContracts = useMemo(() => {
    const term = filters.searchTerm.trim().toLowerCase();
    return contracts.filter((c) => {
      if (filters.region && c.Region !== filters.region) return false;
      if (filters.district && c.District !== filters.district) return false;
      if (filters.block && c.Block !== filters.block) return false;
      if (filters.status && c.Status !== filters.status) return false;
      if (filters.year && String(c.Year) !== filters.year) return false;
      if (
        filters.lowBalanceOnly &&
        !c.Felling_Licenses.some((fl) =>
          fl.Removing_Licenses.some((rl) => isLowBalance(rl))
        )
      )
        return false;
      if (term) {
        const hay = [c.Contract_Name, c.Contract_Number, c.Contractor, c.Block, c.District, c.Supervisor]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [contracts, filters]);

  const activeFilterCount =
    [filters.region, filters.district, filters.block, filters.status, filters.year, filters.searchTerm].filter(Boolean)
      .length + (filters.lowBalanceOnly ? 1 : 0);
  const { liveModel, openLive } = useConnection();
  const [activeTab, setActiveTab] = useState<string>('landing');

  // Selected entities for full detail views
  const [monitorTab, setMonitorTab] = useState<'alerts' | 'timeline' | 'quality'>('alerts');
  const [mapFocus, setMapFocus] = useState<{ id: string; nonce: number } | null>(null);
  const [selectedContractForDetail, setSelectedContractForDetail] = useState<Contract | null>(null);
  const [selectedLicenseForDetail, setSelectedLicenseForDetail] = useState<{
    license: RemovingLicense;
    contract: Contract;
    felling?: FellingLicense;
  } | null>(null);
  const [selectedDeliveryForDetail, setSelectedDeliveryForDetail] = useState<{
    note: DeliveryNote;
    contract: Contract;
  } | null>(null);
  const [selectedWorkLogForDetail, setSelectedWorkLogForDetail] = useState<{
    log: WorkLog;
    contract: Contract;
  } | null>(null);
  const [selectedContractorForDetail, setSelectedContractorForDetail] = useState<ContractorInfo | null>(null);

  // Modals state
  const [isSurvey123ModalOpen, setIsSurvey123ModalOpen] = useState<boolean>(false);
  const [survey123ContractId, setSurvey123ContractId] = useState<string>(MOCK_CONTRACTS[0].Contract_ID);
  const [csvDownloadFeedback, setCsvDownloadFeedback] = useState<boolean>(false);

  // Contract Builder (New or Edit) Modal State
  const [isContractBuilderOpen, setIsContractBuilderOpen] = useState<boolean>(false);
  const [editingContractForBuilder, setEditingContractForBuilder] = useState<Contract | null>(null);

  // Status Manager Modal State (Contract, Mano, Stand)
  const [isStatusManagerOpen, setIsStatusManagerOpen] = useState<boolean>(false);
  const [statusManagerContract, setStatusManagerContract] = useState<Contract | null>(null);

  // Tab switch handler
  const handleTabChange = (newTab: string) => {
    openLive(null);
    setActiveTab(newTab);
    setSelectedContractForDetail(null);
    setSelectedLicenseForDetail(null);
    setSelectedDeliveryForDetail(null);
    setSelectedWorkLogForDetail(null);
    setSelectedContractorForDetail(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShowOnMap = (c: Contract) => {
    setMapFocus({ id: c.Contract_ID, nonce: Date.now() });
    setActiveTab('map');
    setSelectedContractForDetail(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigation handlers for detail views
  const handleSelectContract = (contract: Contract) => {
    setSelectedContractForDetail(contract);
    setActiveTab('contracts');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectLicense = (
    license: RemovingLicense,
    contract: Contract,
    felling?: FellingLicense
  ) => {
    setSelectedLicenseForDetail({ license, contract, felling });
    setActiveTab('licenses');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectDeliveryNote = (note: DeliveryNote, contract: Contract) => {
    setSelectedDeliveryForDetail({ note, contract });
    setActiveTab('delivery-notes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectWorkLog = (log: WorkLog, contract: Contract) => {
    setSelectedWorkLogForDetail({ log, contract });
    setActiveTab('work-logs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectContractor = (contractor: ContractorInfo) => {
    setSelectedContractorForDetail(contractor);
    setActiveTab('contractors');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Survey123 modal
  const handleOpenSurvey123 = (contractId?: string) => {
    if (contractId) {
      setSurvey123ContractId(contractId);
    } else {
      setSurvey123ContractId(contracts[0].Contract_ID);
    }
    setIsSurvey123ModalOpen(true);
  };

  // Add work log submitted via Survey123
  const handleAddWorkLog = (contractId: string, newLog: WorkLog) => {
    setContracts((prev) =>
      prev.map((c) => {
        if (c.Contract_ID === contractId) {
          const updated = {
            ...c,
            WorkLogs: [newLog, ...c.WorkLogs],
          };
          if (selectedContractForDetail?.Contract_ID === contractId) {
            setSelectedContractForDetail(updated);
          }
          return updated;
        }
        return c;
      })
    );
  };

  // Save/Create/Edit Contract
  const handleSaveContract = (savedContract: Contract) => {
    setContracts((prev) => {
      const exists = prev.some((c) => c.Contract_ID === savedContract.Contract_ID);
      if (exists) {
        return prev.map((c) => (c.Contract_ID === savedContract.Contract_ID ? savedContract : c));
      } else {
        return [savedContract, ...prev];
      }
    });
    if (selectedContractForDetail?.Contract_ID === savedContract.Contract_ID) {
      setSelectedContractForDetail(savedContract);
    }
  };

  // Update Contract Statuses (Contract, Manot, Stands)
  const handleUpdateContractStatuses = (updatedContract: Contract) => {
    setContracts((prev) =>
      prev.map((c) => (c.Contract_ID === updatedContract.Contract_ID ? updatedContract : c))
    );
    if (selectedContractForDetail?.Contract_ID === updatedContract.Contract_ID) {
      setSelectedContractForDetail(updatedContract);
    }
  };

  // CSV Export simulating Experience Builder table export
  const handleExportCsv = () => {
    const headers = [
      'OBJECTID',
      'התקשרות',
      'מספר חוזה',
      'מרחב',
      'אזור',
      'גוש / יער',
      'קבלן מבצע',
      'סטטוס',
      'שנת תקציב',
      'נפח מאושר (מ"ק)',
      'נפח שפונה בפועל (מ"ק)',
      'יתרת מ"ק',
      'אחוז ביצוע (%)',
      'יערן אחראי',
    ];

    const rows = filteredContracts.map((c, index) => [
      index + 1,
      `"${c.Contract_Name.replace(/"/g, '""')}"`,
      `"${c.Contract_Number}"`,
      `"${c.Region}"`,
      `"${c.District}"`,
      `"${c.Block}"`,
      `"${c.Contractor}"`,
      `"${c.Status}"`,
      c.Year,
      c.TotalApprovedMQ,
      c.TotalDeliveredMQ,
      c.BalanceMQ,
      c.ExecutionPercent,
      `"${c.Supervisor}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kkl_forestry_contracts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCsvDownloadFeedback(true);
    setTimeout(() => setCsvDownloadFeedback(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#1e293b] flex flex-row font-['Rubik','Assistant',sans-serif] antialiased">
      {/* 1. Right-Docked Vertical Sidebar Navigation matching Reference Images */}
      <ModernRightSidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenSettings={() => setIsArcadeOpen(true)}
      />

      {/* 2. Main Application Viewport */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Modern Top Header Bar with Iconic Green '+' Action Button */}
        <ModernTopBar
          contracts={filteredContracts}
          totalContractsCount={contracts.length}
          activeFilterCount={activeFilterCount}
          onOpenFilters={() => setIsFiltersOpen(true)}
          onOpenSurvey123={() => handleOpenSurvey123()}
          onExportCsv={handleExportCsv}
          onOpenContractBuilder={() => {
            setEditingContractForBuilder(null);
            setIsContractBuilderOpen(true);
          }}
        />

        {/* Scrollable Content Container */}
        <main className="flex-1 p-5 md:p-8 max-w-[1600px] w-full mx-auto flex flex-col gap-6">
          {liveModel && (
            <ContractPage
              model={liveModel}
              live
              backLabel="חזרה למפה"
              onBack={() => openLive(null)}
              map={<LiveMiniMap where={`OBJECTID = ${liveModel.objectId}`} height={520} title={`מפת התקשרות – ${liveModel.name}`} subtitle="שכבת ההתקשרויות בפורטל · מיקוד אוטומטי" />}
            />
          )}
          <div className={liveModel ? 'hidden' : 'contents'}>
          {/* 1. Landing Page (Overview, Modern KPI cards, Dual Panels, National Map) */}
          {activeTab === 'landing' && (
            <LandingPageView
              contracts={filteredContracts}
              onSelectContract={handleSelectContract}
              onNavigateToTab={handleTabChange}
            />
          )}

          {activeTab === 'map' && (
            <MapPageView contracts={filteredContracts} onSelectContract={handleSelectContract} initialFocus={mapFocus} />
          )}
          {activeTab === 'monitoring' && (
            <MonitoringView contracts={filteredContracts} tab={monitorTab} setTab={setMonitorTab} onOpenContract={handleSelectContract} onShowOnMap={handleShowOnMap} />
          )}
          {activeTab === 'stats' && <StatsView contracts={filteredContracts} />}

          {/* 2. Contracts Page (Table matching Image 2 or Full Detail) */}
          {activeTab === 'contracts' && (
            selectedContractForDetail ? (
              <ContractDetailView
                contract={selectedContractForDetail}
                onBack={() => setSelectedContractForDetail(null)}
                onOpenSurvey123={handleOpenSurvey123}
                onOpenStatusManager={() => {
                  setStatusManagerContract(selectedContractForDetail);
                  setIsStatusManagerOpen(true);
                }}
                onOpenContractEditor={() => {
                  setEditingContractForBuilder(selectedContractForDetail);
                  setIsContractBuilderOpen(true);
                }}
              />
            ) : (
              <AggregatedTableView
                contracts={filteredContracts}
                onSelectContract={handleSelectContract}
                onExportCsv={handleExportCsv}
                onOpenContractBuilder={() => {
                  setEditingContractForBuilder(null);
                  setIsContractBuilderOpen(true);
                }}
              />
            )
          )}

          {/* 3. Licenses Page (List or Full Detail) */}
          {activeTab === 'licenses' && (
            selectedLicenseForDetail ? (
              <LicenseDetailView
                license={selectedLicenseForDetail.license}
                fellingLicense={selectedLicenseForDetail.felling}
                contract={selectedLicenseForDetail.contract}
                onBack={() => setSelectedLicenseForDetail(null)}
                onSelectContract={handleSelectContract}
              />
            ) : (
              <LicensesView
                contracts={filteredContracts}
                onSelectLicense={handleSelectLicense}
              />
            )
          )}

          {/* 4. Delivery Notes Page (List or Full Detail) */}
          {activeTab === 'delivery-notes' && (
            selectedDeliveryForDetail ? (
              <DeliveryNoteDetailView
                note={selectedDeliveryForDetail.note}
                contract={selectedDeliveryForDetail.contract}
                onBack={() => setSelectedDeliveryForDetail(null)}
                onSelectContract={handleSelectContract}
              />
            ) : (
              <DeliveryNotesView
                contracts={filteredContracts}
                onSelectDeliveryNote={handleSelectDeliveryNote}
              />
            )
          )}

          {/* 5. Work Logs Page (List or Full Detail) */}
          {activeTab === 'work-logs' && (
            selectedWorkLogForDetail ? (
              <WorkLogDetailView
                log={selectedWorkLogForDetail.log}
                contract={selectedWorkLogForDetail.contract}
                onBack={() => setSelectedWorkLogForDetail(null)}
                onSelectContract={handleSelectContract}
              />
            ) : (
              <WorkLogsView
                contracts={filteredContracts}
                onSelectWorkLog={handleSelectWorkLog}
                onOpenSurvey123={() => handleOpenSurvey123()}
              />
            )
          )}

          {/* 6. Contractors Page (List or Full Detail) */}
          {activeTab === 'contractors' && (
            selectedContractorForDetail ? (
              <ContractorDetailView
                contractor={selectedContractorForDetail}
                contracts={contracts}
                onBack={() => setSelectedContractorForDetail(null)}
                onSelectContract={handleSelectContract}
              />
            ) : (
              <ContractorsView
                contracts={filteredContracts}
                onSelectContractor={handleSelectContractor}
              />
            )
          )}
                  </div>
        </main>

        {/* Quiet Footer */}
        <footer className="py-4 px-8 text-xs text-slate-400 text-center border-t border-slate-200/50 flex flex-wrap items-center justify-between gap-3">
          <span>קרן קימת לישראל (קק״ל) · מערך ניהול יערני ו-GIS</span>
          <span>{USE_REAL_DATA ? 'נתוני דגימה אמיתיים מהשכבות · שיוך רישיונות ותעודות משלוח להתקשרות משוער (לפי יער/אזור) · פרטים אישיים הוסתרו' : 'נתוני דמו'}</span>
        </footer>
      </div>

      {/* CSV Export Success Toast */}
      {csvDownloadFeedback && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#16a34a] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-sm animate-in slide-in-from-bottom duration-200">
          <Check className="w-5 h-5 text-white" />
          <span>קובץ CSV יוצא בהצלחה ומקודד בעברית (UTF-8)!</span>
        </div>
      )}

      {/* Filters drawer (global dashboard filters) */}
      {isFiltersOpen && (
        <div className="fixed inset-0 z-50 flex justify-start" dir="rtl">
          <div className="absolute inset-0 bg-slate-900/30" onClick={() => setIsFiltersOpen(false)} />
          <div className="relative h-full w-[340px] max-w-[90vw] bg-slate-50 shadow-2xl p-4 overflow-y-auto animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setIsFiltersOpen(false)}
              className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer z-10"
              aria-label="סגור"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="mt-8">
              <ExbSidebarFilters
                filters={filters}
                setFilters={setFilters}
                contracts={contracts}
                onReset={() => setFilters(EMPTY_FILTERS)}
              />
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">
              מוצגות {filteredContracts.length} מתוך {contracts.length} התקשרויות
            </p>
          </div>
        </div>
      )}

      {/* Modal: Arcade expressions for Experience Builder */}
      <ConnectionModal />
      <ArcadeExpressionsModal
        isOpen={isArcadeOpen}
        onClose={() => setIsArcadeOpen(false)}
        contracts={contracts}
      />

      {/* Modal: Survey123 Field Form */}
      <Survey123Modal
        isOpen={isSurvey123ModalOpen}
        onClose={() => setIsSurvey123ModalOpen(false)}
        contracts={contracts}
        defaultContractId={survey123ContractId}
        onAddWorkLog={handleAddWorkLog}
      />

      {/* Modal: Contract Builder (New or Edit) with Manot & Stands Environment */}
      {isContractBuilderOpen && <ContractWorkspace
        key={editingContractForBuilder?.Contract_ID || 'new'}
        contracts={contracts}
        isOpen={isContractBuilderOpen}
        onClose={() => {
          setIsContractBuilderOpen(false);
          setEditingContractForBuilder(null);
        }}
        onSaveContract={handleSaveContract}
        existingContract={editingContractForBuilder}
      />}

      {/* Modal: Forestry Status Manager (Contract, Mano, Stand) */}
      {statusManagerContract && (
        <StatusWorkspace
          isOpen={isStatusManagerOpen}
          onClose={() => {
            setIsStatusManagerOpen(false);
            setStatusManagerContract(null);
          }}
          contract={statusManagerContract}
          onUpdateContractStatus={handleUpdateContractStatuses}
        />
      )}
    </div>
  );
}
