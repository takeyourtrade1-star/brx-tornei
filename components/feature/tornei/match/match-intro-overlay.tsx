'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Swords } from 'lucide-react';
import type { Participant } from '@/types/tournament';
import { pickStartingPlayer } from '@/lib/match-starting-player';
import { cn } from '@/lib/utils';

type IntroPhase = 'idle' | 'clash' | 'draw' | 'winner' | 'done';

interface MatchIntroOverlayProps {
  active: boolean;
  matchId?: string;
  players: [Participant, Participant];
}

export function MatchIntroOverlay({ active, matchId, players }: MatchIntroOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<IntroPhase>('idle');
  const [drawIndex, setDrawIndex] = useState(0);
  const stablePlayers = useMemo(
    () => [...players].sort((a, b) => a.id.localeCompare(b.id)) as [Participant, Participant],
    [players],
  );
  const starter = useMemo(
    () => pickStartingPlayer(matchId ?? 'match', stablePlayers),
    [matchId, stablePlayers],
  );

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!active || !matchId) return;
    const storageKey = `match-intro:${matchId}`;
    if (window.sessionStorage.getItem(storageKey)) {
      setPhase('done');
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const times = reducedMotion ? [450, 900, 1650] : [1600, 3400, 5300];
    setPhase('clash');
    const drawTimer = window.setTimeout(() => setPhase('draw'), times[0]);
    const winnerTimer = window.setTimeout(() => setPhase('winner'), times[1]);
    const closeTimer = window.setTimeout(() => {
      window.sessionStorage.setItem(storageKey, 'seen');
      setPhase('done');
    }, times[2]);
    return () => {
      window.clearTimeout(drawTimer);
      window.clearTimeout(winnerTimer);
      window.clearTimeout(closeTimer);
    };
  }, [active, matchId]);

  useEffect(() => {
    if (phase !== 'draw') return;
    const interval = window.setInterval(() => setDrawIndex((current) => (current + 1) % 2), 110);
    return () => window.clearInterval(interval);
  }, [phase]);

  if (!mounted || phase === 'idle' || phase === 'done') return null;

  const drawingName = stablePlayers[drawIndex]?.username ?? starter.username;
  return createPortal(
    <div className="fixed inset-0 z-[1300] grid place-items-center overflow-hidden bg-header-bg text-white">
      <div className="match-intro-radial absolute inset-0" aria-hidden />
      <div className="match-intro-grid absolute inset-0 opacity-30" aria-hidden />
      <div className="relative z-10 flex max-w-3xl flex-col items-center px-6 text-center" role="status" aria-live="polite">
        <div className="match-intro-emblem grid h-28 w-28 place-items-center rounded-full border border-primary/50 bg-primary/10 shadow-[0_0_80px_rgba(255,115,0,0.35)] sm:h-36 sm:w-36">
          {phase === 'winner' ? (
            <Sparkles className="h-14 w-14 text-primary sm:h-20 sm:w-20" />
          ) : (
            <Swords className="h-14 w-14 text-primary sm:h-20 sm:w-20" />
          )}
        </div>
        <p className="mt-8 text-xs font-black uppercase tracking-[0.35em] text-primary sm:text-sm">
          {phase === 'clash' ? 'Preparati alla sfida' : phase === 'draw' ? 'Sorteggio' : 'Prima mossa'}
        </p>
        <h2
          className={cn(
            'mt-3 font-display text-4xl font-black uppercase leading-none sm:text-7xl',
            phase === 'winner' ? 'match-intro-winner' : 'match-intro-title',
          )}
        >
          {phase === 'clash'
            ? 'Che la partita abbia inizio'
            : phase === 'draw'
              ? drawingName
              : starter.username}
        </h2>
        {phase === 'winner' && (
          <p className="match-intro-winner mt-4 text-lg font-black uppercase tracking-[0.2em] text-white/80 sm:text-2xl">
            inizia la partita
          </p>
        )}
        <div className="mt-8 h-1 w-52 overflow-hidden rounded-full bg-white/10">
          <div className="match-intro-progress h-full rounded-full bg-gradient-to-r from-primary to-orange-400" />
        </div>
      </div>
    </div>,
    document.body,
  );
}
