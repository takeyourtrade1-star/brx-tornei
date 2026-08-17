'use client';

import { Star } from 'lucide-react';
import { getAvatarById } from '@/lib/avatars';
import { getRankTierInfo, MAX_RANK_STARS, rankStarsForWins } from '@/lib/rank';
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
}

/**
 * Badge profilo pixel-perfect con icona avatar, cerchio di grado dorato,
 * stelle di reputazione disposte ad arco simmetrico sul bordo destro e
 * pillola gamertag centrata in basso.
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
}: ProfileRankBadgeProps) {
  const activeAvatar = getAvatarById(avatarId);
  const AvatarIcon = activeAvatar.icon;
  const stars = typeof starCount === 'number' ? starCount : rankStarsForWins(wins);
  const tier = getRankTierInfo(wins);

  const content = (
    <>
      {/* Cerchio del Grado (Rank Ring) con bagliore e scanalatura */}
      <div
        className={cn(
          'relative grid place-items-center rounded-full border-2 bg-gradient-to-b from-amber-500/25 via-slate-950/90 to-slate-950 p-1.5 transition-all duration-200',
          '[--rank-ring:26px] sm:[--rank-ring:31px]',
          tier.ringBorderColor,
          tier.ringGlowColor,
          interactive && 'group-hover:scale-105 group-hover:border-amber-300',
        )}
      >
        {/* Icona Avatar centrale */}
        <div
          className={cn(
            'grid h-[48px] w-[48px] place-items-center rounded-full border-2 border-white/25 bg-gradient-to-b from-slate-900 via-header-bg to-black p-2 shadow-2xl transition-all sm:h-[58px] sm:w-[58px] sm:p-2.5',
            activeAvatar.bgGradient,
          )}
        >
          <AvatarIcon
            className={cn(
              'h-5 w-5 transition-transform sm:h-7 sm:w-7 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]',
              interactive && 'group-hover:scale-110',
              activeAvatar.color,
            )}
          />
        </div>

        {/* Stelle di grado ad arco simmetrico sul fianco destro */}
        <RankStarsArc count={stars} />
      </div>

      {/* Gamertag sovrapposto in basso */}
      {!hidePill && (
        <span
          className={cn(
            'absolute -bottom-2.5 z-20 inline-flex max-w-[6.5rem] items-center justify-center truncate rounded-full border border-white/25 bg-slate-950/95 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xl backdrop-blur-md transition-colors sm:max-w-[8.5rem] sm:text-[10px]',
            interactive && 'group-hover:border-primary/70 group-hover:text-primary',
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

/**
 * Arco di stelle trigonometricamente simmetrico sul fianco destro (ore 3:00).
 * Calcola l'angolo di ciascuna stella per garantire una distribuzione bilanciata
 * senza mai sovrapporsi (passo angolare >= 24° con distanza interasse >= 13px).
 */
function RankStarsArc({ count }: { count: number }) {
  const safeCount = Math.max(1, Math.min(count, MAX_RANK_STARS));
  const angleStep = 24; // gradi di separazione tra ogni stella

  return (
    <>
      <span className="sr-only">
        Grado {safeCount} {safeCount === 1 ? 'stella' : 'stelle'}
      </span>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {Array.from({ length: safeCount }, (_, i) => {
          // Centra l'arco attorno a 0° (fianco destro / ore 3)
          const offset = i - (safeCount - 1) / 2;
          const angle = offset * angleStep;

          return (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-300"
              style={{
                transform: `rotate(${angle}deg) translateX(var(--rank-ring)) rotate(${-angle}deg)`,
              }}
            >
              <Star className="h-2 w-2 fill-amber-300 text-amber-300 drop-shadow-[0_0_3px_rgba(245,158,11,0.95)] sm:h-2.5 sm:w-2.5" />
            </span>
          );
        })}
      </div>
    </>
  );
}
