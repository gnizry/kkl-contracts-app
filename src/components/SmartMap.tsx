import React from 'react';
import { useConnection } from '../connection';
import { useLiveMatch } from '../liveHooks';
import { GisMiniMap, GisMiniMapProps } from './GisMiniMap';
import { LiveMiniMap } from './LiveMiniMap';
import { LiveMapPanel } from './LiveMapPanel';

const H: Record<string, number> = { 'h-64': 256, 'h-72': 288, 'h-80': 320, 'h-96': 384 };

/** מפה קטנה: חיה מהפורטל כשמחוברים (לפי שמות ההתקשרויות), אחרת מפת הדמו */
export const SmartMiniMap: React.FC<GisMiniMapProps & { names?: string[]; height?: number }> = ({ names = [], height, ...mini }) => {
  const { status } = useConnection();
  const m = useLiveMatch(names);
  if (status !== 'connected') return <GisMiniMap {...mini} />;
  const h = height ?? H[mini.heightClass || 'h-72'] ?? 288;
  const ids = m.attrs.map((a) => a.OBJECTID).filter((x) => x !== undefined && x !== null);
  if (m.phase === 'found' && ids.length) {
    return <LiveMiniMap where={`OBJECTID IN (${ids.join(',')})`} height={h} title={mini.title} subtitle={mini.subtitle} note={`מוצגת ${ids.length === 1 ? 'התקשרות תואמת' : `${ids.length} התקשרויות תואמות`} מהפורטל`} />;
  }
  if (m.phase === 'loading' || m.phase === 'idle') return <LiveMiniMap where="1=0" height={h} title={mini.title} subtitle={mini.subtitle} />;
  return <LiveMiniMap where="STStageStatus = 'בביצוע'" height={h} title={mini.title} subtitle={mini.subtitle} note="לא נמצאה התקשרות תואמת בשם בפורטל – מוצגת מפה ארצית (בביצוע)" />;
};

/** מפה ארצית: חיה מהפורטל כשמחוברים, אחרת הרכיב שהועבר כילד */
export const SmartNationalMap: React.FC<{ children: React.ReactNode; height?: number }> = ({ children, height = 560 }) => {
  const { status } = useConnection();
  if (status !== 'connected') return <>{children}</>;
  return <LiveMapPanel height={height} compact />;
};
