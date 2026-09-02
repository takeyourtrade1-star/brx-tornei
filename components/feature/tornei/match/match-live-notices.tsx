'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Flag, RefreshCw, UserX } from 'lucide-react';
import { useGraceCountdown } from '@/hooks/use-grace-countdown';
import { reconnectingLabel } from './match-live-parts';

export function MatchErrorNotice({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-500/30 bg-header-bg/95 p-4 text-sm text-white shadow-xl backdrop-blur-md"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-red-500/30 bg-red-500/15 text-red-400">
          <UserX className="h-4 w-4" aria-hidden />
        </span>
        <span className="font-semibold text-red-100">{message}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/15 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-red-200 transition hover:bg-red-500/25"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Riprova ora
        </button>
      )}
    </div>
  );
}
const ABANDONMENT_REASONS = new Set(['leave']);

function endedMessage(
  opponentLeft: boolean,
  didIWin: boolean | undefined,
  endReason?: string,
): string {
  if (endReason === 'disputed') {
    return 'Risultato contestato: dichiarazioni discordanti. Nessun vincitore assegnato.';
  }
  const abandonment = endReason !== undefined && ABANDONMENT_REASONS.has(endReason);
  if (abandonment && didIWin === true) {
    return 'Hai vinto a tavolino: l’avversario ha abbandonato il tavolo.';
  }
  if (abandonment && didIWin === false) {
    return 'Ti sei arreso: la sconfitta è stata registrata.';
  }
  if (endReason === 'reported' && didIWin === true) {
    return 'Hai vinto la partita!';
  }
  if (endReason === 'reported' && didIWin === false) {
    return 'Hai perso la partita.';
  }
  if (endReason === 'timeout') {
    return 'Il tavolo inattivo è stato chiuso senza assegnare un vincitore.';
  }
  return opponentLeft
    ? 'L’avversario ha abbandonato il tavolo.'
    : 'Il match si è concluso o l’avversario ha abbandonato.';
}
/**
 * Schermata di fine partita: sostituisce webcam e chat, impossibile non
 * accorgersene.
 */
export function MatchEndedPanel({
  opponentLeft,
  didIWin,
  endReason,
  resultScore,
  children,
}: {
  opponentLeft: boolean;
  didIWin?: boolean;
  endReason?: string;
  resultScore?: string;
  children?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <section
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      aria-label="Partita terminata"
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/85 p-4 sm:p-6 backdrop-blur-md"
    >
      <div className="flex min-h-full items-center justify-center py-4">
        <div className="my-auto w-full max-w-3xl sm:max-w-4xl">
          <div className="flex flex-col items-center gap-5 rounded-3xl border border-white/15 bg-header-bg/95 p-8 text-center text-white shadow-2xl shadow-black/70 backdrop-blur-xl sm:p-10">
            <span className="grid h-16 w-16 place-items-center rounded-2xl border border-primary/40 bg-primary/15 text-primary shadow-[0_0_24px_rgba(255,115,0,0.3)]">
              <Flag className="h-8 w-8 text-primary" aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                Partita terminata
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-300 sm:text-base">
                {endedMessage(opponentLeft, didIWin, endReason)}
              </p>
              {resultScore && endReason !== 'disputed' && endReason !== 'timeout' && (
                <p className="mt-4 font-display text-4xl font-black tracking-tight text-white sm:text-5xl">
                  {resultScore}
                </p>
              )}
            </div>
            <Link
              href="/tornei"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-7 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-orange-500/20 transition hover:brightness-110 active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
              Torna in lobby
            </Link>
          </div>
          {children}
        </div>
      </div>
    </section>,
    document.body,
  );
}

/**
 * L'avversario (o io, per timeout) ha rifiutato l'accettazione.
 */
export function MatchDeclinedPanel({
  leaving,
  secondsLeft,
  onLeave,
}: {
  leaving: boolean;
  secondsLeft: number;
  onLeave: () => void;
}) {
  return (
    <section aria-live="assertive" className="grid min-h-0 flex-1 place-items-center py-6">
      <div className="flex w-full max-w-xl flex-col items-center gap-5 rounded-3xl border border-red-500/30 bg-header-bg/95 p-8 text-center text-white shadow-2xl backdrop-blur-md sm:p-10">
        <span className="grid h-16 w-16 place-items-center rounded-2xl border border-red-500/40 bg-red-500/15 text-red-400 shadow-[0_0_24px_rgba(239,68,68,0.3)]">
          <UserX className="h-8 w-8 text-red-400" aria-hidden />
        </span>
        <div>
          <h2 className="font-sans text-2xl font-black uppercase tracking-wide text-white sm:text-3xl">
            L&rsquo;avversario non ha accettato
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-300 sm:text-base">
            Non ha risposto alla chiamata entro il tempo: la sfida viene chiusa automaticamente.
          </p>
        </div>
        <button
          type="button"
          disabled={leaving}
          onClick={onLeave}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-7 text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:brightness-110 active:scale-95 disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {secondsLeft > 0 ? `Torna in lobby (${secondsLeft}s)` : 'Torna in lobby'}
        </button>
      </div>
    </section>
  );
}

export function MatchConnectionNotice({
  reconnecting,
  onRetry,
  opponentName,
  graceDeadline,
  disconnectedIsMe,
}: {
  reconnecting: boolean;
  onRetry: () => void;
  opponentName: string;
  graceDeadline?: string | null;
  disconnectedIsMe?: boolean;
}) {
  const remaining = useGraceCountdown(graceDeadline);
  if (!reconnecting && remaining === null) return null;

  const message =
    remaining !== null
      ? disconnectedIsMe
        ? `La tua presenza si è interrotta. Riconnettiti entro ${remaining}s; nel frattempo il risultato è bloccato.`
        : `${opponentName} risulta disconnesso ed ha ancora ${remaining}s per riconnettersi.`
      : `${reconnectingLabel(opponentName, disconnectedIsMe)} La partita resta aperta: il video riparte appena la linea torna.`;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-header-bg/95 p-4 text-sm text-white shadow-xl backdrop-blur-md"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-400">
          <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
        </span>
        <span className="font-semibold text-amber-100">{message}</span>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/15 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-amber-200 transition hover:bg-amber-500/25"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Riprova
      </button>
    </div>
  );
}
