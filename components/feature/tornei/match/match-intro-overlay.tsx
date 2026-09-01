'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Swords } from 'lucide-react';
import type { Participant } from '@/types/tournament';
import {
  hasSeenMatchIntro,
  markMatchIntroSeen,
  pickStartingPlayer,
} from '@/lib/match-starting-player';
import { cn } from '@/lib/utils';

type IntroPhase = 'countdown' | 'draw' | 'winner' | 'done';

const DRAW_DURATION_MS = 1_200;
const WINNER_DURATION_MS = 1_800;
const CEREMONY_DURATION_MS = DRAW_DURATION_MS + WINNER_DURATION_MS;

interface MatchIntroOverlayProps {
  active: boolean;
  matchId?: string | null;
  players: [Participant, Participant];
  remainingSeconds: number | null;
  /** Istante di avvio già tradotto nella timeline locale dal server. */
  startsAtLocalMs: number | null;
  /** Notifica al genitore quando la cerimonia è conclusa (ready-to-play). */
  onDone?: () => void;
}

/**
 * Overlay di apertura della partita: countdown + sorteggio del primo
 * giocatore (deterministico sul matchId, identico su entrambi i client).
 * Tutte le fasi dopo il countdown sono ancorate a startsAtLocalMs: un client
 * che entra in ritardo raggiunge direttamente la fase corretta.
 */
export function MatchIntroOverlay({
  active,
  matchId,
  players,
  remainingSeconds,
  startsAtLocalMs,
  onDone,
}: MatchIntroOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [seen, setSeen] = useState<boolean | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const notifiedForMatch = useRef<string | null>(null);

  const [stablePlayers] = useState(
    () => [...players].sort((a, b) => a.id.localeCompare(b.id)) as [Participant, Participant],
  );
  const starter = useMemo(
    () => pickStartingPlayer(matchId ?? 'match', stablePlayers),
    [matchId, stablePlayers],
  );

  useEffect(() => setMounted(true), []);

  // Persistenza "visto la cerimonia" (una volta per match+browser).
  useEffect(() => {
    if (!matchId) {
      setSeen(null);
      return;
    }
    setSeen(hasSeenMatchIntro(matchId));
    notifiedForMatch.current = null;
  }, [matchId]);

  // Un clock locale serve solo a ridisegnare una timeline già fissata dal
  // server; non decide mai l'istante iniziale.
  useEffect(() => {
    if (!active || startsAtLocalMs === null) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [active, startsAtLocalMs]);

  const elapsedMs = startsAtLocalMs === null ? null : now - startsAtLocalMs;
  const phase = useMemo<IntroPhase>(() => {
    if (!active || !matchId || seen === null || seen || elapsedMs === null) return 'done';
    if (elapsedMs < 0) return 'countdown';
    if (elapsedMs < DRAW_DURATION_MS) return 'draw';
    if (elapsedMs < CEREMONY_DURATION_MS) return 'winner';
    return 'done';
  }, [active, elapsedMs, matchId, seen]);

  // La chiusura è fissata alla stessa timeline, anche se il browser ha
  // aperto la pagina dopo l'inizio della cerimonia.
  useEffect(() => {
    if (!active || !matchId || seen === null) return;
    if (seen) {
      if (notifiedForMatch.current === matchId) return;
      notifiedForMatch.current = matchId;
      onDone?.();
      return;
    }
    if (startsAtLocalMs === null) return;
    const delay = Math.max(0, startsAtLocalMs + CEREMONY_DURATION_MS - Date.now());
    const timer = window.setTimeout(() => {
      markMatchIntroSeen(matchId);
      setSeen(true);
      if (notifiedForMatch.current !== matchId) {
        notifiedForMatch.current = matchId;
        onDone?.();
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [active, matchId, onDone, seen, startsAtLocalMs]);

  if (!mounted || phase === 'done') return null;

  const drawIndex = phase === 'draw' && elapsedMs !== null
    ? Math.floor(Math.max(0, elapsedMs) / 100) % 2
    : 0;
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
