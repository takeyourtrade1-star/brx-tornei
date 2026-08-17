import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { ClashingSwordsIcon } from '@/components/feature/tornei/lobby/clashing-swords-icon';
import {
  CrownStatIcon,
  FlameStatIcon,
  ShieldStatIcon,
} from '@/components/feature/tornei/partite/partite-stats-icons';
import {
  FastPlayBadgeIcon,
  GreatPlayerBadgeIcon,
  SportiveBadgeIcon,
} from '@/components/feature/tornei/match/honor-badge-icons-positive';

interface AchievementIconProps {
  className?: string;
}

/** Esplosione e goccia: il primo risultato lascia il segno. */
function FirstBloodIcon({ className }: AchievementIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('overflow-visible', className)}>
      <g className="achievement-first-burst">
        <path d="M12 1.5 13.7 7l5-2.8-2.8 5L21.5 11l-5.6 1.8 2.8 5-5-2.8-1.7 5.5-1.7-5.5-5 2.8 2.8-5L2.5 11l5.6-1.8-2.8-5 5 2.8z" className="fill-current opacity-30" />
        <circle cx="12" cy="11" r="5.2" className="fill-current opacity-80" />
        <path d="m12 7.4 1.2 2.4 2.7.4-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.4z" className="fill-white" />
      </g>
      <path className="achievement-first-drop fill-current" d="M12 15.8c1.4 1.7 2.2 2.8 2.2 4a2.2 2.2 0 0 1-4.4 0c0-1.2.8-2.3 2.2-4Z" />
    </svg>
  );
}

/** Freccia di ritorno e germoglio: la sconfitta diventa esperienza. */
function ComebackIcon({ className }: AchievementIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('overflow-visible', className)}>
      <g className="achievement-comeback-ring" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19.2 8.4A8 8 0 1 0 19 16" />
        <path d="m18.7 3.8.5 4.6-4.6-.5" />
      </g>
      <g className="achievement-comeback-rise">
        <path d="M12 17.7v-7.2" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 13.1c-3.3 0-4.8-1.5-4.8-4.3 3.2 0 4.8 1.3 4.8 4.3Z" className="fill-current" />
        <path d="M12 10.8c2.9 0 4.4-1.4 4.4-3.9-2.9 0-4.4 1.2-4.4 3.9Z" className="fill-white opacity-80" />
      </g>
    </svg>
  );
}

/** Bersaglio da arena con colpo centrale pulsante. */
function ArenaTargetIcon({ className }: AchievementIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('overflow-visible', className)}>
      <g className="achievement-target-rings">
        <circle cx="11.5" cy="12.5" r="9" className="fill-current opacity-20" stroke="currentColor" strokeWidth="1.1" />
        <circle cx="11.5" cy="12.5" r="5.7" className="fill-current opacity-35" stroke="currentColor" strokeWidth="1.1" />
        <circle cx="11.5" cy="12.5" r="2.3" className="fill-current" />
      </g>
      <g className="achievement-target-arrow" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="m20.8 3.2-9.3 9.3" />
        <path d="m16.6 3.2 4.2 0 0 4.2" />
      </g>
    </svg>
  );
}

/** Stella-faro che illumina il ponte e invia un segnale periodico. */
function BeaconStarIcon({ className }: AchievementIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('overflow-visible', className)}>
      <g className="achievement-beacon-rays" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M19.8 4.2l-2.1 2.1M6.3 17.7l-2.1 2.1" />
      </g>
      <path className="achievement-beacon-star fill-current" d="m12 4.4 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z" />
      <circle cx="12" cy="11.8" r="2" className="fill-white" />
      <path d="M7 21h10l-2.1-6.1H9.1z" className="fill-current opacity-45" />
    </svg>
  );
}

export const ACHIEVEMENT_ICONS: Record<string, ComponentType<AchievementIconProps>> = {
  'first-win': FirstBloodIcon,
  'first-loss': ComebackIcon,
  'ten-games': ArenaTargetIcon,
  'ten-wins': GreatPlayerBadgeIcon,
  'fifty-wins': CrownStatIcon,
  'fair-play': SportiveBadgeIcon,
  'sharp-shooter': FastPlayBadgeIcon,
  'hot-streak': FlameStatIcon,
  veteran: ShieldStatIcon,
  'star-of-bridge': BeaconStarIcon,
  'swords-duellist': ClashingSwordsIcon,
};
