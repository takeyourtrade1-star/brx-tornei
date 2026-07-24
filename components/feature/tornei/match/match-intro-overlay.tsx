'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Swords } from 'lucide-react';
import type { Participant } from '@/types/tournament';
import { pickStartingPlayer } from '@/lib/match-starting-player';
import { cn } from '@/lib/utils';

type IntroPhase = 'idle' | 'countdown' | 'draw' | 'winner' | 'done';

interface MatchIntroOverlayProps {
  active: boolean;
  matchId?: string;
  players: [Participant, Participant];
  remainingSeconds: number | null;
}

export function MatchIntroOverlay({
  active,
  matchId,
  players,
  remainingSeconds,
}: MatchIntroOverlayProps) {
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
    if (!active || !matchId) {
      setPhase('idle');
      return;
    }
    const storageKey = `match-intro:${matchId}`;
    if (window.sessionStorage.getItem(storageKey)) {
      setPhase('done');
      return;
    }
    if (remainingSeconds === null) return;
    if (remainingSeconds > 0) {
      setPhase('countdown');
      return;
    }
    setPhase((current) =>
      current === 'idle' || current === 'countdown' ? 'draw' : current,
    );
  }, [active, matchId, remainingSeconds]);

  useEffect(() => {
    if (phase !== 'draw') return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setPhase('winner'), reducedMotion ? 450 : 1_100);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'winner' || !matchId) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem(`match-intro:${matchId}`, 'seen');
      setPhase('done');
    }, reducedMotion ? 700 : 1_600);
    return () => window.clearTimeout(timer);
  }, [matchId, phase]);

  useEffect(() => {
    if (phase !== 'draw') return;
    const interval = window.setInterval(() => setDrawIndex((current) => (current + 1) % 2), 110);
    return () => window.clearInterval(interval);
  }, [phase]);

  if (!mounted || phase === 'idle' || phase === 'done') return null;

  const drawingName = stablePlayers[drawIndex]?.username ?? starter.username;
  return createPortal(
    <div className="fixed inset-0 z-[1300] grid place-items-center overflow-hidden bg-stone-950 text-white">
      <div className="match-intro-radial absolute inset-0" aria-hidden />
      <div className="match-intro-grid absolute inset-0 opacity-30" aria-hidden />
      <div className="relative z-10 flex max-w-3xl flex-col items-center px-6 text-center" role="status" aria-live="polite">
        <div className="match-intro-emblem grid h-28 w-28 place-items-center rounded-full border border-primary/50 bg-primary/10 shadow-[0_0_80px_rgba(255,115,0,0.35)] sm:h-36 sm:w-36">
          {phase === 'countdown' ? (
            <span className="font-display text-6xl font-black tabular-nums text-white sm:text-8xl">
              {remainingSeconds}
            </span>
          ) : phase === 'winner' ? (
            <Sparkles className="h-14 w-14 text-primary sm:h-20 sm:w-20" />
          ) : (
            <Swords className="h-14 w-14 text-primary sm:h-20 sm:w-20" />
          )}
        </div>
        <p className="mt-8 text-xs font-black uppercase tracking-[0.35em] text-primary sm:text-sm">
          {phase === 'countdown'
            ? 'Entrambi pronti'
            : phase === 'draw'
              ? 'Sorteggio'
              : 'Prima mossa'}
        </p>
        <h2
          className={cn(
            'mt-3 font-display text-4xl font-black uppercase leading-none sm:text-7xl',
            phase === 'winner' ? 'match-intro-winner' : 'match-intro-title',
          )}
        >
          {phase === 'countdown'
            ? 'La partita inizia tra'
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
