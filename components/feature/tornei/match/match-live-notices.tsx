import Link from 'next/link';
import { ArrowLeft, Flag, RefreshCw } from 'lucide-react';

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

/**
 * Schermata di fine partita: sostituisce webcam e chat, impossibile non
 * accorgersene. `opponentLeft` distingue l'abbandono esplicito dell'avversario.
 */
export function MatchEndedPanel({ opponentLeft }: { opponentLeft: boolean }) {
  return (
    <section aria-live="polite" className="grid min-h-0 flex-1 place-items-center py-6">
      <div className="flex w-full max-w-xl flex-col items-center gap-5 rounded-3xl border border-white/10 bg-gradient-to-br from-stone-900 via-stone-950 to-zinc-950 px-6 py-10 text-center text-white shadow-xl shadow-black/20 sm:px-10 sm:py-12">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary to-[#e0564d] shadow-[0_16px_40px_-10px_rgba(255,115,0,0.65)] ring-1 ring-white/20">
          <Flag className="h-7 w-7 text-white" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-3xl font-black uppercase tracking-wide text-white sm:text-4xl">
            Partita terminata
          </h2>
          <p className="mt-2 text-sm text-white/60 sm:text-base">
            {opponentLeft
              ? 'L’avversario ha abbandonato il tavolo.'
              : 'Il match si è concluso o l’avversario ha abbandonato.'}
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
}: {
  reconnecting: boolean;
  onRetry: () => void;
}) {
  if (!reconnecting) return null;
  return (
    <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
      <span>Connessione con l&apos;avversario interrotta. La partita resta aperta e la riconnessione è automatica.</span>
      <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase hover:bg-white/15">
        <RefreshCw className="h-3.5 w-3.5" /> Riprova ora
      </button>
    </div>
  );
}
