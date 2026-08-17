'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { leaveTournamentAction } from '@/actions/tournaments';
import type { Tournament } from '@/types/tournament';

export function useLeaveMatch(
  tournament: Tournament,
  onLeaveSuccess?: () => Promise<void> | void,
) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [leaving, startTransition] = useTransition();

  const leave = (confirmedForfeit = false) => {
    if (tournament.status === 'iniziata' && !confirmedForfeit) return;
    if (tournament.status !== 'iniziata' && !window.confirm('Vuoi alzarti dal tavolo?')) return;
    startTransition(async () => {
      const result = await leaveTournamentAction(tournament.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      await onLeaveSuccess?.();
      if (tournament.status === 'iniziata') {
        router.refresh();
        return;
      }
      router.push('/tornei');
      router.refresh();
    });
  };

  return { error, leaving, leave };
}
