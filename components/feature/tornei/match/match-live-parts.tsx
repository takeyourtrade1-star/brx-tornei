import { Wifi, WifiOff } from 'lucide-react';
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
  const level = quality?.level ?? 'good';
  const transportLabel =
    transport === 'direct'
      ? 'Partita tra amici'
      : transport === 'relay'
        ? 'Video protetto'
        : 'Video connesso';

  const fullLabel = live
    ? `${transportLabel} · ${connectionQualityLabel(quality)}`
    : reconnecting || error
      ? 'Riconnessione…'
      : 'Connessione…';

  const msLabel =
    live && quality?.rttMs !== undefined
      ? `${quality.rttMs} ms`
      : live
        ? '40 ms'
        : failed
          ? 'OFF'
          : '… ms';

  const colorClass = failed
    ? 'border-red-400/30 bg-red-500/10 text-red-300'
    : live && level === 'poor'
      ? 'border-rose-400/30 bg-rose-500/10 text-rose-300'
      : live && level === 'fair'
        ? 'border-amber-400/30 bg-amber-500/10 text-amber-300'
        : live
          ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300'
          : 'border-white/10 bg-white/5 text-white/60';

  const iconColor = failed
    ? 'text-red-400'
    : live && level === 'poor'
      ? 'text-rose-400'
      : live && level === 'fair'
        ? 'text-amber-400'
        : live
          ? 'text-emerald-400'
          : 'text-amber-300 animate-pulse';

  return (
    <span
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-bold font-mono tracking-tight select-none shadow-sm backdrop-blur-md transition',
        colorClass,
      )}
      title={fullLabel}
      aria-label={fullLabel}
    >
      {failed ? (
        <WifiOff className={cn('h-3.5 w-3.5', iconColor)} aria-hidden />
      ) : (
        <Wifi className={cn('h-3.5 w-3.5', iconColor)} aria-hidden />
      )}
      <span>{msLabel}</span>
    </span>
  );
}
