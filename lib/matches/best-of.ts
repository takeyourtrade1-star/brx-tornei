import type { BestOf } from '@/types/tournament';

/** Games necessari per vincere la partita. */
export function gamesToWin(bestOf: BestOf): number {
  if (bestOf === 'BO1') return 1;
  if (bestOf === 'BO3') return 2;
  return 3;
}

export const BEST_OF_LABEL = { BO1: 'BO1', BO3: 'BO3', BO5: 'BO5' } as const;
