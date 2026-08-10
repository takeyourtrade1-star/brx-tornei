'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { declareResultAction } from '@/actions/matches';
import type { Tournament } from '@/types/tournament';

/** "Chi ha vinto?": propone se stessi o l'avversario. Il backend registra
 * l'esito solo quando l'altro giocatore indica lo stesso vincitore. */
export function useDeclareResult(tournament: Tournament, userId: string, opponentId: string) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [declaring, startTransition] = useTransition();

  const declare = (iWon: boolean) => {
    const matchId = tournament.matchId;
    if (!matchId) return;
    setError(null);
    startTransition(async () => {
      const res = await declareResultAction(matchId, iWon ? userId : opponentId);
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
