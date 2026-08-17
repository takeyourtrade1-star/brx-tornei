'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Gamepad2, LogOut, ShieldAlert, Trophy } from 'lucide-react';
import type { ConnectionQuality, Participant, TournamentStatus } from '@/types/tournament';
import type { PeerTransport } from '@/lib/webrtc/match-peer-link';
import { ConnectionBadge } from './match-live-parts';
import { MatchReportModal } from './match-report-modal';

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
            onClick={() => setReportOpen(true)}
            title="Segnala partita o avversario allo staff"
            aria-label="Segnala partita allo staff"
            className="grid h-8 w-8 place-items-center rounded-full border border-amber-400/35 bg-amber-400/10 text-amber-400 transition hover:border-amber-400/70 hover:bg-amber-400/20 hover:text-amber-300 active:scale-95"
          >
            <ShieldAlert className="h-4 w-4" />
          </button>
        )}
        {isPlayer && status !== 'terminata' && (
          <button
            type="button"
            disabled={leaving}
            onClick={onLeave}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-gradient-to-b from-red-500 to-red-600 px-3.5 text-xs font-black uppercase tracking-wide text-white shadow-[0_10px_24px_-10px_rgba(239,68,68,0.8)] ring-1 ring-white/20 transition hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            {status === 'iniziata' ? 'Arrenditi' : 'Alzati'}
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

      {declareOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Termina partita: chi ha vinto?"
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-md"
        >
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-gradient-to-b from-[#151d38] via-[#0c1226] to-[#070a16] px-6 py-8 text-center text-white shadow-2xl shadow-black/80">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-400/20 via-primary/20 to-primary/10 border border-amber-400/40 text-amber-300 shadow-[0_0_24px_rgba(255,180,0,0.25)]">
              <Trophy className="h-7 w-7" aria-hidden />
            </span>
            <h2 className="mt-4 font-display text-2xl font-black uppercase tracking-wide text-white">
              Chi ha vinto?
            </h2>
            <p className="mt-2 text-xs font-medium leading-relaxed text-white/60">
              Seleziona il vincitore del match. Anche <strong className="text-white">{opponentName}</strong> dovrà confermare lo stesso risultato.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                disabled={declareBusy}
                onClick={() => confirmDeclare(true)}
                className="group relative flex h-13 items-center justify-between rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-3 text-sm font-black uppercase tracking-wide text-white backdrop-blur-md transition duration-150 hover:border-primary/60 hover:bg-white/[0.12] hover:shadow-[0_0_20px_rgba(255,115,0,0.25)] active:scale-[0.98] disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition">
                    <Trophy className="h-3.5 w-3.5" />
                  </span>
                  <span>Io <span className="text-xs font-normal normal-case text-white/50">({localName})</span></span>
                </div>
                <span className="text-[10px] font-bold text-primary tracking-wider uppercase">Vittoria mia</span>
              </button>
              <button
                type="button"
                disabled={declareBusy}
                onClick={() => confirmDeclare(false)}
                className="group relative flex h-13 items-center justify-between rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-3 text-sm font-black uppercase tracking-wide text-white backdrop-blur-md transition duration-150 hover:border-primary/60 hover:bg-white/[0.12] hover:shadow-[0_0_20px_rgba(255,115,0,0.25)] active:scale-[0.98] disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white/70 group-hover:bg-primary group-hover:text-white transition">
                    <Trophy className="h-3.5 w-3.5" />
                  </span>
                  <span>{opponentName}</span>
                </div>
                <span className="text-[10px] font-bold text-white/50 tracking-wider uppercase group-hover:text-primary transition">Vittoria avversario</span>
              </button>
              <button
                type="button"
                onClick={() => setDeclareOpen(false)}
                className="mt-2 text-xs font-bold uppercase tracking-wider text-white/40 transition hover:text-white"
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
