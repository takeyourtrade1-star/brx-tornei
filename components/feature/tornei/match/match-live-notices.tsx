import Link from 'next/link';
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
      className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-500/50 bg-red-950/85 px-3 py-2 text-sm text-red-50"
    >
      <span>{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase hover:bg-white/15"
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
    return 'Hai perso per abbandono: non sei rientrato in tempo.';
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
 * accorgersene. `opponentLeft` distingue l'abbandono esplicito dell'avversario
 * (segnale WebRTC locale); `didIWin`/`endReason` (dal contratto torneo)
 * permettono l'esito esplicito "vinta/persa per abbandono" non appena il
 * backend l'ha risolto.
 */
export function MatchEndedPanel({
  opponentLeft,
  didIWin,
  endReason,
}: {
  opponentLeft: boolean;
  didIWin?: boolean;
  endReason?: string;
}) {
  return (
    <section aria-live="polite" className="grid min-h-0 flex-1 place-items-center py-6">
      <div className="flex w-full max-w-xl flex-col items-center gap-5 rounded-3xl border border-white/10 bg-gradient-to-br from-footer-start via-card2-end to-card2-end px-6 py-10 text-center text-white shadow-xl shadow-card2-end/20 sm:px-10 sm:py-12">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary to-[#e0564d] shadow-[0_16px_40px_-10px_rgba(255,115,0,0.65)] ring-1 ring-white/20">
          <Flag className="h-7 w-7 text-white" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-3xl font-black uppercase tracking-wide text-white sm:text-4xl">
            Partita terminata
          </h2>
          <p className="mt-2 text-sm text-white/60 sm:text-base">
            {endedMessage(opponentLeft, didIWin, endReason)}
          </p>
        </div>
        <Link
          href="/tornei"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-b from-primary to-orange-600 px-8 text-sm font-black uppercase tracking-wide text-white shadow-[0_12px_28px_-10px_rgba(255,115,0,0.8)] ring-1 ring-white/20 transition hover:brightness-110 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna in lobby
        </Link>
      </div>
    </section>
  );
}

/**
 * L'avversario (o io, per timeout) ha rifiutato l'accettazione: il tavolo
 * era pieno e ora è di nuovo a un giocatore solo. Il pannello lo comunica
 * e il countdown riporta automaticamente in lobby.
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
      <div className="flex w-full max-w-xl flex-col items-center gap-5 rounded-3xl border border-white/10 bg-gradient-to-br from-footer-start via-card2-end to-card2-end px-6 py-10 text-center text-white shadow-xl shadow-card2-end/20 sm:px-10 sm:py-12">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-[0_16px_40px_-10px_rgba(239,68,68,0.6)] ring-1 ring-white/20">
          <UserX className="h-7 w-7 text-white" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-2xl font-black uppercase tracking-wide text-white sm:text-3xl">
            L&rsquo;avversario non ha accettato
          </h2>
          <p className="mt-2 text-sm text-white/60 sm:text-base">
            Non ha risposto alla chiamata entro il tempo: la sfida viene chiusa automaticamente.
          </p>
        </div>
        <button
          type="button"
          disabled={leaving}
          onClick={onLeave}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-b from-primary to-orange-600 px-8 text-sm font-black uppercase tracking-wide text-white shadow-[0_12px_28px_-10px_rgba(255,115,0,0.8)] ring-1 ring-white/20 transition hover:brightness-110 active:scale-95 disabled:opacity-50"
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
  /** Gamertag dell'avversario: l'avviso dice chi si sta riconnettendo. */
  opponentName: string;
  /** ISO: scadenza autorevole della riconnessione, se attiva. */
  graceDeadline?: string | null;
  /** true: il backend identifica me come giocatore temporaneamente offline. */
  disconnectedIsMe?: boolean;
}) {
  const remaining = useGraceCountdown(graceDeadline);
  if (!reconnecting && remaining === null) return null;

  const message =
    remaining !== null
      ? disconnectedIsMe
        ? `La tua presenza si è interrotta. Riconnettiti entro ${remaining}s; nel frattempo il risultato è bloccato. Nessun risultato viene assegnato automaticamente.`
        : `${opponentName} risulta disconnesso e ha ancora ${remaining}s per riconnettersi. Non puoi dichiarare il risultato durante l’attesa. Nessun risultato viene assegnato automaticamente.`
      : `${reconnectingLabel(opponentName, disconnectedIsMe)} La partita resta aperta: il video riparte da solo appena la linea torna.`;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
    >
      <span className="flex items-center gap-2">
        <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin text-amber-300" aria-hidden />
        {message}
      </span>
      <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase hover:bg-white/15">
        <RefreshCw className="h-3.5 w-3.5" /> Riprova ora
      </button>
    </div>
  );
}

/**
 * Avviso non bloccante durante una proposta di risultato. Webcam e chat
 * restano attive: soltanto due dichiarazioni concordi chiudono il match.
 * `awaitingMe`=true indica che l'avversario ha dichiarato per primo.
 */
export function MatchResultPendingPanel({
  awaitingMe,
  reselection,
  remaining,
  reconnecting,
  busy,
  localName,
  opponentName,
  onDeclare,
}: {
  awaitingMe: boolean;
  reselection: boolean;
  remaining: number | null;
  reconnecting: boolean;
  busy: boolean;
  localName: string;
  opponentName: string;
  onDeclare: (iWon: boolean) => void;
}) {
  const countdown = remaining !== null ? ` (${remaining}s)` : '';
  return (
    <section
      aria-live="polite"
      className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/35 bg-primary/10 px-4 py-3 text-white"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/20 ring-1 ring-primary/40">
          <Flag className="h-5 w-5 text-primary" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-black uppercase tracking-wide">
            {reselection ? 'Scegliete di nuovo' : 'Risultato proposto'}
          </h2>
          <p className="text-sm text-white/70">
            {reconnecting
              ? 'Risposta sospesa durante la riconnessione. Avrai nuovamente tutto il tempo quando il collegamento torna.'
              : reselection && awaitingMe
              ? 'Le prime scelte erano diverse. Indicate entrambi il vincitore una seconda volta.'
              : awaitingMe
              ? `Indica il vincitore entro${countdown}. Se le dichiarazioni non coincidono, la partita resta aperta.`
              : `In attesa della scelta di ${opponentName}${countdown}. Alla scadenza la proposta viene annullata.`}
          </p>
        </div>
      </div>
        {awaitingMe && !reconnecting && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onDeclare(true)}
              className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-xs font-black uppercase tracking-wide text-white transition hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              Ha vinto {localName}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onDeclare(false)}
              className="inline-flex h-10 items-center rounded-full bg-white/10 px-5 text-xs font-black uppercase tracking-wide text-white ring-1 ring-white/20 transition hover:bg-white/15 active:scale-95 disabled:opacity-50"
            >
              Ha vinto {opponentName}
            </button>
          </div>
        )}
    </section>
  );
}
