'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { leaveTournamentAction } from '@/actions/tournaments';
import { clearActiveMatch } from '@/lib/active-match-storage';
import type { Tournament } from '@/types/tournament';

interface MatchExitFlowOptions {
  tournamentId: string;
  tournamentStatus: Tournament['status'];
  tableFull: boolean;
  matchEnded: boolean;
  resultClaimPending: boolean;
}

export function useMatchExitFlow(options: MatchExitFlowOptions) {
  const { tournamentId, tournamentStatus, tableFull, matchEnded, resultClaimPending } = options;
  const router = useRouter();
  const [opponentDeclined, setOpponentDeclined] = useState(false);
  const [exitFired, setExitFired] = useState(false);
  const [declinedLeftSeconds, setDeclinedLeftSeconds] = useState(5);
  const exitFiredRef = useRef(false);
  const wasFullRef = useRef(tableFull);

  const exitTable = useCallback(async () => {
    const result = await leaveTournamentAction(tournamentId);
    clearActiveMatch(tournamentId);
    if (result.error) {
      router.refresh();
      return;
    }
    router.replace('/tornei');
    router.refresh();
  }, [router, tournamentId]);

  const fireExit = useCallback(() => {
    if (exitFiredRef.current) return;
    exitFiredRef.current = true;
    setExitFired(true);
    void exitTable();
  }, [exitTable]);

  useEffect(() => {
    const wasFull = wasFullRef.current;
    wasFullRef.current = tableFull;
    if (tournamentStatus !== 'in_registrazione' || matchEnded || resultClaimPending) return;
    if (wasFull && !tableFull) setOpponentDeclined(true);
  }, [matchEnded, resultClaimPending, tableFull, tournamentStatus]);

  useEffect(() => {
    if (!opponentDeclined) return;
    setDeclinedLeftSeconds(5);
    const interval = window.setInterval(() => {
      setDeclinedLeftSeconds((seconds) => {
        if (seconds > 1) return seconds - 1;
        window.clearInterval(interval);
        fireExit();
        return 0;
      });
    }, 1_000);
    return () => window.clearInterval(interval);
  }, [fireExit, opponentDeclined]);

  return {
    opponentDeclined,
    exitFired,
    declinedLeftSeconds,
    fireExit,
    markOpponentDeclined: () => setOpponentDeclined(true),
  };
}
