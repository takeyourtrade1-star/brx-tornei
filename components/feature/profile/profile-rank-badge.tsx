'use client';

import { useId } from 'react';
import { getAvatarById } from '@/lib/avatars';
import { getStarAngles, getStarPoints, MAX_RANK_STARS, rankStarsForWins } from '@/lib/rank';
import { cn } from '@/lib/utils';

export interface ProfileRankBadgeProps {
  avatarId?: string;
  gamertag: string;
  wins?: number;
  /** Se fornito, sovrascrive il calcolo delle stelle dalle vittorie. */
  starCount?: number;
  onClick?: () => void;
  className?: string;
  interactive?: boolean;
  /** Nasconde la pillola con il gamertag in basso se mostrato altrove. */
  hidePill?: boolean;
  /** Attiva l'animazione a fuoco spettacolare (3+ vittorie consecutive). */
  onFire?: boolean;
  winStreak?: number;
}

/**
 * Badge profilo vettoriale pixel-perfect con supporto modalità ON FIRE (3+ streak).
 */
export function ProfileRankBadge({
  avatarId,
  gamertag,
  wins = 0,
  starCount,
  onClick,
  className,
  interactive = true,
  hidePill = false,
  onFire = false,
  winStreak = 0,
}: ProfileRankBadgeProps) {
  const activeAvatar = getAvatarById(avatarId);
  const AvatarIcon = activeAvatar.icon;
  const stars = typeof starCount === 'number' ? starCount : rankStarsForWins(wins);
  const isBurning = onFire || winStreak >= 3;
  const angles = getStarAngles(stars);
  const uid = useId().replace(/:/g, '');

  const ringGradId = `ring-grad-${uid}`;
  const starGradId = `star-grad-${uid}`;
  const glowFilterId = `star-glow-${uid}`;

  const trackRadius = 32.5;
  const starOuterR = stars >= 4 ? 3.2 : 3.5;
  const starInnerR = starOuterR * 0.45;

  const content = (
    <>
      <div
        className={cn(
          'relative h-16 w-16 transition-transform duration-200 group-hover:scale-105 sm:h-20 sm:w-20',
          isBurning && 'rank-fire-ring rounded-full',
        )}
      >
        <svg
          viewBox="0 0 80 80"
          className={cn(
            'absolute inset-0 h-full w-full pointer-events-none transition-all duration-300',
            isBurning ? 'drop-shadow-[0_0_18px_rgba(255,80,0,0.85)]' : 'drop-shadow-[0_0_14px_rgba(245,158,11,0.35)]',
          )}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={ringGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              {isBurning ? (
                <>
                  <stop offset="0%" stopColor="#FFF275" />
                  <stop offset="30%" stopColor="#FF7700" />
                  <stop offset="70%" stopColor="#FF2200" />
                  <stop offset="100%" stopColor="#FF9900" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#FCD34D" />
                  <stop offset="35%" stopColor="#F59E0B" />
                  <stop offset="70%" stopColor="#D97706" />
                  <stop offset="100%" stopColor="#FDE68A" />
                </>
              )}
            </linearGradient>

            <linearGradient id={starGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              {isBurning ? (
                <>
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="35%" stopColor="#FFDF00" />
                  <stop offset="100%" stopColor="#FF3300" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#FEF08A" />
                  <stop offset="50%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </>
              )}
            </linearGradient>

            <filter id={glowFilterId} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation={isBurning ? '1.4' : '0.8'}
                floodColor={isBurning ? '#FF3300' : '#F59E0B'}
                floodOpacity={isBurning ? '1' : '0.9'}
              />
            </filter>
          </defs>

          <circle cx="40" cy="40" r="37" fill="#080d1a" />
          <circle cx="40" cy="40" r={trackRadius} fill="none" stroke={isBurning ? '#180a06' : '#0f172a'} strokeWidth="8" />
          <circle cx="40" cy="40" r="37" fill="none" stroke={`url(#${ringGradId})`} strokeWidth={isBurning ? '2.8' : '2.4'} />
          <circle cx="40" cy="40" r="28" fill="none" stroke={isBurning ? 'rgba(255,140,0,0.5)' : 'rgba(255,255,255,0.22)'} strokeWidth="1.8" />

          {angles.map((angle, idx) => {
            const rad = (angle * Math.PI) / 180;
            const sx = 40 + trackRadius * Math.cos(rad);
            const sy = 40 + trackRadius * Math.sin(rad);
            const points = getStarPoints(sx, sy, starOuterR, starInnerR, angle);

            return (
              <polygon
                key={idx}
                points={points}
                fill={`url(#${starGradId})`}
                stroke={isBurning ? '#FF2200' : '#B45309'}
                strokeWidth="0.4"
                filter={`url(#${glowFilterId})`}
                className={isBurning ? 'rank-fire-star' : undefined}
              />
            );
          })}
        </svg>

        {/* Icona Avatar centrale */}
        <div className="absolute inset-[13px] grid place-items-center rounded-full overflow-hidden sm:inset-[15px]">
          <div
            className={cn(
              'grid h-full w-full place-items-center rounded-full bg-gradient-to-b from-slate-900 via-header-bg to-black p-1.5 shadow-inner transition-colors',
              isBurning && 'from-amber-950/60 via-slate-950 to-black',
              activeAvatar.bgGradient,
            )}
          >
            <AvatarIcon
              className={cn(
                'h-5 w-5 transition-transform duration-200 sm:h-6 sm:w-6 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]',
                interactive && 'group-hover:scale-110',
                isBurning ? 'text-amber-300' : activeAvatar.color,
              )}
            />
          </div>
        </div>

        {/* Badge fiamma streak se onFire */}
        {isBurning && (
          <span
            className="absolute -right-1 -top-1 z-30 grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-red-600 text-[10px] shadow-[0_0_8px_rgba(255,80,0,0.9)] animate-pulse"
            title={`${winStreak} vittorie consecutive! ON FIRE 🔥`}
          >
            🔥
          </span>
        )}
      </div>

      {/* Gamertag sovrapposto in basso */}
      {!hidePill && (
        <span
          className={cn(
            'absolute -bottom-2.5 z-20 inline-flex max-w-[6.5rem] items-center justify-center truncate rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xl backdrop-blur-md transition-colors sm:max-w-[8.5rem] sm:text-[10px]',
            isBurning
              ? 'border-amber-400/80 bg-red-950/90 text-amber-300 shadow-[0_0_10px_rgba(255,80,0,0.6)]'
              : 'border-white/25 bg-[#080d1a]/95 group-hover:border-primary/70 group-hover:text-primary',
          )}
        >
          {gamertag}
        </span>
      )}
    </>
  );

  if (interactive && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Apri il profilo di ${gamertag}`}
        className={cn(
          'group relative flex flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-full',
          className,
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cn('relative flex flex-col items-center justify-center', className)}>
      {content}
    </div>
  );
}
