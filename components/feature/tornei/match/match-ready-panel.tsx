'use client';

import { useEffect, useRef } from 'react';
import { CheckCircle2, Heart, Hourglass, Swords, X } from 'lucide-react';
import type { Participant } from '@/types/tournament';
import { STARTING_LIFE_OPTIONS } from '@/lib/match-life-protocol';
import { cn } from '@/lib/utils';
import { useSynchronizedCountdown } from '@/hooks/use-synchronized-countdown';
import { useSynchronizedPhase } from '@/hooks/use-synchronized-phase';
import { ConnectionQualityBadge } from '../connection-quality-badge';
interface MatchReadyPanelProps {
  local: Participant;
  remote: Participant;
  myReady: boolean;
  opponentReady: boolean;
  acceptanceOpensAt?: string;
  readyDeadline?: string;
  serverTime?: string;
  pending: boolean;
  startingLife: number;
  lifeConnected: boolean;
  canSetStartingLife: boolean;
  onStartingLifeChange: (value: number) => void;
  onReady: () => void;
  /** Rifiuto: mio (esplicito o timeout senza conferma) → esco dal tavolo. */
  onDecline: () => void;
  /** Timeout lato avversario (o mio "tavolo pieno" senza sua conferma). */
  onOpponentDeclined: () => void;
}
export function MatchReadyPanel({
  local,
  remote,
  myReady,
  opponentReady,
  acceptanceOpensAt,
  readyDeadline,
  serverTime,
  pending,
  startingLife,
  lifeConnected,
  canSetStartingLife,
  onStartingLifeChange,
  onReady,
  onDecline,
  onOpponentDeclined,
}: MatchReadyPanelProps) {
  const acceptanceGate = useSynchronizedPhase({
    active: true,
    startsAt: acceptanceOpensAt,
    serverTime,
  });
  const { remaining, synchronized } = useSynchronizedCountdown({
    active: acceptanceGate.visible,
    deadline: readyDeadline,
    serverTime,
  });
  const myReadyRef = useRef(myReady);
  const finishedRef = useRef(false);
  // Aggiorno il ref parallelo senza ripartire il countdown.
  useEffect(() => {
    myReadyRef.current = myReady;
  }, [myReady]);

  // Deadline UNICA per entrambi i ruoli (fissa alla comparsa del pannello):
  // - non ho confermato alla scadenza → declino (esco dal tavolo);
  // - ho confermato ma l'avversario no → segnalo "non ha accettato".
  // La deadline globale (non riavviata dalla mia conferma) copre anche il
  // caso "l'avversario ha la tab chiusa" — nessun client è lì a rispondere.
  useEffect(() => {
    if (!synchronized || remaining === null || remaining > 0 || finishedRef.current) return;
    finishedRef.current = true;
    if (myReadyRef.current) onOpponentDeclined();
    else onDecline();
  }, [onDecline, onOpponentDeclined, remaining, synchronized]);

  if (!acceptanceGate.visible) return null;

  return (
    <section
      aria-live="polite"
      className="relative mb-4 overflow-hidden rounded-2xl border border-primary/35 bg-header-bg/95 p-[18px] shadow-xl backdrop-blur-md sm:p-5"
    >
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/[0.14] blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/15 text-primary">
            <Swords className="h-6 w-6 text-primary" aria-hidden="true" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400" aria-hidden />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              {remote.username} trovato
            </p>
            <h1 className="mt-0.5 font-sans text-lg font-black tracking-tight text-white sm:text-xl">
              Sei pronto?
            </h1>
            <p className="mt-0.5 text-xs font-semibold text-slate-300">
              {myReady
                ? `In attesa che ${remote.username} confermi…`
                : 'Hai fino a 30 secondi. Se non confermi, il tavolo verrà chiuso automaticamente.'}
            </p>
          </div>
        </div>
        {!myReady && (
          <span
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-sm font-black tabular-nums',
              remaining !== null && remaining <= 10
                ? 'animate-pulse border-red-400/50 bg-red-500/15 text-red-300'
                : 'border-white/20 bg-white/[0.08] text-white/90',
            )}
            role="timer"
            aria-label={remaining === null
              ? 'Sincronizzazione del timer in corso'
              : `${remaining} secondi per accettare`}
          >
            {remaining === null ? '—' : `${remaining}s`}
          </span>
        )}
      </div>

      <div className="relative mt-4 grid gap-3 sm:grid-cols-2">
        <ReadyConfirmation
          username={local.username}
          connection={local.connection}
          ready={myReady}
          isMe
          pending={pending}
        />
        <ReadyConfirmation
          username={remote.username}
          connection={remote.connection}
          ready={opponentReady}
        />
      </div>

      <div className="relative mt-3 rounded-xl border border-white/15 bg-white/[0.07] px-3 py-2">
        <div className="mb-1.5 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-300">
          <Heart className="h-3.5 w-3.5 fill-primary text-primary" />
          Vita iniziale condivisa
        </div>
        <div className="flex justify-center gap-1.5" aria-label="Scegli i punti vita iniziali">
          {STARTING_LIFE_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              disabled={!lifeConnected || !canSetStartingLife}
              aria-pressed={startingLife === value}
              onClick={() => onStartingLifeChange(value)}
              className={cn(
                'h-8 min-w-11 rounded-lg border px-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40',
                startingLife === value
                  ? 'border-primary bg-primary text-white shadow-[0_0_18px_rgba(255,115,0,0.35)]'
                  : 'border-white/20 bg-white/[0.06] text-white/85 hover:border-primary/50 hover:text-white',
              )}
            >
              {value}
            </button>
          ))}
        </div>
        {!canSetStartingLife && (
          <p className="mt-1.5 text-center text-[9px] font-bold text-slate-400">
            La imposta chi ha creato il tavolo
          </p>
        )}
      </div>

      <p className="relative mt-3 flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] px-3 py-2 text-[10px] font-semibold leading-relaxed text-amber-100/75">
        <Hourglass className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden />
        Le partite troppo brevi o incomplete non vengono conteggiate.
      </p>

      <div className="relative mt-4 flex flex-wrap items-center justify-end gap-2.5">
        <button
          type="button"
          disabled={pending}
          onClick={onDecline}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/15 px-[18px] text-xs font-black uppercase tracking-wider text-red-200 transition hover:bg-red-500/25 active:scale-95 disabled:opacity-50"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          No, non ora
        </button>
        <button
          type="button"
          disabled={pending || !synchronized}
          onClick={onReady}
          className={cn(
            'inline-flex h-10 items-center gap-2 rounded-xl px-5 text-xs font-black uppercase tracking-wider text-white transition active:scale-95 disabled:opacity-50',
            myReady
              ? 'border border-white/20 bg-white/10 hover:bg-white/15'
              : 'ready-pulse bg-gradient-to-r from-[#FF7300] to-[#e0564d] shadow-md hover:brightness-110',
          )}
        >
          {myReady ? <Hourglass className="h-4 w-4" aria-hidden="true" /> : synchronized ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <Hourglass className="h-4 w-4 animate-pulse" aria-hidden="true" />}
          {myReady ? 'Confermato, attendo' : synchronized ? 'Sì, sono pronto' : 'Sincronizzazione…'}
        </button>
      </div>
    </section>
  );
}

function ReadyConfirmation({
  username,
  connection,
  ready,
  isMe = false,
  pending = false,
}: {
  username: string;
  connection?: Participant['connection'];
  ready: boolean;
  isMe?: boolean;
  pending?: boolean;
}) {
  return (
    <article
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5',
        ready
          ? 'border-emerald-400/40 bg-emerald-500/15'
          : 'border-white/15 bg-white/[0.07]',
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-white">{username}</p>
        <ConnectionQualityBadge connection={connection} dark />
        <p className={cn('mt-0.5 text-[10px] font-black uppercase tracking-wider', ready ? 'text-emerald-300' : 'text-white/70')}>
          {ready
            ? 'Confermato'
            : isMe
              ? pending
                ? 'Conferma in corso…'
                : 'In attesa della tua conferma'
              : 'In attesa della conferma'}
        </p>
      </div>
      {isMe ? (
        <Hourglass className={cn('h-5 w-5 shrink-0', ready ? 'text-emerald-300' : 'text-white/50')} aria-hidden="true" />
      ) : ready ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
      ) : (
        <Hourglass className="h-5 w-5 shrink-0 text-white/50" aria-hidden="true" />
      )}
    </article>
  );
}
