'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Participant } from '@/types/tournament';
import {
  hasSeenMatchIntro,
  markMatchIntroSeen,
  pickStartingPlayer,
} from '@/lib/match-starting-player';
import { MatchIntroCountdown } from './match-intro-countdown';
import { MatchIntroCard } from './match-intro-card';

type IntroPhase = 'countdown' | 'shuffle' | 'reveal' | 'done';

const SHUFFLE_DURATION_MS = 2_000;
const REVEAL_DURATION_MS = 2_500;
const CEREMONY_DURATION_MS = SHUFFLE_DURATION_MS + REVEAL_DURATION_MS;

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
 * Overlay di apertura della partita TCG: countdown iniziale con face-off tra
 * giocatori, smazzamento e riffle shuffle 3D del mazzo per il sorteggio,
 * e flip a 180° della carta olografica che svela chi inizia il turno 1.
 * Deterministico sul matchId e sincronizzato al millisecondo tra i due client.
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

  // Clock locale ancorato al serverTime/startsAtLocalMs.
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
    if (elapsedMs < SHUFFLE_DURATION_MS) return 'shuffle';
    if (elapsedMs < CEREMONY_DURATION_MS) return 'reveal';
    return 'done';
  }, [active, elapsedMs, matchId, seen]);

  // Chiusura ancorata all'istante startsAtLocalMs + durata cerimonia.
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

  const drawIndex = phase === 'shuffle' && elapsedMs !== null
    ? Math.floor(Math.max(0, elapsedMs) / 120) % 2
    : 0;
  const drawingName = stablePlayers[drawIndex]?.username ?? starter.username;

  return createPortal(
    <div className="fixed inset-0 z-[1300] grid place-items-center overflow-hidden bg-header-bg text-white">
      {/* Fondale: alone radiale con riflessi caldi Ebartex */}
      <div className="match-intro-radial absolute inset-0" aria-hidden />
      <div className="match-intro-grid absolute inset-0 opacity-25" aria-hidden />

      {/* Particelle ed ember fluttuanti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <span
            key={i}
            className="intro-particle absolute block h-1.5 w-1.5 rounded-full bg-primary/60 shadow-[0_0_8px_rgba(255,115,0,0.8)]"
            style={{
              left: `${10 + i * 11}%`,
              top: `${15 + ((i * 13) % 65)}%`,
              animationDelay: `${i * 0.35}s`,
              animationDuration: `${2.8 + (i % 3) * 0.6}s`,
            }}
          />
        ))}
      </div>

      <div
        className="relative z-10 flex w-full flex-col items-center justify-center py-6"
        role="status"
        aria-live="polite"
      >
        {phase === 'countdown' ? (
          <MatchIntroCountdown players={stablePlayers} remainingSeconds={remainingSeconds} />
        ) : (
          <MatchIntroCard phase={phase} starter={starter} drawingName={drawingName} />
        )}

        {/* Barra di progresso temporale in basso */}
        <div className="mt-8 h-[3px] w-56 overflow-hidden rounded-full bg-white/[0.08]">
          <div className="match-intro-progress h-full rounded-full bg-gradient-to-r from-primary to-amber-300" />
        </div>
      </div>
    </div>,
    document.body,
  );
}
