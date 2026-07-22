'use client';

import { useEffect } from 'react';
import { clearActiveMatch, saveActiveMatch } from '@/lib/active-match-storage';

interface ActiveMatchReferenceOptions {
  isPlayer: boolean;
  matchEnded: boolean;
  started: boolean;
  tournamentId: string;
  opponent: string;
}

/** Mantiene aggiornato il riferimento usato dal banner “Torna alla partita”. */
export function useActiveMatchReference({
  isPlayer,
  matchEnded,
  started,
  tournamentId,
  opponent,
}: ActiveMatchReferenceOptions) {
  useEffect(() => {
    if (!isPlayer) return;
    if (matchEnded) clearActiveMatch(tournamentId);
    else if (started) saveActiveMatch({ tournamentId, opponent });
  }, [isPlayer, matchEnded, opponent, started, tournamentId]);
}
