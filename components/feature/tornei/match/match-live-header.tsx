import Link from 'next/link';
import { ArrowLeft, Gamepad2, LogOut } from 'lucide-react';
import type { Participant, TournamentStatus } from '@/types/tournament';
import type { PeerTransport } from '@/lib/webrtc/match-peer-link';
import { ConnectionBadge } from './match-live-parts';

interface MatchLiveHeaderProps {
  players: [Participant, Participant];
  modeName: string;
  bestOfLabel: string;
  status: TournamentStatus;
  isPlayer: boolean;
  leaving: boolean;
  peerState: string;
  peerError: string | null;
  peerTransport: PeerTransport;
  onLeave: () => void;
}

export function MatchLiveHeader({
  players,
  modeName,
  bestOfLabel,
  status,
  isPlayer,
  leaving,
  peerState,
  peerError,
  peerTransport,
  onLeave,
}: MatchLiveHeaderProps) {
  const [playerA, playerB] = players;
  return (
    <header className="simple-panel mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <Link
          href="/tornei"
          className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/15"
          aria-label="Torna ai tornei"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-lg font-black uppercase tracking-wide text-white">Partita live</h1>
          <p className="text-xs text-white/55">{playerA.username} vs {playerB.username}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-white/85">
          <Gamepad2 className="h-3.5 w-3.5 text-primary" />
          {modeName}
        </span>
        <span className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-primary">
          {bestOfLabel}
        </span>
        {isPlayer && status === 'iniziata' && (
          <ConnectionBadge state={peerState} error={peerError} transport={peerTransport} />
        )}
        {isPlayer && status !== 'terminata' && (
          <button
            type="button"
            disabled={leaving}
            onClick={onLeave}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            {status === 'iniziata' ? 'Abbandona' : 'Alzati'}
          </button>
        )}
      </div>
    </header>
  );
}
