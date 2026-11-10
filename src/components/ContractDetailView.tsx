import React, { useMemo } from 'react';
import { Contract } from '../types/forestry';
import { useConnection } from '../connection';
import { useLiveContractModel } from '../liveHooks';
import { mockContractToModel } from '../utils/popupModel';
import { ContractPage } from './ContractPage';
import { SmartMiniMap } from './SmartMap';
import { LiveMiniMap } from './LiveMiniMap';

interface ContractDetailViewProps {
  contract: Contract;
  onBack: () => void;
  onOpenSurvey123: (contractId: string) => void;
  onOpenStatusManager?: () => void;
  onOpenContractEditor?: () => void;
}

export const ContractDetailView: React.FC<ContractDetailViewProps> = ({ contract, onBack, onOpenSurvey123, onOpenStatusManager, onOpenContractEditor }) => {
  const { status } = useConnection();
  const connected = status === 'connected';
  const liveRes = useLiveContractModel(connected ? contract.Contract_Name : '');
  const mock = useMemo(() => mockContractToModel(contract), [contract]);

  const useLive = connected && liveRes.model;
  const model = useLive ? liveRes.model! : mock;
  const notice = connected
    ? liveRes.loading ? 'מחפש את ההתקשרות בפורטל…'
      : liveRes.err ? `שגיאה בשליפת נתונים חיים: ${liveRes.err}`
      : !liveRes.model ? 'לא נמצאה בפורטל התקשרות בשם זהה – מוצגים נתוני הדמו.' : undefined
    : undefined;

  const map = useLive
    ? <LiveMiniMap where={`OBJECTID = ${model.objectId}`} height={520} title={`מפת התקשרות – ${model.name}`} subtitle="שכבת ההתקשרויות בפורטל · מיקוד אוטומטי" />
    : <SmartMiniMap names={[contract.Contract_Name]} heightClass="h-96" height={520} type="contract" title={`מפת עומדים - ${contract.Block}`} subtitle="חלוקת חלקות יער וגבולות עבודה" locationName={`${contract.Block} (${contract.Region})`} coordinates={contract.Coordinates} />;

  return (
    <ContractPage
      model={model}
      live={!!useLive}
      map={map}
      notice={notice}
      onBack={onBack}
      onOpenSurvey123={() => onOpenSurvey123(contract.Contract_ID)}
      onOpenStatusManager={onOpenStatusManager}
      onOpenContractEditor={onOpenContractEditor}
    />
  );
};
