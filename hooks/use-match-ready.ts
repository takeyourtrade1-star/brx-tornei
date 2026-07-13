'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { readyTournamentAction } from '@/actions/tournaments';
import type { Tournament } from '@/types/tournament';

export function useMatchReady(tournament: Tournament, userId: string) {
  const router = useRouter();
  const tableFull = tournament.participants.length >= tournament.maxPlayers;
  const readyPhase = tournament.status === 'in_registrazione' && tableFull;
  const myReady = tournament.participants.find((participant) => participant.id === userId)?.ready ?? false;
  const opponentReady =
    tournament.participants.find((participant) => participant.id !== userId)?.ready ?? false;
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggleReady = () => {
    setError(null);
    startTransition(async () => {
      const result = await readyTournamentAction(tournament.id, !myReady);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return { tableFull, readyPhase, myReady, opponentReady, error, pending, toggleReady };
}
