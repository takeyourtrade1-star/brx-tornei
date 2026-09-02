'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { TournamentStatus } from '@/types/tournament';

interface MatchTournamentRefreshOptions {
  status: TournamentStatus;
  tableFull: boolean;
  peerLeft: boolean;
  /** Una scadenza o una proposta risultato è attiva: stringe il poll fallback. */
  graceCountdownActive?: boolean;
}

/** Aggiorna lo stato autorevole del match senza interpretare un crash come uscita. */
export function useMatchTournamentRefresh({
  status,
  tableFull,
  peerLeft,
  graceCountdownActive = false,
}: MatchTournamentRefreshOptions) {
  const router = useRouter();

  useEffect(() => {
    if (status === 'terminata') return;
    // Il canale WebSocket realtime copre la reattività immediata; il polling è
    // solo fallback. Sotto i 3s il refresh RSC satura da solo i bucket di
    // rate limit dell'API Auth (60/min per IP condiviso) e di quella Tornei
    // (120 read/min per utente), trasformando un 429 in falso logout o in
    // crash della pagina live.
    const intervalMs =
      status === 'in_registrazione'
        ? (tableFull ? 3_000 : 5_000)
        : graceCountdownActive ? 4_000 : 5_000;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [status, tableFull, graceCountdownActive, router]);

  useEffect(() => {
    if (!peerLeft) return;
    router.refresh();
    const timer = window.setTimeout(() => router.refresh(), 1_500);
    return () => window.clearTimeout(timer);
  }, [peerLeft, router]);
}
