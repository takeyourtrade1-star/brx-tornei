'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Sparkles, Swords } from 'lucide-react';
import type { Participant } from '@/types/tournament';
import {
  hasSeenMatchIntro,
  markMatchIntroSeen,
  pickStartingPlayer,
} from '@/lib/match-starting-player';
import { cn } from '@/lib/utils';

type IntroPhase = 'countdown' | 'draw' | 'winner' | 'done';

interface MatchIntroOverlayProps {
  active: boolean;
  matchId?: string | null;
  players: [Participant, Participant];
  remainingSeconds: number | null;
  /** Notifica al genitore quando la cerimonia è conclusa (ready-to-play). */
  onDone?: () => void;
}

/**
 * Overlay di apertura della partita: countdown + sorteggio del primo
 * giocatore (deterministico sul matchId, identico su entrambi i client).
 *
 * La cerimonia si vede UNA sola volta per browser+match (localStorage): se
 * l'utente rientra dopo aver perso la connessione NON ripete il sorteggio —
 * il match è ormai in corso — ma mostra un toast discreto di riconnessione.
 */
export function MatchIntroOverlay({
  active,
  matchId,
  players,
  remainingSeconds,
  onDone,
}: MatchIntroOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<IntroPhase>('done');
  const [drawIndex, setDrawIndex] = useState(0);
  const [seen, setSeen] = useState<boolean | null>(null);

  const stablePlayers = useMemo(
    () => [...players].sort((a, b) => a.id.localeCompare(b.id)) as [Participant, Participant],
    [], // escluso di proposito: vogliamo lo snapshot iniziale dei due partecipanti
  );
  const starter = useMemo(
    () => pickStartingPlayer(matchId ?? 'match', stablePlayers),
    [matchId, stablePlayers],
  );

  useEffect(() => setMounted(true), []);

  // Persistenza "visto la cerimonia" (una volta per match+browser).
  useEffect(() => {
    if (!matchId) return;
    setSeen(hasSeenMatchIntro(matchId));
  }, [matchId]);

  // Sequenza cerimonia: countdown → sorteggio → rivelazione.
  useEffect(() => {
    if (!active || !matchId) {
      setPhase('done');
      return;
    }
    if (seen === null) return;
    if (seen) {
      setPhase('done');
      onDone?.();
      return;
    }
    if (remainingSeconds === null) return;
    if (remainingSeconds > 0) {
      setPhase('countdown');
      return;
    }
    setPhase((current) => (current === 'countdown' ? 'draw' : current));
  }, [active, matchId, onDone, remainingSeconds, seen]);

  // Sorteggio (fase "draw"): attesa breve poi rivelazione.
  useEffect(() => {
    if (phase !== 'draw') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setPhase('winner'), reduced ? 450 : 1_200);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // Rivelazione (fase "winner"): salva come vista e chiudi.
  useEffect(() => {
    if (phase !== 'winner' || !matchId) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(
      () => {
        markMatchIntroSeen(matchId);
        setSeen(true);
        setPhase('done');
        onDone?.();
      },
      reduced ? 800 : 1_800,
    );
    return () => window.clearTimeout(timer);
  }, [matchId, onDone, phase]);

  // Flip dei nomi durante il sorteggio.
  useEffect(() => {
    if (phase !== 'draw') return;
    const interval = window.setInterval(() => setDrawIndex((current) => (current + 1) % 2), 100);
    return () => window.clearInterval(interval);
  }, [phase]);

  if (!mounted) return null;

  // Toast discreto: rientro a partita già avviata (cerimonia già vista).
  if (active && matchId && seen && phase === 'done') {
    return createPortal(
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-[1200] flex items-center gap-2 rounded-full border border-white/15 bg-header-bg/95 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white/90 shadow-lg backdrop-blur"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        Riconnessione in corso
      </div>,
      document.body,
    );
  }

  if (phase === 'done') return null;

  const drawingName = stablePlayers[drawIndex]?.username ?? starter.username;

  return createPortal(
    <div className="fixed inset-0 z-[1300] grid place-items-center overflow-hidden bg-header-bg text-white">
      {/* Fondale: glow radiale sobrio, senza tinta arancio piena */}
      <div className="match-intro-radial absolute inset-0" aria-hidden />
      <div className="match-intro-grid absolute inset-0 opacity-25" aria-hidden />

      {/* Particelle sobrie che fluttuano */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <span
            key={i}
            className="intro-particle absolute block h-1 w-1 rounded-full bg-white/50"
            style={{
              left: `${12 + i * 10}%`,
              top: `${18 + ((i * 13) % 60)}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${3 + (i % 3) * 0.7}s`,
            }}
          />
        ))}
      </div>

      <div
        className="relative z-10 flex max-w-3xl flex-col items-center px-6 text-center"
        role="status"
        aria-live="polite"
      >
        {/* Emblema centrale */}
        <div
          className={cn(
            'match-intro-emblem grid h-28 w-28 place-items-center rounded-full sm:h-36 sm:w-36',
            'border border-white/15 bg-white/[0.04] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)]',
            phase === 'winner' && 'ring-2 ring-inset ring-white/15',
          )}
        >
          {phase === 'countdown' ? (
            <span className="font-display text-6xl font-black tabular-nums text-white/95 sm:text-8xl">
              {remainingSeconds}
            </span>
          ) : phase === 'winner' ? (
            <Sparkles className="h-12 w-12 text-white/90 sm:h-16 sm:w-16" />
          ) : (
            <Swords className="h-12 w-12 text-white/90 sm:h-16 sm:w-16" />
          )}
        </div>

        <p className="mt-8 text-[11px] font-black uppercase tracking-[0.35em] text-white/55 sm:text-xs">
          {phase === 'countdown'
            ? 'La partita sta per iniziare'
            : phase === 'draw'
              ? 'Sorteggio del primo giocatore'
              : 'Tocca a'}
        </p>

        <h2
          className={cn(
            'mt-3 font-display text-4xl font-black uppercase leading-none tracking-tight text-white/95 sm:text-6xl',
            phase === 'winner' ? 'match-intro-winner' : 'match-intro-title',
          )}
        >
          {phase === 'countdown'
            ? 'Preparate i mazzi'
            : phase === 'draw'
              ? drawingName
              : starter.username}
        </h2>

        {phase === 'winner' && (
          <p className="match-intro-winner mt-4 text-base font-black uppercase tracking-[0.25em] text-white/70 sm:text-lg">
            inizia la partita
          </p>
        )}

        {/* Barra di progresso */}
        <div className="mt-9 h-[3px] w-56 overflow-hidden rounded-full bg-white/[0.08]">
          <div className="match-intro-progress h-full rounded-full bg-white/85" />
        </div>
      </div>
    </div>,
    document.body,
  );
}
