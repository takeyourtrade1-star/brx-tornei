'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Flag, Gamepad2, LogOut, ShieldAlert, Trophy } from 'lucide-react';
import type { ConnectionQuality, Participant, TournamentStatus } from '@/types/tournament';
import type { PeerTransport } from '@/lib/webrtc/match-peer-link';
import { ConnectionBadge } from './match-live-parts';
import { MatchReportModal } from './match-report-modal';
import { MatchDeclareModal } from './match-declare-modal';

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
  peerQuality?: ConnectionQuality;
  localName: string;
  opponentName: string;
  /** true: il video era già attivo ed è caduto (riconnessione, non prima connessione). */
  peerReconnecting?: boolean;
  /** true: ho una partita attiva da poter chiudere con una dichiarazione. */
  canDeclare?: boolean;
  declareBusy?: boolean;
  onDeclare?: (iWon: boolean) => void;
  onLeave: () => void;
  /** Match id per la segnalazione contro l'avversario (moderazione). */
  reportMatchId?: string | null;
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
  peerQuality,
  localName,
  opponentName,
  peerReconnecting = false,
  canDeclare = false,
  declareBusy = false,
  onDeclare,
  onLeave,
  reportMatchId = null,
}: MatchLiveHeaderProps) {
  const [playerA, playerB] = players;
  const [declareOpen, setDeclareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  useEffect(() => {
    if (!canDeclare) setDeclareOpen(false);
  }, [canDeclare]);

  const confirmDeclare = (iWon: boolean) => {
    onDeclare?.(iWon);
    setDeclareOpen(false);
  };

  return (
    <header className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-3xl border border-white/10 bg-header-bg/90 px-4 py-3 text-white shadow-xl shadow-black/30">
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
      <div className="flex flex-wrap items-center gap-2">
        {isPlayer && status === 'iniziata' && (
          <ConnectionBadge
            state={peerState}
            error={peerError}
            transport={peerTransport}
            quality={peerQuality}
            reconnecting={peerReconnecting}
          />
        )}
        {isPlayer && status === 'iniziata' && canDeclare && onDeclare && (
          <button
            type="button"
            disabled={declareBusy}
            onClick={() => setDeclareOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 via-primary/20 to-primary/10 px-3.5 text-xs font-black uppercase tracking-wide text-white shadow-sm backdrop-blur-md transition hover:border-amber-400/80 hover:bg-primary/30 active:scale-95 disabled:opacity-50"
          >
            <Trophy className="h-3.5 w-3.5 text-amber-300" />
            Termina partita
          </button>
        )}
        {isPlayer && status !== 'terminata' && (
          <button
            type="button"
            disabled={leaving}
            onClick={onLeave}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-gradient-to-b from-red-500 to-red-600 px-3.5 text-xs font-black uppercase tracking-wide text-white shadow-[0_10px_24px_-10px_rgba(239,68,68,0.8)] ring-1 ring-white/20 transition hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            {status === 'iniziata' ? (
              <Flag className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <LogOut className="h-3.5 w-3.5" aria-hidden />
            )}
            {status === 'iniziata' ? 'Arrenditi' : 'Alzati'}
          </button>
        )}
        {isPlayer && status !== 'terminata' && (
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            title="Segnala partita o avversario allo staff"
            aria-label="Segnala partita allo staff"
            className="grid h-8 w-8 place-items-center rounded-full border border-amber-400/35 bg-amber-400/10 text-amber-400 transition hover:border-amber-400/70 hover:bg-amber-400/20 hover:text-amber-300 active:scale-95"
          >
            <ShieldAlert className="h-4 w-4" />
          </button>
        )}
      </div>

      {reportOpen && (
        <MatchReportModal
          matchId={reportMatchId}
          opponentName={opponentName}
          onClose={() => setReportOpen(false)}
        />
      )}

      <MatchDeclareModal
        open={declareOpen}
        localName={localName}
        opponentName={opponentName}
        busy={declareBusy}
        onDeclare={confirmDeclare}
        onClose={() => setDeclareOpen(false)}
      />
    </header>
  );
}
