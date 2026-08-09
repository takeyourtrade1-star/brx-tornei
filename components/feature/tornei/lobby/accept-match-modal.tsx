'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, Hourglass, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClashingSwordsIcon } from './clashing-swords-icon';

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
  // Deadline valida solo finché la modale è davvero in fase active: il
  // componente resta montato (renderizza null quando chiuso), quindi la
  // deadline va (ri)settata OGNI volta che si entra in 'accepting', non al
  // primo load della pagina — altrimenti dopo un minuto in lobby la finestra
  // schiatterebbe già scaduta.
  const [deadline, setDeadline] = useState(() => Date.now() + ACCEPT_WINDOW_SECONDS * 1000);
  const prevPhaseRef = useRef<AcceptMatchModalProps['phase']>(null);
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;
    if (phase === 'accepting' && prev !== 'accepting') {
      firedRef.current = false;
      setAcceptLeft(ACCEPT_WINDOW_SECONDS);
      setDeadline(Date.now() + ACCEPT_WINDOW_SECONDS * 1000);
    }
  }, [phase]);
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
  const acceptFraction = acceptLeft / ACCEPT_WINDOW_SECONDS;
  const urgent = acceptLeft <= 10;

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
          <div className="relative flex flex-col items-center">
            <span
              className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-[0_16px_40px_-12px_rgba(239,68,68,0.7)] ring-1 ring-white/20"
              aria-hidden
            >
              <AlertTriangle className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-display text-2xl font-black uppercase tracking-[0.14em] text-white">
              Sfida annullata
            </h2>
            <p className="mt-1.5 text-sm font-semibold text-white/50">
              L&rsquo;avversario non ha accettato.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={onLeave}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-primary to-orange-600 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_14px_32px_-12px_rgba(255,115,0,0.8)] ring-1 ring-white/20 transition hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Lobby ({declinedLeft}s)
            </button>
          </div>
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

            {/* Anello timer: si svuota, diventa rosso sotto i 10s restanti. */}
            <span
              className={cn(
                'relative mt-6 grid h-28 w-28 place-items-center rounded-full',
                urgent ? 'animate-pulse' : 'accept-ring-glow',
              )}
              role="timer"
              aria-label={`${acceptLeft} secondi per accettare`}
              style={{
                background: `conic-gradient(${
                  urgent ? '#f87171' : '#FF7300'
                } ${Math.max(0, acceptFraction) * 360}deg, rgba(255,255,255,0.07) 0deg 360deg)`,
              }}
            >
              <span className="grid h-[5.75rem] w-[5.75rem] place-items-center rounded-full bg-[#070a16] text-4xl font-black tabular-nums text-white">
                {acceptLeft}
              </span>
            </span>

            <div className="mt-6 flex w-full items-center gap-2">
              <PlayerChip label={myUsername} ready={myReady} pending={busy} />
              <span className="shrink-0 font-display text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
                vs
              </span>
              <PlayerChip label={opponentUsername ?? 'Avversario'} ready={opponentReady} />
            </div>

            {error && (
              <p role="alert" className="mt-3 text-xs font-bold text-red-300">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={busy || myReady}
              onClick={onAccept}
              className={cn(
                'mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl text-base font-black uppercase tracking-[0.14em] text-white transition active:scale-[0.98]',
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

/** Quattro squadrette agli angoli: la cornice "da coda", senza scritte. */
function CornerMarks({ tone }: { tone: string }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-3">
      <span className={cn('absolute left-0 top-0 h-4 w-4 rounded-tl-md border-l-2 border-t-2', tone)} />
      <span className={cn('absolute right-0 top-0 h-4 w-4 rounded-tr-md border-r-2 border-t-2', tone)} />
      <span className={cn('absolute bottom-0 left-0 h-4 w-4 rounded-bl-md border-b-2 border-l-2', tone)} />
      <span className={cn('absolute bottom-0 right-0 h-4 w-4 rounded-br-md border-b-2 border-r-2', tone)} />
    </span>
  );
}

/** Solo gamertag e stato: spunta verde se ha accettato, pallino se manca. */
function PlayerChip({ label, ready, pending = false }: { label: string; ready: boolean; pending?: boolean }) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 transition-colors',
        ready ? 'border-emerald-400/40 bg-emerald-500/15' : 'border-white/10 bg-white/[0.05]',
      )}
    >
      {ready ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" aria-label="Ha accettato" />
      ) : (
        <span
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full bg-white/35', pending && 'animate-pulse bg-primary')}
          aria-hidden
        />
      )}
      <span className="truncate text-[13px] font-black text-white">{label}</span>
    </div>
  );
}