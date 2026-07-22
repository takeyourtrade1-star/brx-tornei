import type { PeerTransport } from '@/lib/webrtc/match-peer-link';
import { cn } from '@/lib/utils';

export function ConnectionBadge({
  state,
  error,
  transport,
}: {
  state: string;
  error: string | null;
  transport: PeerTransport;
}) {
  const live = state === 'connected';
  const failed = state === 'failed';
  const liveLabel =
    transport === 'direct'
      ? 'Partita tra amici'
      : transport === 'relay'
        ? 'Video protetto'
        : 'Video connesso';
  return (
    <span
      className={cn(
        'inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[10px] font-black uppercase tracking-wider',
        live
          ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300'
          : failed
            ? 'border-red-400/30 bg-red-500/10 text-red-300'
            : 'border-white/10 bg-white/5 text-white/60',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          live
            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
            : failed
              ? 'bg-red-400'
              : 'animate-pulse bg-amber-300',
        )}
      />
      {live ? liveLabel : error ? 'Riconnessione…' : 'Connessione…'}
    </span>
  );
}
