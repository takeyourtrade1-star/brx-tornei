'use client';

import { useEffect, useRef, useState } from 'react';
import type { Tournament } from '@/types/tournament';
import { advanceMatch, initMatch, type MatchState } from './match-simulation';

/**
 * Tiene viva la simulazione (mock) della partita: inizializza lo stato dal
 * torneo e lo fa avanzare a intervalli regolari finché `active` è true.
 * `active` consente di mettere in pausa il tick (es. modale chiuso ma PiP
 * ancora vivo continua, modale e PiP chiusi → stop).
 */
export function useMatchSimulation(
  tournament: Tournament | null,
  me: string | undefined,
  active: boolean,
  intervalMs = 2200,
): MatchState | null {
  const [state, setState] = useState<MatchState | null>(null);
  const idRef = useRef<string | null>(null);

  // (re)inizializza quando cambia il torneo osservato
  useEffect(() => {
    if (!tournament) {
      setState(null);
      idRef.current = null;
      return;
    }
    if (idRef.current !== tournament.id) {
      idRef.current = tournament.id;
      setState(initMatch(tournament, me));
    }
  }, [tournament, me]);

  // tick di avanzamento
  useEffect(() => {
    if (!active || !tournament) return;
    const t = setInterval(() => {
      setState((prev) => (prev ? advanceMatch(prev) : prev));
    }, intervalMs);
    return () => clearInterval(t);
  }, [active, tournament, intervalMs]);

  return state;
}
