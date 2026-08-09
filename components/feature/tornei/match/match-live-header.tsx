'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Flag, Gamepad2, LogOut } from 'lucide-react';
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
  /** true: il video era già attivo ed è caduto (riconnessione, non prima connessione). */
  peerReconnecting?: boolean;
  /** true: ho una partita attiva da poter chiudere con una dichiarazione. */
  canDeclare?: boolean;
  declareBusy?: boolean;
  onDeclare?: (iWon: boolean) => void;
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
  peerReconnecting = false,
  canDeclare = false,
  declareBusy = false,
  onDeclare,
  onLeave,
}: MatchLiveHeaderProps) {
  const [playerA, playerB] = players;
  const [declareOpen, setDeclareOpen] = useState(false);

  const confirmDeclare = (iWon: boolean) => {
    onDeclare?.(iWon);
    setDeclareOpen(false);
  };

  return (
    <header className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-3xl border border-white/10 bg-card2-end/90 px-4 py-3 text-white shadow-xl shadow-card2-end/20">
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
          <ConnectionBadge
            state={peerState}
            error={peerError}
            transport={peerTransport}
            reconnecting={peerReconnecting}
          />
        )}
        {isPlayer && status === 'iniziata' && canDeclare && onDeclare && (
          <button
            type="button"
            disabled={declareBusy}
            onClick={() => setDeclareOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-primary/40 bg-primary/[0.14] px-4 text-xs font-black uppercase tracking-wide text-white transition hover:bg-primary/25 active:scale-95 disabled:opacity-50"
          >
            <Flag className="h-4 w-4 text-primary" />
            Termina partita
          </button>
        )}
        {isPlayer && status !== 'terminata' && (
          <button
            type="button"
            disabled={leaving}
            onClick={onLeave}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-b from-red-500 to-red-600 px-4 text-xs font-black uppercase tracking-wide text-white shadow-[0_10px_24px_-10px_rgba(239,68,68,0.8)] ring-1 ring-white/20 transition hover:brightness-110 active:scale-95 disabled:opacity-50 sm:px-5"
          >
            <LogOut className="h-4 w-4" />
            {status === 'iniziata' ? 'Arrenditi' : 'Alzati'}
          </button>
        )}
      </div>

      {declareOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Termina partita: chi ha vinto?"
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-br from-footer-start via-card2-end to-card2-end px-6 py-8 text-center text-white shadow-2xl shadow-card2-end/40">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary to-[#e0564d] shadow-[0_14px_36px_-10px_rgba(255,115,0,0.65)] ring-1 ring-white/20">
              <Flag className="h-6 w-6 text-white" aria-hidden />
            </span>
            <h2 className="mt-4 font-display text-2xl font-black uppercase tracking-wide">
              Chi ha vinto?
            </h2>
            <p className="mt-1.5 text-sm font-semibold text-white/65">
              Scegli l&rsquo;esito per chiudere la partita. L&rsquo;avversario dovrà confermare.
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                disabled={declareBusy}
                onClick={() => confirmDeclare(true)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-primary to-orange-600 px-6 text-sm font-black uppercase tracking-wide text-white shadow-[0_12px_28px_-10px_rgba(255,115,0,0.8)] ring-1 ring-white/20 transition hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                Ho vinto io
              </button>
              <button
                type="button"
                disabled={declareBusy}
                onClick={() => confirmDeclare(false)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white/10 px-6 text-sm font-black uppercase tracking-wide text-white ring-1 ring-white/20 transition hover:bg-white/15 active:scale-95 disabled:opacity-50"
              >
                Ha vinto l&rsquo;avversario
              </button>
              <button
                type="button"
                onClick={() => setDeclareOpen(false)}
                className="mt-1 text-xs font-bold uppercase tracking-wider text-white/50 transition hover:text-white"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}