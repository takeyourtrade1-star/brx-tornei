'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Hourglass, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClashingSwordsIcon } from './clashing-swords-icon';
import type { ConnectionQuality } from '@/types/tournament';
import type { Deck } from '@/types/deck';
import { useSynchronizedCountdown } from '@/hooks/use-synchronized-countdown';
import {
  AcceptCountdownRing,
  AcceptDeckPicker,
  AcceptPlayerChip,
  CornerMarks,
  DeclinedPanel,
} from './accept-match-parts';

const ACCEPT_WINDOW_SECONDS = 30;
const DECLINED_LEAVE_SECONDS = 5;

/** Dopo il rifiuto dell'avversario: countdown che riporta in lobby da solo. */
function useDeclinedCountdown(
  phase: AcceptMatchModalProps['phase'],
  onLeave: () => void,
): number {
  const [secondsLeft, setSecondsLeft] = useState(DECLINED_LEAVE_SECONDS);
  useEffect(() => {
    if (phase !== 'declined') return;
    setSecondsLeft(DECLINED_LEAVE_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((seconds) => {
        if (seconds <= 1) {
          clearInterval(interval);
          onLeave();
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, onLeave]);
  return secondsLeft;
}

interface AcceptMatchModalProps {
  phase: 'accepting' | 'declined' | null;
  myUsername: string;
  opponentUsername: string | null;
  busy: boolean;
  error: string | null;
  myReady: boolean;
  opponentReady: boolean;
  readyDeadline?: string;
  serverTime?: string;
  myConnection?: ConnectionQuality;
  opponentConnection?: ConnectionQuality;
  /** Mazzi compatibili col formato del tavolo: dichiarazione facoltativa al via. */
  decks: Deck[];
  deckId: string;
  onDeckChange: (deckId: string) => void;
  onAccept: () => void;
  onLeave: () => void;
  onOpponentTimeout: () => void;
}

/**
 * Modale "coda trovata" stile League of Legends, mostrata IN LOBBY quando il
 * tavolo diventa pieno: finestra fissa di 30s, accetta o esci. La deadline è
 * globale (non riparte dopo la mia conferma) così copre anche l'avversario
 * con la tab chiusa; allo scadere dell'attesa si chiude il tavolo da soli.
 */
export function AcceptMatchModal({
  phase,
  myUsername,
  opponentUsername,
  busy,
  error,
  myReady,
  opponentReady,
  readyDeadline,
  serverTime,
  myConnection,
  opponentConnection,
  decks,
  deckId,
  onDeckChange,
  onAccept,
  onLeave,
  onOpponentTimeout,
}: AcceptMatchModalProps) {
  const declinedLeft = useDeclinedCountdown(phase, onLeave);
  const { remaining: acceptLeft, synchronized } = useSynchronizedCountdown({
    active: phase === 'accepting',
    deadline: readyDeadline,
    serverTime,
  });
  const prevPhaseRef = useRef<AcceptMatchModalProps['phase']>(null);
  const firedRef = useRef(false);
  const myReadyRef = useRef(myReady);
  useEffect(() => {
    myReadyRef.current = myReady;
  }, [myReady]);
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;
    if (phase === 'accepting' && prev !== 'accepting') {
      firedRef.current = false;
    }
  }, [phase]);

  // Countdown globale: a zero, se ho confermato segnalo il rifiuto
  // dell'avversario, altrimenti esco direttamente (non ho risposto).
  useEffect(() => {
    if (
      phase !== 'accepting' ||
      !synchronized ||
      acceptLeft === null ||
      acceptLeft > 0 ||
      firedRef.current
    ) return;
    firedRef.current = true;
    if (myReadyRef.current) onOpponentTimeout();
    else onLeave();
  }, [acceptLeft, onLeave, onOpponentTimeout, phase, synchronized]);

  if (!phase) return null;
  const declined = phase === 'declined';
  const acceptFraction = acceptLeft === null
    ? 1
    : Math.min(1, Math.max(0, acceptLeft / ACCEPT_WINDOW_SECONDS));
  const urgent = acceptLeft !== null && acceptLeft <= 10;
  const acceptLabel = acceptLeft === null
    ? 'Sincronizzazione del timer in corso'
    : `${acceptLeft} secondi per accettare`;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/85 p-4 backdrop-blur-md">
      <div className="accept-modal-panel relative w-full max-w-sm overflow-hidden rounded-[1.5rem] border border-primary/25 bg-gradient-to-b from-[#151d38] via-[#0c1226] to-[#070a16] px-6 py-7 text-center text-white shadow-[0_40px_100px_-30px_rgba(0,0,0,0.95)]">
        {/* Cornice: filo luminoso in alto + alone caldo, come le finestre di coda */}
        <span aria-hidden className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(75%_45%_at_50%_0%,rgba(255,115,0,0.22),transparent_72%)]"
        />
        <CornerMarks tone={declined ? 'border-red-400/50' : 'border-primary/60'} />

        {declined ? (
          <DeclinedPanel
            opponentUsername={opponentUsername}
            secondsLeft={declinedLeft}
            busy={busy}
            onLeave={onLeave}
          />
        ) : (
          <div className="relative flex flex-col items-center">
            <span
              aria-hidden
              className="swords-emblem grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.07] text-white ring-1 ring-white/10"
            >
              <ClashingSwordsIcon className="h-9 w-9" />
            </span>

            <h2 className="mt-4 bg-gradient-to-b from-white to-primary bg-clip-text font-display text-[26px] font-black uppercase leading-none tracking-[0.16em] text-transparent sm:text-[28px]">
              Partita trovata
            </h2>

            <AcceptCountdownRing
              seconds={acceptLeft}
              fraction={acceptFraction}
              label={acceptLabel}
              urgent={urgent}
            />
            <div className="mt-6 flex w-full items-center gap-2">
              <AcceptPlayerChip
                label={myUsername}
                ready={myReady}
                pending={busy}
                connection={myConnection}
              />
              <span className="shrink-0 font-display text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
                vs
              </span>
              <AcceptPlayerChip
                label={opponentUsername ?? 'Giocatore'}
                ready={opponentReady}
                connection={opponentConnection}
              />
            </div>

            <AcceptDeckPicker
              decks={decks}
              value={deckId}
              disabled={busy || myReady}
              onChange={onDeckChange}
            />

            {error && (
              <p role="alert" className="mt-3 text-xs font-bold text-red-300">
                {error}
              </p>
            )}

            <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] px-3 py-2 text-left text-[10px] font-semibold leading-relaxed text-amber-100/75">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden />
              Le partite troppo brevi o incomplete non vengono conteggiate.
            </p>

            <button
              type="button"
              disabled={busy || myReady || !synchronized}
              onClick={onAccept}
              className={cn(
                'mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl text-base font-black uppercase tracking-[0.14em] text-white transition active:scale-[0.98]',
                myReady
                  ? 'cursor-default border border-white/10 bg-white/[0.06] text-white/50'
                  : 'ready-pulse bg-gradient-to-b from-primary to-orange-600 shadow-[0_18px_40px_-14px_rgba(255,115,0,0.85)] ring-1 ring-white/20 hover:brightness-110 disabled:opacity-60',
              )}
            >
              {myReady ? (
                <>
                  <Hourglass className="h-4 w-4 animate-pulse" aria-hidden />
                  In attesa
                </>
              ) : !synchronized ? (
                <>
                  <Hourglass className="h-4 w-4 animate-pulse" aria-hidden />
                  Sincronizzazione…
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" aria-hidden />
                  Accetta
                </>
              )}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onLeave}
              className="mt-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-[11px] font-black uppercase tracking-[0.14em] text-white/40 transition hover:text-red-300 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Rifiuta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
