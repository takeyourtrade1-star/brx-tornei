'use client';

import { Swords, User } from 'lucide-react';
import type { Participant } from '@/types/tournament';
import { cn } from '@/lib/utils';

interface MatchIntroCountdownProps {
  players: [Participant, Participant];
  remainingSeconds: number | null;
}

function PlayerFaceCard({
  player,
  align = 'left',
}: {
  player: Participant;
  align?: 'left' | 'right';
}) {
  const isLeft = align === 'left';
  return (
    <div
      className={cn(
        'relative flex flex-1 items-center gap-3.5 rounded-2xl border border-white/15 bg-white/[0.04] p-4 backdrop-blur-md shadow-[0_16px_35px_-12px_rgba(0,0,0,0.7)] transition-all',
        isLeft ? 'flex-row' : 'flex-row-reverse text-right',
      )}
    >
      <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-primary/40 bg-gradient-to-br from-primary/20 via-header-bg to-header-bg shadow-md">
        <User className="h-6 w-6 text-primary" aria-hidden />
        <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-header-bg bg-emerald-400" />
      </div>

      <div className="min-w-0 flex-1">
        <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
          {isLeft ? 'Giocatore 1' : 'Giocatore 2'}
        </span>
        <h3 className="truncate font-display text-lg font-black uppercase tracking-wide text-white sm:text-xl">
          {player.username}
        </h3>
        {player.deck?.name && (
          <p className="truncate text-xs font-semibold text-primary/85">
            {player.deck.name}
          </p>
        )}
      </div>
    </div>
  );
}

export function MatchIntroCountdown({ players, remainingSeconds }: MatchIntroCountdownProps) {
  const [playerOne, playerTwo] = players;

  return (
    <div className="relative z-10 flex w-full max-w-2xl flex-col items-center px-4 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.25em] text-primary shadow-sm">
        <Swords className="h-3.5 w-3.5" aria-hidden />
        Fase di avvio
      </div>

      <h1 className="mt-3 font-display text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
        Preparate i mazzi
      </h1>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/50 sm:text-sm">
        Entrambi i duellanti sono al tavolo
      </p>

      {/* Face-off giocatori */}
      <div className="mt-8 flex w-full flex-col items-center gap-3 sm:flex-row sm:gap-4">
        <PlayerFaceCard player={playerOne} align="left" />

        <div className="relative shrink-0">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-header-bg/90 font-display text-xs font-black uppercase tracking-wider text-white/70 shadow-lg sm:h-12 sm:w-12">
            VS
          </span>
        </div>

        <PlayerFaceCard player={playerTwo} align="right" />
      </div>

      {/* Cerchio del conto alla rovescia */}
      <div className="relative mt-8 grid h-28 w-28 place-items-center rounded-full border border-primary/40 bg-gradient-to-b from-primary/15 via-[#0b1020] to-[#060914] shadow-[0_0_50px_rgba(255,115,0,0.35)] sm:h-32 sm:w-32">
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-full border border-primary/30 animate-ping opacity-25"
        />
        <span
          key={remainingSeconds ?? 'wait'}
          className="intro-countdown-pop font-display text-5xl font-black tabular-nums text-white drop-shadow-[0_4px_24px_rgba(255,115,0,0.85)] sm:text-6xl"
        >
          {remainingSeconds ?? '—'}
        </span>
      </div>

      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
        Inizio del sorteggio primo turno tra pochi istanti
      </p>
    </div>
  );
}
