import { RemovingLicense } from '../types/forestry';

/**
 * Low-balance alert: removing license with a remaining balance under 40 m3.
 * Historical licenses (marked "לא בתוקף") are not alerted - nothing can be removed on them anyway.
 */
export const isLowBalance = (rl: Pick<RemovingLicense, 'BalanceMQ' | 'Status'>): boolean =>
  rl.BalanceMQ > 0 && rl.BalanceMQ < 40 && !rl.Status.startsWith('לא בתוקף');
