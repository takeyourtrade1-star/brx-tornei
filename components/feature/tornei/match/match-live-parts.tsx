import { CheckCircle2, Gamepad2, Layers, Wifi, WifiOff } from 'lucide-react';
import type { Participant } from '@/types/tournament';
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

export function DeckStrip({ player, formatName }: { player: Participant; formatName: string }) {
  const waiting = player.id === '__waiting__';
  const deck = player.deck;
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
        <Layers className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-white">
          {waiting ? 'In attesa…' : (deck?.name ?? 'Mazzo non dichiarato')}
        </p>
        <p className="truncate text-[11px] text-white/50">
          {formatName}
          {deck?.archetype ? ` · ${deck.archetype}` : ''}
        </p>
      </div>
      {deck?.verified && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
          <CheckCircle2 className="h-3 w-3" />
          Verificato
        </span>
      )}
    </div>
  );
}

export function MatchInfoBar({
  modeName,
  bestOfLabel,
  formatName,
}: {
  modeName: string;
  bestOfLabel: string;
  formatName: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-bold text-white/85">
        <Gamepad2 className="h-3.5 w-3.5 text-primary" />
        {modeName}
      </span>
      <span className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-primary">
        {bestOfLabel}
      </span>
      <span className="ml-auto text-[11px] font-semibold uppercase tracking-wide text-white/40">
        {formatName}
      </span>
    </div>
  );
}
