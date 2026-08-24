'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
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
  const autoReadyFor = useRef<string | null>(null);

  const toggleReady = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const result = await readyTournamentAction(tournament.id, !myReady);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }, [tournament.id, myReady, router]);

  // Sfida tra amici: accettare l'invito è già il consenso. Il match parte
  // solo quando entrambi sono sulla pagina live e questo ready scatta.
  useEffect(() => {
    if (!readyPhase || myReady || pending || error) return;
    if (!tournament.withFriend || !tournament.isPrivate) return;
    if (autoReadyFor.current === tournament.id) return;
    autoReadyFor.current = tournament.id;
    toggleReady();
  }, [
    readyPhase,
    myReady,
    pending,
    error,
    tournament.withFriend,
    tournament.isPrivate,
    tournament.id,
    toggleReady,
  ]);

  return { tableFull, readyPhase, myReady, opponentReady, error, pending, toggleReady };
}
