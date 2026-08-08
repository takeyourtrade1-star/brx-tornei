'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, Hourglass, Swords, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACCEPT_WINDOW_SECONDS = 30;
const DECLINED_LEAVE_SECONDS = 5;

interface AcceptMatchModalProps {
  phase: 'accepting' | 'declined' | null;
  myUsername: string;
  opponentUsername: string | null;
  busy: boolean;
  error: string | null;
  myReady: boolean;
  opponentReady: boolean;
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
  onAccept,
  onLeave,
  onOpponentTimeout,
}: AcceptMatchModalProps) {
  const [acceptLeft, setAcceptLeft] = useState(ACCEPT_WINDOW_SECONDS);
  const [declinedLeft, setDeclinedLeft] = useState(DECLINED_LEAVE_SECONDS);
  const [deadline] = useState(() => Date.now() + ACCEPT_WINDOW_SECONDS * 1000);
  const myReadyRef = useRef(myReady);
  const firedRef = useRef(false);
  useEffect(() => {
    myReadyRef.current = myReady;
  }, [myReady]);

  // Countdown globale: a zero, se ho confermato segnalo il rifiuto
  // dell'avversario, altrimenti esco direttamente (non ho risposto).
  useEffect(() => {
    if (!phase || phase !== 'accepting' || firedRef.current) return;
    const interval = setInterval(() => {
      if (firedRef.current) {
        clearInterval(interval);
        return;
      }
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setAcceptLeft(left);
      if (left <= 0) {
        clearInterval(interval);
        if (firedRef.current) return;
        firedRef.current = true;
        if (myReadyRef.current) {
          onOpponentTimeout();
        } else {
          onLeave();
        }
      }
    }, 250);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, deadline, onLeave, onOpponentTimeout]);

  // Stato "rifiutato": pochi secondi e si torna in lobby chiudendo il tavolo.
  useEffect(() => {
    if (phase !== 'declined') return;
    setDeclinedLeft(DECLINED_LEAVE_SECONDS);
    const interval = setInterval(() => {
      setDeclinedLeft((seconds) => {
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

  if (!phase) return null;
  const declined = phase === 'declined';

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-gradient-to-br from-footer-start via-card2-end to-card2-end px-6 py-8 text-center text-white shadow-2xl shadow-black/60 sm:px-10">
        {declined ? (
          <>
            <span
              className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-[0_16px_40px_-10px_rgba(239,68,68,0.6)] ring-1 ring-white/20"
              aria-hidden
            >
              <AlertTriangle className="h-7 w-7" />
            </span>
            <h2 className="mt-4 font-display text-2xl font-black uppercase tracking-wide sm:text-3xl">
              L&rsquo;avversario non ha accettato
            </h2>
            <p className="mt-2 text-sm font-semibold text-white/60 sm:text-base">
              La partita non inizierà: il tavolo viene chiuso automaticamente.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={onLeave}
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-b from-primary to-orange-600 px-8 text-sm font-black uppercase tracking-wide text-white shadow-[0_12px_28px_-10px_rgba(255,115,0,0.8)] ring-1 ring-white/20 transition hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Torna in lobby ({declinedLeft}s)
            </button>
          </>
        ) : (
          <>
            <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary to-[#e0564d] shadow-[0_16px_40px_-10px_rgba(255,115,0,0.65)] ring-1 ring-white/20">
              <Swords className="h-7 w-7 text-white" aria-hidden />
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-ping rounded-full bg-emerald-400" aria-hidden />
            </span>
            <p className="mt-4 text-[11px] font-black uppercase tracking-[0.22em] text-primary">
              Avversario trovato
            </p>
            <h2 className="mt-1 font-display text-3xl font-black uppercase tracking-wide">
              Sei pronto?
            </h2>
            <p className="mt-2 text-sm font-semibold text-white/60">
              Hai fino a {ACCEPT_WINDOW_SECONDS} secondi per confermare. Se non rispondi,
              il tavolo verrà chiuso automaticamente.
            </p>

            <div className="mt-5 flex items-center gap-2">
              <PlayerChip
                label={myUsername}
                ready={myReady}
                stateText={busy ? 'Conferma in corso…' : myReady ? 'Confermato' : 'In attesa della tua conferma'}
              />
              <span className="shrink-0 text-sm font-black text-white/40">vs</span>
              <PlayerChip
                label={opponentUsername ?? 'Avversario'}
                ready={opponentReady}
                stateText={opponentReady ? 'Confermato' : 'In attesa della conferma'}
              />
            </div>

            <span
              className={cn(
                'mx-auto mt-5 grid h-16 w-16 place-items-center rounded-full border text-2xl font-black tabular-nums',
                acceptLeft <= 10
                  ? 'animate-pulse border-red-400/50 bg-red-500/15 text-red-300'
                  : 'border-white/20 bg-white/[0.08] text-white',
              )}
              role="timer"
              aria-label={`${acceptLeft} secondi per accettare`}
            >
              {acceptLeft}
            </span>

            {error && (
              <p role="alert" className="mt-3 text-xs font-bold text-red-300">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <button
                type="button"
                disabled={busy}
                onClick={onLeave}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-red-400/40 bg-red-500/10 px-6 text-sm font-black uppercase tracking-wide text-red-200 transition hover:bg-red-500/20 active:scale-95 disabled:opacity-50"
              >
                <X className="h-4 w-4" aria-hidden />
                No, non ora
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onAccept}
                className={cn(
                  'inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-sm font-black uppercase tracking-wide text-white transition active:scale-95 disabled:opacity-50',
                  myReady
                    ? 'border border-white/20 bg-white/10 hover:bg-white/15'
                    : 'ready-pulse bg-gradient-to-r from-primary to-orange-500 shadow-[0_14px_32px_-12px_rgba(255,115,0,0.7)] hover:opacity-90',
                )}
              >
                {myReady ? (
                  <>
                    <Hourglass className="h-4 w-4" aria-hidden />
                    Confermato, attendo
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    Sì, sono pronto
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PlayerChip({ label, ready, stateText }: { label: string; ready: boolean; stateText: string }) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl border px-3 py-2.5',
        ready ? 'border-emerald-400/40 bg-emerald-500/15' : 'border-white/15 bg-white/[0.07]',
      )}
    >
      <span className="w-full truncate text-center text-sm font-black text-white">{label}</span>
      <span
        className={cn(
          'w-full truncate text-center text-[9px] font-black uppercase tracking-wider',
          ready ? 'text-emerald-300' : 'text-white/60',
        )}
      >
        {stateText}
      </span>
    </div>
  );
}