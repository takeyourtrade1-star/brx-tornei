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

  const leave = () => {
    const message =
      tournament.status === 'iniziata'
        ? 'Vuoi abbandonare la partita? La partita verrà chiusa per entrambi.'
        : 'Vuoi alzarti dal tavolo?';
    if (!window.confirm(message)) return;
    startTransition(async () => {
      const result = await leaveTournamentAction(tournament.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      await onLeaveSuccess?.();
      router.push('/tornei');
      router.refresh();
    });
  };

  return { error, leaving, leave };
}
