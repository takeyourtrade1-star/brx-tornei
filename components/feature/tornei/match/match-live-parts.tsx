import type { PeerTransport } from '@/lib/webrtc/match-peer-link';
import type { ConnectionQuality } from '@/types/tournament';
import { connectionQualityLabel } from '@/lib/webrtc/connection-quality';
import { cn } from '@/lib/utils';

/**
 * Testo unico della riconnessione: dice CHI si sta riconnettendo, non "la
 * connessione". Lo condividono avviso, badge e tile video dell'avversario,
 * così l'utente legge sempre la stessa frase nello stesso momento.
 */
export function reconnectingLabel(opponentName: string, disconnectedIsMe?: boolean): string {
  return disconnectedIsMe
    ? 'Ti stai riconnettendo…'
    : `${opponentName} si sta riconnettendo…`;
}

export function ConnectionBadge({
  state,
  error,
  transport,
  quality,
  reconnecting = false,
}: {
  state: string;
  error: string | null;
  transport: PeerTransport;
  quality?: ConnectionQuality;
  /** true: il video era già attivo ed è caduto → non è una prima connessione. */
  reconnecting?: boolean;
}) {
  const live = state === 'connected';
  const failed = state === 'failed';
  const transportLabel =
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
      {live
        ? `${transportLabel} · ${connectionQualityLabel(quality)}`
        : reconnecting || error ? 'Riconnessione…' : 'Connessione…'}
    </span>
  );
}
