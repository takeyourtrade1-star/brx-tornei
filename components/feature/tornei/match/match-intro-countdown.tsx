'use client';

import type { Participant } from '@/types/tournament';
import { getAvatarById } from '@/lib/avatars';
import { cn } from '@/lib/utils';

interface MatchIntroCountdownProps {
  players: [Participant, Participant];
  avatarIds: Record<string, string>;
  remainingSeconds: number | null;
}

function PlayerFaceCard({ player, avatarId }: { player: Participant; avatarId?: string }) {
  const avatar = getAvatarById(avatarId);
  const AvatarIcon = avatar.icon;

  return (
    <div className="relative flex min-w-0 flex-col items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.04] p-4 text-center shadow-[0_16px_35px_-12px_rgba(0,0,0,0.7)] backdrop-blur-md sm:flex-row sm:text-left">
      <div
        className={cn(
          'grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-white/20 bg-gradient-to-br from-primary/20 via-header-bg to-header-bg shadow-md',
          avatar.bgGradient,
        )}
      >
        <AvatarIcon
          className={cn(
            'h-9 w-9 drop-shadow-[0_3px_8px_rgba(0,0,0,0.8)]',
            avatar.color,
          )}
        />
      </div>

      <div className="min-w-0">
        <h2 className="truncate font-display text-xs font-black uppercase tracking-normal text-white sm:text-base">
          {player.username}
        </h2>
      </div>
    </div>
  );
}

export function MatchIntroCountdown({
  players,
  avatarIds,
  remainingSeconds,
}: MatchIntroCountdownProps) {
  const [playerOne, playerTwo] = players;

  return (
    <div className="relative z-10 flex w-full max-w-2xl flex-col items-center px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55 sm:text-sm">
        Entrambi i duellanti sono seduti al tavolo
      </p>

      <h1 className="mt-3 font-display text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
        Preparate i mazzi
      </h1>

      <div className="mt-7 grid w-full grid-cols-2 gap-3 sm:mt-8 sm:gap-4">
        <PlayerFaceCard player={playerOne} avatarId={avatarIds[playerOne.id]} />
        <PlayerFaceCard player={playerTwo} avatarId={avatarIds[playerTwo.id]} />
      </div>

      <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45 sm:mt-8 sm:text-xs">
        Inizio del sorteggio tra poco
      </p>

      <div className="relative mt-4 grid h-24 w-24 place-items-center rounded-full border border-primary/40 bg-gradient-to-b from-primary/15 via-header-bg to-black shadow-[0_0_50px_rgba(255,115,0,0.35)] sm:h-28 sm:w-28">
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-full border border-primary/30 animate-ping opacity-25"
        />
        <span
          key={remainingSeconds ?? 'wait'}
          className="intro-countdown-pop font-display text-5xl font-black tabular-nums text-white drop-shadow-[0_4px_24px_rgba(255,115,0,0.85)]"
        >
          {remainingSeconds ?? '—'}
        </span>
      </div>

    </div>
  );
}
