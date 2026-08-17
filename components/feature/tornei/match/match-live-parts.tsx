import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import type { PeerTransport } from '@/lib/webrtc/match-peer-link';
import type { ConnectionQuality } from '@/types/tournament';
import { connectionQualityLabel } from '@/lib/webrtc/connection-quality';
import { cn } from '@/lib/utils';

/**
 * Testo unico della riconnessione: dice CHI si sta riconnettendo.
 */
export function reconnectingLabel(opponentName: string, disconnectedIsMe?: boolean): string {
  return disconnectedIsMe
    ? 'Ti stai riconnettendo…'
    : `${opponentName} si sta riconnettendo…`;
}

export function MatchWebcamDisconnectOverlay({
  reconnecting,
  remaining,
  disconnectedIsMe = false,
  opponentName,
  onRetry,
}: {
  reconnecting: boolean;
  remaining: number | null;
  disconnectedIsMe?: boolean;
  opponentName: string;
  onRetry?: () => void;
}) {
  if (!reconnecting && remaining === null) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto absolute inset-x-3 top-12 z-30 flex justify-center animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="flex max-w-[92%] items-center gap-2.5 rounded-xl border border-amber-400/40 bg-black/85 px-3.5 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.7)] backdrop-blur-xl ring-1 ring-amber-400/25">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-amber-400/30 bg-amber-500/20 text-amber-300">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-sans text-[10px] font-black uppercase tracking-wider text-amber-300">
            {disconnectedIsMe ? 'Sei disconnesso' : `${opponentName} disconnesso`}
          </span>
          <span className="text-[11px] font-bold text-white/90">
            {remaining !== null ? (
              <>
                Riconnessione entro{' '}
                <strong className="font-mono text-xs font-black text-amber-400">{remaining}s</strong>
              </>
            ) : (
              'Riconnessione video in corso…'
            )}
          </span>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-500/20 px-2 py-1 text-[10px] font-black uppercase text-amber-200 transition hover:bg-amber-500/35 active:scale-95"
          >
            <RefreshCw className="h-2.5 w-2.5" /> Riprova
          </button>
        )}
      </div>
    </div>
  );
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
