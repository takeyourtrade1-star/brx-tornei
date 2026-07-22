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
    <header className="simple-panel mb-3 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/tornei"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white/70 transition hover:border-white/25 hover:bg-white/15 hover:text-white"
          aria-label="Torna alla lobby: la partita resta attiva"
          title="Torna alla lobby: la partita resta attiva"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-primary">Partita live</p>
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5">
            <h1 className="truncate font-sans text-base font-black text-white sm:text-lg">
              {playerA.username}
              <span className="mx-2 text-sm font-bold text-white/30">vs</span>
              {playerB.username}
            </h1>
            <span className="hidden h-3.5 w-px bg-white/15 sm:block" aria-hidden />
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider sm:text-[13px]">
              <span className="flex items-center gap-1.5 text-white/75">
                <Gamepad2 className="h-4 w-4 text-primary" />
                {modeName}
              </span>
              <span className="text-white/25" aria-hidden>
                ·
              </span>
              <span className="text-primary">{bestOfLabel}</span>
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        {isPlayer && status === 'iniziata' && (
          <ConnectionBadge state={peerState} error={peerError} transport={peerTransport} />
        )}
        {isPlayer && status !== 'terminata' && (
          <button
            type="button"
            disabled={leaving}
            onClick={onLeave}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-b from-red-500 to-red-600 px-5 text-xs font-black uppercase tracking-wide text-white shadow-[0_10px_24px_-10px_rgba(239,68,68,0.8)] ring-1 ring-white/20 transition hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {status === 'iniziata' ? 'Abbandona' : 'Alzati'}
          </button>
        )}
      </div>
    </header>
  );
}
