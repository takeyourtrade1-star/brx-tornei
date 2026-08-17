'use client';

import { useId } from 'react';
import { getAvatarById } from '@/lib/avatars';
import { getStarAngles, getStarFlamePaths, getStarPoints, MAX_RANK_STARS, rankStarsForWins } from '@/lib/rank';
import { cn } from '@/lib/utils';

export interface ProfileRankBadgeProps {
  avatarId?: string;
  gamertag: string;
  wins?: number;
  starCount?: number;
  onClick?: () => void;
  className?: string;
  interactive?: boolean;
  hidePill?: boolean;
  onFire?: boolean;
  winStreak?: number;
}

/**
 * Badge profilo vettoriale con stelle di grado grandi, nitide e fiamme scolpite ad alta definizione.
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
  const flameOuterGradId = `flame-outer-${uid}`;
  const flameInnerGradId = `flame-inner-${uid}`;
  const glowFilterId = `glow-${uid}`;

  const trackRadius = 32.8;
  const starOuterR = stars >= 4 ? 4.3 : 4.8;
  const starInnerR = starOuterR * 0.44;

  const content = (
    <>
      <div className={cn('relative h-16 w-16 transition-transform duration-200 group-hover:scale-105 sm:h-20 sm:w-20', isBurning && 'flame-ring-aura rounded-full')}>
        <svg viewBox="0 0 80 80" className={cn('absolute inset-0 h-full w-full pointer-events-none transition-all duration-300', isBurning ? 'drop-shadow-[0_0_16px_rgba(255,80,0,0.8)]' : 'drop-shadow-[0_0_12px_rgba(245,158,11,0.35)]')} aria-hidden="true">
          <defs>
            <linearGradient id={ringGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              {isBurning ? (
                <>
                  <stop offset="0%" stopColor="#FFF275" /><stop offset="30%" stopColor="#FF7700" /><stop offset="70%" stopColor="#FF2200" /><stop offset="100%" stopColor="#FF9900" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#FCD34D" /><stop offset="35%" stopColor="#F59E0B" /><stop offset="70%" stopColor="#D97706" /><stop offset="100%" stopColor="#FDE68A" />
                </>
              )}
            </linearGradient>

            <linearGradient id={flameOuterGradId} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#DC2626" stopOpacity="0.95" /><stop offset="45%" stopColor="#EA580C" stopOpacity="0.9" /><stop offset="80%" stopColor="#F59E0B" stopOpacity="0.85" /><stop offset="100%" stopColor="#FEF08A" stopOpacity="0" />
            </linearGradient>

            <linearGradient id={flameInnerGradId} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#EA580C" /><stop offset="50%" stopColor="#FBBF24" /><stop offset="100%" stopColor="#FFFFFF" />
            </linearGradient>

            <linearGradient id={starGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              {isBurning ? (
                <>
                  <stop offset="0%" stopColor="#FFFFFF" /><stop offset="35%" stopColor="#FEF08A" /><stop offset="70%" stopColor="#FBBF24" /><stop offset="100%" stopColor="#EA580C" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#FFFBEB" /><stop offset="40%" stopColor="#FBBF24" /><stop offset="100%" stopColor="#D97706" />
                </>
              )}
            </linearGradient>

            <filter id={glowFilterId} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation={isBurning ? '0.8' : '0.6'} floodColor={isBurning ? '#FF3300' : '#F59E0B'} floodOpacity="0.9" />
            </filter>
          </defs>

          <circle cx="40" cy="40" r="37" fill="#080d1a" />
          <circle cx="40" cy="40" r={trackRadius} fill="none" stroke={isBurning ? '#180a06' : '#0f172a'} strokeWidth="9.5" />
          <circle cx="40" cy="40" r="37" fill="none" stroke={`url(#${ringGradId})`} strokeWidth={isBurning ? '2.8' : '2.4'} />
          <circle cx="40" cy="40" r="27.5" fill="none" stroke={isBurning ? 'rgba(255,140,0,0.5)' : 'rgba(255,255,255,0.22)'} strokeWidth="1.8" />

          {angles.map((angle, idx) => {
            const rad = (angle * Math.PI) / 180;
            const sx = 40 + trackRadius * Math.cos(rad);
            const sy = 40 + trackRadius * Math.sin(rad);
            const points = getStarPoints(sx, sy, starOuterR, starInnerR, angle);

            if (isBurning) {
              const { outer, inner } = getStarFlamePaths(sx, sy);
              return (
                <g key={idx}>
                  <path d={outer} fill={`url(#${flameOuterGradId})`} className="flame-tongue-outer" style={{ animationDelay: `${(idx * 0.18).toFixed(2)}s` }} />
                  <path d={inner} fill={`url(#${flameInnerGradId})`} className="flame-tongue-inner" style={{ animationDelay: `${(idx * 0.22 + 0.1).toFixed(2)}s` }} />
                  <polygon points={points} fill={`url(#${starGradId})`} stroke="#7F1D1D" strokeWidth="0.5" filter={`url(#${glowFilterId})`} className="flame-star-core" style={{ animationDelay: `${(idx * 0.15).toFixed(2)}s` }} />
                  <circle cx={sx} cy={sy - 5.5} r={0.65} fill="#FEF08A" className="flame-ember-1" style={{ animationDelay: `${(idx * 0.25).toFixed(2)}s` }} />
                </g>
              );
            }

            return (
              <polygon key={idx} points={points} fill={`url(#${starGradId})`} stroke="#78350F" strokeWidth="0.5" filter={`url(#${glowFilterId})`} />
            );
          })}
        </svg>

        <div className="absolute inset-[13px] grid place-items-center rounded-full overflow-hidden sm:inset-[15px]">
          <div className={cn('grid h-full w-full place-items-center rounded-full bg-gradient-to-b from-slate-900 via-header-bg to-black p-0.5 shadow-inner transition-colors', isBurning && 'from-amber-950/60 via-slate-950 to-black', activeAvatar.bgGradient)}>
            <AvatarIcon className={cn('h-[30px] w-[30px] transition-transform duration-200 sm:h-[36px] sm:w-[36px] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]', interactive && 'group-hover:scale-110')} />
          </div>
        </div>
      </div>

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
        className={cn('group relative flex flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-full', className)}
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
