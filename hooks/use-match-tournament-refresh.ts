'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { TournamentStatus } from '@/types/tournament';

interface MatchTournamentRefreshOptions {
  status: TournamentStatus;
  tableFull: boolean;
  peerLeft: boolean;
}

/** Aggiorna lo stato autorevole del match senza interpretare un crash come uscita. */
export function useMatchTournamentRefresh({
  status,
  tableFull,
  peerLeft,
}: MatchTournamentRefreshOptions) {
  const router = useRouter();

  useEffect(() => {
    if (status === 'terminata') return;
    const intervalMs = status === 'in_registrazione' ? (tableFull ? 1_000 : 5_000) : 12_000;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [status, tableFull, router]);

  useEffect(() => {
    if (!peerLeft) return;
    router.refresh();
    const timer = window.setTimeout(() => router.refresh(), 1_500);
    return () => window.clearTimeout(timer);
  }, [peerLeft, router]);
}
