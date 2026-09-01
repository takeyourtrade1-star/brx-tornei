'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Tournament } from '@/types/tournament';
import { findMyTables } from '@/lib/lobby';
import { mergeTournamentWithHint } from '@/lib/tournament-coordination';
import { useSynchronizedPhase } from '@/hooks/use-synchronized-phase';
import { useTournamentRealtimeRefresh } from '@/hooks/use-tournament-realtime-refresh';

export type ApprovalPhase = 'accepting' | 'declined' | null;

interface LobbyAcceptanceOptions {
  tournaments: Tournament[];
  userId: string;
  /** Snapshot confermato dall'ultima mutazione: anticipa il refresh RSC. */
  actionTournament: Tournament | null;
  /** Navigazione verso il live, già deduplicata dal chiamante. */
  goLiveTo: (id: string) => void;
  /** Chiude le modali di seduta quando si apre l'accettazione. */
  onApprovalOpen: () => void;
}

/**
 * Coordinatore del tavolo seguito in lobby: unisce snapshot RSC, risposta
 * delle azioni ed eventi realtime in un'unica timeline di fase, e gestisce
 * l'apertura sincronizzata del modale di accettazione.
 */
export function useLobbyAcceptance({
  tournaments,
  userId,
  actionTournament,
  goLiveTo,
  onApprovalOpen,
}: LobbyAcceptanceOptions) {
  const monitoredTable = useMemo(
    () => findMyTables(tournaments, userId).find((table) => table.status === 'in_registrazione'),
    [tournaments, userId],
  );
  const realtimeHint = useTournamentRealtimeRefresh({
    tournamentId: actionTournament?.id ?? monitoredTable?.id,
    active: Boolean(actionTournament ?? monitoredTable),
  });
  const trackedTournament = useMemo(() => {
    const trackedId = actionTournament?.id ?? monitoredTable?.id;
    if (!trackedId) return null;
    const listed = tournaments.find((tournament) => tournament.id === trackedId);
    if (!listed || !actionTournament || actionTournament.id !== trackedId) {
      return listed ?? actionTournament ?? null;
    }
    // La risposta della mutazione può arrivare prima del refresh RSC: vince
    // lo snapshot con updatedAt più recente finché il polling non allinea.
    return Date.parse(actionTournament.updatedAt) >= Date.parse(listed.updatedAt)
      ? actionTournament
      : listed;
  }, [actionTournament, monitoredTable, tournaments]);

  const coordinatedTournament = useMemo(
    () => (trackedTournament ? mergeTournamentWithHint(trackedTournament, realtimeHint) : null),
    [realtimeHint, trackedTournament],
  );

  // L'evento "starting" porta già il match id: si naviga subito verso il live
  // senza aspettare il refresh dell'intera pagina (include dati secondari).
  useEffect(() => {
    if (
      !realtimeHint ||
      !realtimeHint.matchId ||
      (realtimeHint.phase !== 'starting' && realtimeHint.phase !== 'live')
    ) return;
    goLiveTo(realtimeHint.tournamentId);
  }, [goLiveTo, realtimeHint]);

  // Accettazione stile LoL: tavolo pieno e partita non ancora iniziata.
  const approvalTarget = useMemo(() => {
    const target = coordinatedTournament;
    if (!target || target.status !== 'in_registrazione') return null;
    if (target.phase && target.phase !== 'accepting') return null;
    if (target.participants.length < target.maxPlayers) return null;
    return target;
  }, [coordinatedTournament]);
  const acceptanceGate = useSynchronizedPhase({
    active: approvalTarget !== null,
    startsAt: approvalTarget?.acceptanceOpensAt,
    serverTime: approvalTarget?.serverTime,
  });

  // L'id resta disponibile anche quando il tavolo torna a un solo giocatore
  // (fase "declined"): il leave automatico ne ha ancora bisogno.
  const [approvalPhase, setApprovalPhase] = useState<ApprovalPhase>(null);
  const [approvalId, setApprovalId] = useState<string | null>(null);
  useEffect(() => {
    if (approvalTarget) setApprovalId(approvalTarget.id);
  }, [approvalTarget]);

  // Latch del pannello: una volta "declined" resta visibile (auto-leave
  // incluso) anche se il target derivato sparisce ai refresh successivi.
  const wasFullRef = useRef(false);
  useEffect(() => {
    const status = coordinatedTournament?.status;
    const phase = coordinatedTournament?.phase;
    const isFull = Boolean(
      coordinatedTournament &&
      status === 'in_registrazione' &&
      (!phase || phase === 'accepting') &&
      coordinatedTournament.participants.length >= coordinatedTournament.maxPlayers,
    );
    const acceptanceOpen = isFull && acceptanceGate.visible;
    const wasFull = wasFullRef.current;
    if (isFull) wasFullRef.current = true;
    if (status === 'iniziata' || (phase && phase !== 'accepting')) wasFullRef.current = false;

    setApprovalPhase((current) => {
      if (current !== 'accepting' && current !== 'declined' && acceptanceOpen && status === 'in_registrazione') {
        // Tavolo pieno: chiudo eventuali modali di seduta e apro l'accept.
        onApprovalOpen();
        return 'accepting';
      }
      // Tavolo tornato a un solo giocatore mentre ero in attesa di accettare:
      // l'avversario ha rifiutato (o è sparito) → pannello dedicato.
      if (current === 'accepting' && wasFull && !isFull && status === 'in_registrazione') {
        return 'declined';
      }
      // Match partito o nessun tavolo: il pannello si chiude.
      if (
        current === 'accepting' &&
        (!isFull || status !== 'in_registrazione' || (phase && phase !== 'accepting'))
      ) return null;
      return current;
    });
  }, [acceptanceGate.visible, coordinatedTournament, onApprovalOpen]);

  const myReady = Boolean(
    approvalTarget?.participants.find((participant) => participant.id === userId)?.ready,
  );
  const opponentReady = Boolean(
    approvalTarget?.participants.find((participant) => participant.id !== userId)?.ready,
  );

  return {
    monitoredTable,
    trackedTournament,
    coordinatedTournament,
    approvalPhase,
    setApprovalPhase,
    approvalTarget,
    approvalId,
    myReady,
    opponentReady,
  };
}
