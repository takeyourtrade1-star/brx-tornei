'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createTournamentFromGameAction,
  joinTournamentAction,
} from '@/actions/tournaments';
import type { Tournament } from '@/types/tournament';

export type PendingLiveAction =
  | { kind: 'join'; tournamentId: string }
  | { kind: 'webcam-after-create'; tournamentId: string; webcamSessionId?: string }
  | { kind: 'create-from-game'; tournament: Tournament };

export function useTournamentLiveFlow(tournaments: Tournament[]) {
  const router = useRouter();
  const [pending, setPending] = useState<PendingLiveAction | null>(null);
  const [joinDeckTournament, setJoinDeckTournament] = useState<Tournament | null>(null);
  const [requestSent, setRequestSent] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const goLive = useCallback(
    (tournamentId: string, role: 'player' | 'observer' = 'player') => {
      const q = role === 'observer' ? '?role=observer' : '';
      router.push(`/tornei/${tournamentId}/live${q}`);
    },
    [router],
  );

  const handleTournamentCreated = useCallback(
    (result: { createdId: string; webcamSessionId?: string }) => {
      setPending({
        kind: 'webcam-after-create',
        tournamentId: result.createdId,
        webcamSessionId: result.webcamSessionId,
      });
    },
    [],
  );

  const handleCreateFromGame = useCallback((tournament: Tournament) => {
    setPending({ kind: 'create-from-game', tournament });
  }, []);

  const handleJoinTournament = useCallback(
    (id: string) => {
      const t = tournaments.find((x) => x.id === id);
      if (!t) return;
      setJoinDeckTournament(t);
    },
    [tournaments],
  );

  const handleDeckJoinComplete = useCallback(
    (result: { matchId?: string }) => {
      const t = joinDeckTournament;
      setJoinDeckTournament(null);
      if (!t) return;
      router.refresh();
      if (result.matchId) {
        goLive(t.id);
      } else if (t.isPrivate) {
        setRequestSent(t.format.replace('-', ' '));
      } else {
        setPending({ kind: 'join', tournamentId: t.id });
      }
    },
    [joinDeckTournament, goLive, router],
  );

  const handleObserveTournament = useCallback(
    (id: string) => goLive(id, 'observer'),
    [goLive],
  );

  const confirmPending = useCallback(() => {
    if (!pending) return;

    if (pending.kind === 'webcam-after-create') {
      setPending(null);
      goLive(pending.tournamentId);
      return;
    }

    if (pending.kind === 'join') {
      setPending(null);
      goLive(pending.tournamentId);
      return;
    }

    startTransition(async () => {
      if (pending.kind === 'create-from-game') {
        const result = await createTournamentFromGameAction(pending.tournament);
        setPending(null);
        if (result.error) return;
        router.refresh();
        goLive(pending.tournament.id);
      }
    });
  }, [pending, goLive, router]);

  const skipWebcam = useCallback(() => {
    if (!pending) return;
    if (pending.kind === 'webcam-after-create') {
      setPending(null);
      goLive(pending.tournamentId);
      return;
    }
    if (pending.kind === 'create-from-game') {
      startTransition(async () => {
        await createTournamentFromGameAction(pending.tournament);
        setPending(null);
        router.refresh();
        goLive(pending.tournament.id);
      });
    }
  }, [pending, goLive, router]);

  const cancelPending = useCallback(() => setPending(null), []);
  const closeRequestSent = useCallback(() => setRequestSent(null), []);
  const closeJoinDeckModal = useCallback(() => setJoinDeckTournament(null), []);

  const webcamOpen = pending !== null;
  const confirmLabel =
    pending?.kind === 'join'
      ? 'Continua'
      : pending?.kind === 'create-from-game'
        ? 'Crea Torneo'
        : 'Vai alla partita';
  const externalSessionId =
    pending?.kind === 'webcam-after-create' ? pending.webcamSessionId : undefined;
  const showSkip =
    pending?.kind === 'webcam-after-create' || pending?.kind === 'create-from-game';

  return {
    pending,
    joinDeckTournament,
    requestSent,
    busy,
    webcamOpen,
    confirmLabel,
    externalSessionId,
    showSkip,
    handleTournamentCreated,
    handleCreateFromGame,
    handleJoinTournament,
    handleObserveTournament,
    handleDeckJoinComplete,
    confirmPending,
    skipWebcam,
    cancelPending,
    closeRequestSent,
    closeJoinDeckModal,
  };
}
