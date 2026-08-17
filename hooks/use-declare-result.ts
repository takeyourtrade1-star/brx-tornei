'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { declareResultAction } from '@/actions/matches';
import type { Tournament } from '@/types/tournament';

const WINS_NEEDED: Record<Tournament['bestOf'], number> = { BO1: 1, BO3: 2, BO5: 3 };

/** "Chi ha vinto?": propone se stessi o l'avversario. Il backend registra
 * l'esito solo quando l'altro giocatore indica lo stesso vincitore. */
export function useDeclareResult(tournament: Tournament, userId: string, opponentId: string) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [declaring, startTransition] = useTransition();

  const declare = (iWon: boolean, loserScore: number) => {
    const matchId = tournament.matchId;
    if (!matchId) return;
    const winnerScore = WINS_NEEDED[tournament.bestOf];
    if (!Number.isInteger(loserScore) || loserScore < 0 || loserScore >= winnerScore) return;
    setError(null);
    startTransition(async () => {
      const res = await declareResultAction(
        matchId,
        iWon ? userId : opponentId,
        winnerScore,
        loserScore,
      );
      if (res.error) {
        setError(res.error);
        if (res.errorCode === 'RESULT_RESELECT_REQUIRED') router.refresh();
        return;
      }
      router.refresh();
    });
  };

  return { error, declaring, declare };
}
