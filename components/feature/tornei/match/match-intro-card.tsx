'use client';

import { Swords } from 'lucide-react';
import type { Participant } from '@/types/tournament';
import { getAvatarById } from '@/lib/avatars';
import { cn } from '@/lib/utils';

interface MatchIntroCardProps {
  phase: 'shuffle' | 'reveal';
  starter: Participant;
  avatarId?: string;
}

type CardBackSize = 'shuffle' | 'reveal';

/** Dorso decorato della carta in stile TCG premium Ebartex. */
function CardBack({
  className,
  size = 'reveal',
}: {
  className?: string;
  size?: CardBackSize;
}) {
  const compact = size === 'shuffle';

  return (
    <div
      className={cn(
        'relative select-none overflow-hidden border-2 border-primary/55 bg-header-bg shadow-[0_24px_55px_-18px_rgba(0,0,0,0.95)]',
        compact
          ? 'h-[12rem] w-[8.25rem] rounded-[0.9rem] p-2 sm:h-[15rem] sm:w-[10.25rem]'
          : 'h-[19rem] w-[13rem] rounded-[1.15rem] p-3 sm:h-[22rem] sm:w-60',
        className,
      )}
    >
      <div
        className={cn(
          'relative flex h-full w-full flex-col items-center justify-center border border-amber-400/30 bg-gradient-to-b from-header-bg via-header-bg to-black',
          compact ? 'rounded-[0.65rem] p-2' : 'rounded-xl p-3',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute border border-primary/20',
            compact ? 'inset-1 rounded-[0.5rem]' : 'inset-1.5 rounded-lg',
          )}
        />
        <div
          className={cn(
            'relative grid place-items-center border border-primary/50 bg-gradient-to-br from-primary/30 via-header-bg to-header-bg shadow-[0_0_30px_rgba(255,115,0,0.35)]',
            compact ? 'h-12 w-12 rounded-xl sm:h-16 sm:w-16' : 'h-24 w-24 rounded-2xl',
          )}
        >
          <Swords
            className={cn(
              'text-primary drop-shadow-[0_0_10px_rgba(255,115,0,0.75)]',
              compact ? 'h-6 w-6 sm:h-8 sm:w-8' : 'h-12 w-12',
            )}
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}

/** Fronte della carta rivelata in stile Ultra-Rare olografica. */
function CardFront({ starter, avatarId }: { starter: Participant; avatarId?: string }) {
  const avatar = getAvatarById(avatarId);
  const AvatarIcon = avatar.icon;

  return (
    <div
      className="intro-card-glow relative h-[19rem] w-[13rem] select-none overflow-hidden rounded-[1.15rem] border-2 border-amber-300/80 bg-gradient-to-b from-global-bg-start via-header-bg to-header-bg p-3 text-white shadow-[0_30px_70px_-12px_rgba(255,115,0,0.6)] sm:h-[22rem] sm:w-60"
      aria-label={`Giocatore sorteggiato: ${starter.username}`}
    >
      <div className="intro-foil-effect pointer-events-none absolute inset-0 z-20 mix-blend-color-dodge opacity-70" aria-hidden />

      <div className="relative z-10 grid h-full w-full place-items-center overflow-hidden rounded-xl border border-amber-300/40 bg-header-bg/90 p-4 backdrop-blur-sm">
        <span className="pointer-events-none absolute inset-3 rounded-lg border border-white/10" aria-hidden />
        <span className="intro-reveal-halo pointer-events-none absolute h-36 w-36 rounded-full border border-primary/30" aria-hidden />

        <div className="relative z-10 flex min-w-0 flex-col items-center gap-5">
          <div
            className={cn(
              'relative grid h-28 w-28 place-items-center rounded-full border border-white/20 bg-gradient-to-br from-primary/20 via-header-bg to-header-bg shadow-[0_0_45px_rgba(255,115,0,0.5)]',
              avatar.bgGradient,
            )}
          >
            <AvatarIcon
              className={cn(
                'h-16 w-16 drop-shadow-[0_4px_14px_rgba(0,0,0,0.85)]',
                avatar.color,
              )}
            />
          </div>

          <h2 className="max-w-[10rem] truncate font-display text-2xl font-black uppercase tracking-wider text-white drop-shadow-[0_2px_12px_rgba(255,115,0,0.8)] sm:max-w-[11rem] sm:text-3xl">
            {starter.username}
          </h2>
        </div>
      </div>
    </div>
  );
}

function ShufflePacket({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      className={cn(
        'intro-shuffle-packet absolute left-1/2 top-1/2 z-10 h-[12rem] w-[8.25rem] sm:h-[15rem] sm:w-[10.25rem]',
        side === 'left' ? 'intro-shuffle-packet-left' : 'intro-shuffle-packet-right',
      )}
      aria-hidden
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="intro-shuffle-packet-card absolute inset-0"
        >
          <CardBack size="shuffle" />
        </div>
      ))}
    </div>
  );
}

function RiffleCards() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20" aria-hidden>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
        <span
          key={index}
          className={cn(
            'intro-riffle-card absolute left-1/2 top-1/2 grid h-[8.5rem] w-[5.75rem] place-items-center rounded-lg border-2 border-primary/45 bg-header-bg shadow-[0_20px_35px_-18px_rgba(0,0,0,0.95)] sm:h-[10.5rem] sm:w-[7.2rem]',
            index % 2 === 0 ? 'intro-riffle-card-left' : 'intro-riffle-card-right',
          )}
        >
          <span className="absolute inset-1 rounded-md border border-amber-300/25" />
          <span className="relative grid place-items-center">
            <Swords className="h-6 w-6 text-primary/80" aria-hidden />
          </span>
        </span>
      ))}
    </div>
  );
}

function ShuffleStage() {
  return (
    <div className="intro-shuffle-stage relative h-full w-full" aria-hidden>
      <div className="intro-shuffle-table absolute left-1/2 top-1/2 h-28 w-[19rem] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-white/10 sm:w-[28rem]" />
      <ShufflePacket side="left" />
      <ShufflePacket side="right" />
      <RiffleCards />
      <div className="intro-shuffle-final-deck absolute left-1/2 top-1/2 z-20 h-[12rem] w-[8.25rem] sm:h-[15rem] sm:w-[10.25rem]">
        <CardBack size="shuffle" />
      </div>
      <span className="intro-shuffle-impact absolute left-1/2 top-1/2 z-30 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/35" />
    </div>
  );
}

export function MatchIntroCard({ phase, starter, avatarId }: MatchIntroCardProps) {
  const isReveal = phase === 'reveal';

  return (
    <div className="relative z-10 flex w-full max-w-2xl flex-col items-center px-4 text-center">
      <h1 className="intro-stage-title font-display text-2xl font-black uppercase tracking-tight text-white sm:text-4xl">
        Il primo turno inizia
      </h1>

      <div className="intro-3d-wrap relative mt-5 flex h-[19rem] w-full items-center justify-center sm:mt-7 sm:h-[22rem]">
        {isReveal ? (
          <div className="intro-card-reveal-shell relative">
            <div className="intro-card-face intro-card-reveal-back absolute inset-0"><CardBack /></div>
            <div className="intro-card-face intro-card-reveal-front relative">
              <CardFront starter={starter} avatarId={avatarId} />
            </div>
          </div>
        ) : (
          <ShuffleStage />
        )}
      </div>
    </div>
  );
}
