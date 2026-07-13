import { Wifi, WifiOff } from 'lucide-react';
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
  const liveLabel =
    transport === 'direct'
      ? 'P2P diretto'
      : transport === 'relay'
        ? 'Relay TURN'
        : 'Video connesso';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
        live
          ? 'bg-emerald-500/20 text-emerald-300'
          : state === 'failed'
            ? 'bg-red-500/20 text-red-300'
            : 'bg-white/10 text-white/60',
      )}
    >
      {live ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      {live ? liveLabel : error ? 'Riconnessione…' : 'Connessione…'}
    </span>
  );
}
