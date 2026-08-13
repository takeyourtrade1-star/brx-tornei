import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
}

/**
 * Icone custom animate dei titoli negativi (segnalazioni).
 * Stesso stile dei positivi: SVG puri + loop CSS in globals.css.
 */

/** Offensivo: volto arrabbiato con sopracciglia che si increspano. */
export function OffensiveBadgeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <circle cx="12" cy="12.4" r="8.8" className="fill-current opacity-20" />
      <circle cx="12" cy="12.4" r="7.4" className="fill-current" />
      <g className="pt-angry-brows" stroke="header-bg" strokeWidth="1.5" strokeLinecap="round">
        <path d="M7.5 8.7l3 1.8" />
        <path d="M16.5 8.7l-3 1.8" />
      </g>
      <circle cx="9.2" cy="11.6" r="1.05" className="fill-header-bg" />
      <circle cx="14.8" cy="11.6" r="1.05" className="fill-header-bg" />
      <path
        d="M9 15.9c1.8-1.4 4.2-1.4 6 0"
        stroke="header-bg"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <g className="pt-angry-mark fill-white">
        <path d="M18.2 3.4l1.1 2.4 2.4 1.1-2.4 1.1-1.1 2.4-1.1-2.4-2.4-1.1 2.4-1.1z" />
      </g>
    </svg>
  );
}

/** Scorretto: carta da gioco inclinata con slash che sferza. */
export function UnfairBadgeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <g transform="rotate(-8 12 12)">
        <rect x="5" y="3.6" width="14" height="16.8" rx="2" className="fill-current" />
        <rect x="6.2" y="4.8" width="11.6" height="14.4" rx="1.3" className="fill-header-bg opacity-85" />
        <path d="M12 7.4l2.7 2.8-2.7 2.8-2.7-2.8z" className="fill-white opacity-80" />
      </g>
      <path
        className="pt-card-slash"
        d="M3.4 5 20.6 19"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        opacity="0"
      />
    </svg>
  );
}

/** Laggava: barre di segnale con la terza che trema e si incrina. */
export function LaggyBadgeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <rect x="4.2" y="13.2" width="3.4" height="7.2" rx="1.1" className="fill-current opacity-45" />
      <rect x="10.3" y="9.8" width="3.4" height="10.6" rx="1.1" className="fill-current opacity-70" />
      <g className="pt-sig-top">
        <rect x="16.4" y="5.4" width="3.4" height="15" rx="1.1" className="fill-current" />
      </g>
    </svg>
  );
}

/** Perditempo: clessidra con sabbia che si inceppa e colpo per sbloccarla. */
export function StallerBadgeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <g className="pt-stuck-nudge">
        <path
          d="M6.4 3h11.2v3l-4.6 5 4.6 5v5H6.4v-5l4.6-5-4.6-5z"
          className="fill-current opacity-30"
        />
        <path d="M9 5.8 12 9l3-3.2V5.2H9z" className="fill-current opacity-65" />
        <path d="M9 18.2 12 15l3 3.2v2H9z" className="fill-current opacity-85" />
      </g>
      <rect className="pt-stuck-sand fill-white" x="11.5" y="10.4" width="1" height="2.4" rx="0.5" />
    </svg>
  );
}

/** Arrogante: corona rovesciata che annuisce con un riflesso sprezzante. */
export function ArrogantBadgeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <g className="pt-smug-tilt">
        <path d="M4.6 16.4 3.2 9.8l4.6 3 4.2-7.4 4.2 7.4 4.6-3-1.4 6.6z" className="fill-current" />
        <path
          d="M4.6 18h14.8c0 1.5-1.1 2.6-2.5 2.6H7.1c-1.4 0-2.5-1.1-2.5-2.6z"
          className="fill-current opacity-55"
        />
        <path
          className="pt-smug-glint"
          d="M15.6 7.2l1.5 2.2"
          stroke="white"
          strokeWidth="1.1"
          strokeLinecap="round"
          opacity="0"
        />
      </g>
    </svg>
  );
}
