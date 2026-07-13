import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

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

export function MatchEndedNotice() {
  return (
    <p className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white/85">
      <span>La partita è terminata (fine match o abbandono dell&apos;avversario).</span>
      <Link
        href="/tornei"
        className="rounded-full bg-gradient-to-r from-primary to-orange-500 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-white hover:opacity-90"
      >
        Torna ai tavoli
      </Link>
    </p>
  );
}
