'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { declareResultAction } from '@/actions/matches';
import type { Tournament } from '@/types/tournament';

/** "Chi ha vinto?" (Requisito 2): dichiara se stessi o l'avversario come
 * vincitore. Lo stato risultante (claimed/settled) arriva dal prossimo poll
 * del contratto torneo — qui basta un router.refresh() dopo l'azione. */
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
        return;
      }
      router.refresh();
    });
  };

  return { error, declaring, declare };
}
