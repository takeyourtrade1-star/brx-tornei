'use client';

import { useId } from 'react';
import { getAvatarById } from '@/lib/avatars';
import { MAX_RANK_STARS, rankStarsForWins } from '@/lib/rank';
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
 * Calcola i punti di un poligono a stella a 5 punte con precisione SVG.
 */
function getStarPoints(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  rotationDeg: number = 0,
): string {
  const points: string[] = [];
  const rotRad = (rotationDeg - 90) * (Math.PI / 180);
  for (let i = 0; i < 10; i++) {
    const angle = rotRad + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? rOuter : rInner;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(' ');
}

/**
 * Calcola gli angoli delle stelle lungo l'arco destro (-14°..45°),
 * posizionate a debita distanza di sicurezza sopra la pillola del gamertag.
 */
function getStarAngles(count: number): number[] {
  const safeCount = Math.max(1, Math.min(count, MAX_RANK_STARS));
  if (safeCount === 1) return [24];
  if (safeCount === 2) return [12, 36];
  if (safeCount === 3) return [2, 23, 44];
  if (safeCount === 4) return [-8, 9, 26, 44];
  return [-14, 0, 15, 30, 45];
}

/**
 * Badge profilo pixel-perfect vettoriale:
 * - Bordo dorato metallico con bagliore ambrato
 * - Canale di grado concentrico scuro (track)
 * - Stelle di grado vettoriali posizionate rigorosamente ALL'INTERNO del bordo
 * - Icona avatar centrale con gradiente
 * - Pillola gamertag centrata in basso
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
  const angles = getStarAngles(stars);
  const uid = useId().replace(/:/g, '');

  const goldGradId = `gold-ring-${uid}`;
  const starGradId = `gold-star-${uid}`;
  const glowFilterId = `star-glow-${uid}`;

  // Geometria viewBox 80x80 (centro 40,40)
  const trackRadius = 32.5;
  const starOuterR = stars >= 4 ? 3.2 : 3.5;
  const starInnerR = starOuterR * 0.45;

  const content = (
    <>
      <div className="relative h-16 w-16 transition-transform duration-200 group-hover:scale-105 sm:h-20 sm:w-20">
        {/* Strato SVG: Anello di Grado dorato + Canale + Stelle interne */}
        <svg
          viewBox="0 0 80 80"
          className="absolute inset-0 h-full w-full pointer-events-none drop-shadow-[0_0_14px_rgba(245,158,11,0.35)]"
          aria-hidden="true"
        >
          <defs>
            {/* Gradiente dorato metallico per l'anello esterno */}
            <linearGradient id={goldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="35%" stopColor="#F59E0B" />
              <stop offset="70%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#FDE68A" />
            </linearGradient>

            {/* Gradiente gemma per le stelle */}
            <linearGradient id={starGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>

            {/* Bagliore stelle */}
            <filter id={glowFilterId} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="0.8" floodColor="#F59E0B" floodOpacity="0.9" />
            </filter>
          </defs>

          {/* Sfondo scuro del canale di grado */}
          <circle cx="40" cy="40" r="37" fill="#080d1a" />

          {/* Canale / Scanalatura delle stelle tra raggio 28 e 37 */}
          <circle
            cx="40"
            cy="40"
            r={trackRadius}
            fill="none"
            stroke="#0f172a"
            strokeWidth="8"
          />

          {/* Bordo dorato esterno (raggio 37, spessore 2.2) */}
          <circle
            cx="40"
            cy="40"
            r="37"
            fill="none"
            stroke={`url(#${goldGradId})`}
            strokeWidth="2.4"
          />

          {/* Bordo metallico interno che racchiude l'avatar (raggio 28) */}
          <circle
            cx="40"
            cy="40"
            r="28"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1.8"
          />

          {/* Stelle di grado disposte rigorosamente DENTRO la scanalatura */}
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
                stroke="#B45309"
                strokeWidth="0.4"
                filter={`url(#${glowFilterId})`}
              />
            );
          })}
        </svg>

        {/* Icona Avatar centrale */}
        <div className="absolute inset-[13px] grid place-items-center rounded-full overflow-hidden sm:inset-[15px]">
          <div
            className={cn(
              'grid h-full w-full place-items-center rounded-full bg-gradient-to-b from-slate-900 via-header-bg to-black p-1.5 shadow-inner',
              activeAvatar.bgGradient,
            )}
          >
            <AvatarIcon
              className={cn(
                'h-5 w-5 transition-transform duration-200 sm:h-6 sm:w-6 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]',
                interactive && 'group-hover:scale-110',
                activeAvatar.color,
              )}
            />
          </div>
        </div>
      </div>

      {/* Gamertag sovrapposto in basso */}
      {!hidePill && (
        <span
          className={cn(
            'absolute -bottom-2.5 z-20 inline-flex max-w-[6.5rem] items-center justify-center truncate rounded-full border border-white/25 bg-[#080d1a]/95 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xl backdrop-blur-md transition-colors sm:max-w-[8.5rem] sm:text-[10px]',
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
