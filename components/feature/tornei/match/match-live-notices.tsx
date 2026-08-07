import Link from 'next/link';
import { ArrowLeft, Flag, RefreshCw } from 'lucide-react';
import { useGraceCountdown } from '@/hooks/use-grace-countdown';

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
      className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
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

const ABANDONMENT_REASONS = new Set(['leave', 'timeout']);

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

export function MatchConnectionNotice({
  reconnecting,
  onRetry,
  graceDeadline,
  disconnectedIsMe,
}: {
  reconnecting: boolean;
  onRetry: () => void;
  /** ISO: countdown autorevole dal backend (report-peer-lost), se attivo. */
  graceDeadline?: string | null;
  /** true: sono io il giocatore segnalato come disconnesso dal backend. */
  disconnectedIsMe?: boolean;
}) {
  const remaining = useGraceCountdown(graceDeadline);
  if (!reconnecting && remaining === null) return null;

  const message =
    remaining !== null
      ? disconnectedIsMe
        ? `Ti sei disconnesso dall'avversario. Riconnettiti entro ${remaining}s o la partita sarà persa a tavolino.`
        : `L'avversario si è disconnesso. Se non torna entro ${remaining}s vincerai la partita a tavolino.`
      : 'Connessione con l’avversario interrotta. La partita resta aperta e la riconnessione è automatica.';

  return (
    <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
      <span>{message}</span>
      <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase hover:bg-white/15">
        <RefreshCw className="h-3.5 w-3.5" /> Riprova ora
      </button>
    </div>
  );
}

/**
 * Schermata sostituisce webcam/chat mentre si attende la risoluzione del
 * risultato dichiarato (result_status='claimed'): a questo punto il match è
 * già 'finished' lato backend (close_match già eseguito), quindi il
 * signaling P2P è comunque chiuso — mantenere il grid video in vita non
 * avrebbe senso. `awaitingMe`=true: tocca a me rispondere (l'avversario ha
 * dichiarato); false: sto aspettando che l'avversario confermi/contesti.
 */
export function MatchResultPendingPanel({
  awaitingMe,
  remaining,
  busy,
  onDeclare,
}: {
  awaitingMe: boolean;
  remaining: number | null;
  busy: boolean;
  onDeclare: (iWon: boolean) => void;
}) {
  const countdown = remaining !== null ? ` (${remaining}s)` : '';
  return (
    <section aria-live="polite" className="grid min-h-0 flex-1 place-items-center py-6">
      <div className="flex w-full max-w-xl flex-col items-center gap-5 rounded-3xl border border-white/10 bg-gradient-to-br from-footer-start via-card2-end to-card2-end px-6 py-10 text-center text-white shadow-xl shadow-card2-end/20 sm:px-10 sm:py-12">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary to-[#e0564d] shadow-[0_16px_40px_-10px_rgba(255,115,0,0.65)] ring-1 ring-white/20">
          <Flag className="h-7 w-7 text-white" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-3xl font-black uppercase tracking-wide text-white sm:text-4xl">
            Chi ha vinto?
          </h2>
          <p className="mt-2 text-sm text-white/60 sm:text-base">
            {awaitingMe
              ? `Il tuo avversario ha dichiarato un risultato. Rispondi entro${countdown}.`
              : `In attesa che l’avversario confermi${countdown}…`}
          </p>
        </div>
        {awaitingMe && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => onDeclare(true)}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-b from-primary to-orange-600 px-8 text-sm font-black uppercase tracking-wide text-white shadow-[0_12px_28px_-10px_rgba(255,115,0,0.8)] ring-1 ring-white/20 transition hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              Ho vinto io
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onDeclare(false)}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white/10 px-8 text-sm font-black uppercase tracking-wide text-white ring-1 ring-white/20 transition hover:bg-white/15 active:scale-95 disabled:opacity-50"
            >
              Ha vinto l’avversario
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
