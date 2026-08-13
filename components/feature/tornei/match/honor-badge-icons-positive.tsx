import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
}

/**
 * Icone custom animate dei titoli positivi (stile honor).
 * Ogni icona ha il suo loop CSS in globals.css (prefisso `pt-`),
 * con pose di riposo per prefers-reduced-motion.
 */

/** Amichevole: stretta di mano, con alone pulsante nel punto di contatto. */
export function FriendlyBadgeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <g className="pt-hand-l">
          <path d="M2.8 10.8c4.4 0 6.2 2.7 6.2 5" />
          <path d="M9 15.8c0-1.9 1.1-3.2 2.9-3.6 1.3-.3 2.7.1 3.6 1.1" />
        </g>
        <g className="pt-hand-r">
          <path d="M21.2 10.8c-4.4 0-6.2 2.7-6.2 5" />
          <path d="M15 15.8c0-1.9-1.1-3.2-2.9-3.6-1.3-.3-2.7.1-3.6 1.1" />
        </g>
      </g>
      <circle className="pt-clasp-glow fill-current" cx="12" cy="12.8" r="1.5" />
    </svg>
  );
}

/** Gentile: cuore con doppio battito. */
export function KindBadgeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <g className="pt-heart-beat">
        <path
          d="M12 20.3S3.8 15.2 3.8 9.8c0-2.7 2-4.8 4.6-4.8 1.7 0 3.1.9 3.6 2.3.5-1.4 1.9-2.3 3.6-2.3 2.6 0 4.6 2.1 4.6 4.8 0 5.4-8.2 10.5-8.2 10.5z"
          className="fill-current"
        />
        <path
          d="M6.4 10.8c.9-1.8 2.5-3 4.6-3.2"
          stroke="white"
          strokeWidth="1.1"
          strokeLinecap="round"
          opacity="0.5"
        />
      </g>
    </svg>
  );
}

/** Ottimo giocatore: trofeo con riflesso che scorre sulla coppa. */
export function GreatPlayerBadgeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <path d="M7 3.4h10v3.1a5 5 0 0 1-10 0z" className="fill-current" />
      <path
        d="M7 4.6H5.2c-.9 1.4-.6 3 .4 4.2M17 4.6h1.8c.9 1.4.6 3-.4 4.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M12 11.5v2.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8.6 16.2h6.8l.8 2.2H7.8z" className="fill-current" />
      <path d="M8.3 20.6h7.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path
        className="pt-trophy-shine"
        d="M8.7 5.4 10.4 9.2"
        stroke="white"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0"
      />
    </svg>
  );
}

/** Spirito sportivo: scudo da cavaliere con nastro e check che timbra. */
export function SportiveBadgeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <g className="pt-shield-pulse">
        <path
          d="M4.2 4.6 12 2.2l7.8 2.4v5.2c0 4.6-3.3 7.9-7.8 10.4-4.5-2.5-7.8-5.8-7.8-10.4z"
          className="fill-current opacity-25"
        />
        <path
          d="M4.8 5.4 12 3.2l7.2 2.2v4.9c0 4.2-3 7.3-7.2 9.7-4.2-2.4-7.2-5.5-7.2-9.7z"
          className="fill-current"
        />
      </g>
      <path
        className="pt-shield-stamp"
        d="M8.6 11.2l2.5 2.5 4.4-5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6.2 16.6l1.4 3.6 4.4-2.8 4.4 2.8 1.4-3.6z" className="fill-current opacity-55" />
    </svg>
  );
}

/** Stratega: scacchiera con pedina che salta di casella in casella. */
export function StrategistBadgeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <rect x="3" y="7" width="12" height="12" rx="1.6" className="fill-current opacity-20" />
      <rect x="3" y="7" width="4" height="4" className="fill-current opacity-70" />
      <rect x="3" y="15" width="4" height="4" className="fill-current opacity-70" />
      <rect x="7" y="11" width="4" height="4" className="fill-current opacity-70" />
      <rect x="11" y="7" width="4" height="4" className="fill-current opacity-70" />
      <rect x="11" y="15" width="4" height="4" className="fill-current opacity-70" />
      <g className="pt-pawn-hop">
        <circle cx="5" cy="17" r="1.7" className="fill-white" />
        <path d="M4 17c0-1 .7-1.5 1-1.5s1 .5 1 1.5z" className="fill-header-bg opacity-70" />
      </g>
    </svg>
  );
}

/** Genio creativo: lampadina con filamento che si accende e raggi che spuntano. */
export function CreativeGeniusBadgeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <path
        d="M9.2 3h5.6c.6 2.5 2.2 4.3 2.2 6.6a5 5 0 0 1-10 0c0-2.3 1.6-4.1 2.2-6.6z"
        className="fill-current"
      />
      <path
        className="pt-bulb-glow"
        d="M9.3 9.9c.8-.9 1.8-1.3 2.7-1.3s1.9.4 2.7 1.3"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M9.4 16.4h5.2v1.7c0 .9-.7 1.7-1.6 1.7h-2c-.9 0-1.6-.8-1.6-1.7z"
        className="fill-current opacity-85"
      />
      <g className="pt-bulb-rays" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0">
        <path d="M12 19.8v2.2" />
        <path d="M7.4 3.2 6.2 1.6" />
        <path d="M16.6 3.2l1.2-1.6" />
      </g>
    </svg>
  );
}

/** Gioco veloce: fulmine con doppia scintilla laterale. */
export function FastPlayBadgeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <path d="M13.4 2.6 6 13h4.6l-1.6 8.4L16.8 10.8h-4.8z" className="fill-current" />
      <path d="M12 5.8 7.6 12.2h3.2l-1.1 5.8 5.6-7.2h-3.3z" className="fill-white opacity-35" />
      <g className="pt-bolt-spark-l fill-white" opacity="0">
        <path d="M4.4 6.4l.5 1.1 1.1.5-1.1.5-.5 1.1-.5-1.1-1.1-.5 1.1-.5z" />
      </g>
      <g className="pt-bolt-spark-r fill-white" opacity="0">
        <path d="M19.6 15.6l.4 1 1 .4-1 .4-.4 1-.4-1-1-.4 1-.4z" />
      </g>
    </svg>
  );
}

/** Maestro: pergamena con rune che si illuminano in sequenza. */
export function MentorBadgeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <path d="M5.8 4.4h12.4v12.6l-1.9 2.6H5.8z" className="fill-current opacity-25" />
      <path d="M6.6 5.8h10.8v9.4H6.6z" className="fill-current opacity-65" />
      <circle cx="5.8" cy="6.4" r="1.9" className="fill-current" />
      <circle cx="5.8" cy="17.2" r="1.9" className="fill-current" />
      <g stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path className="pt-rune-a" d="M8.2 9.4l1.5 2.2-1.5 2.2" />
        <path className="pt-rune-b" d="M12.2 9.4v4.4M10.4 11.6h3.6" />
        <path className="pt-rune-c" d="M15.8 9.4l1.1 4.4 1.1-4.4" />
      </g>
    </svg>
  );
}

/** Divertente: cappello da giullare con sonagli che tintinnano. */
export function FunnyBadgeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <path d="M12 3.2 18.6 14H5.4z" className="fill-current" />
      <path
        d="M5.4 14h13.2c0 1.9-1.5 3.4-3.3 3.4h-6.6c-1.8 0-3.3-1.5-3.3-3.4z"
        className="fill-current opacity-45"
      />
      <path d="M6.2 14.6 5.2 18.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M17.8 14.6l1 4.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <g className="pt-jester-bell-l">
        <circle cx="5" cy="20.3" r="1.5" className="fill-current" />
        <path d="M4.4 19.2l.7-1" stroke="white" strokeWidth="0.8" strokeLinecap="round" />
      </g>
      <g className="pt-jester-bell-r">
        <circle cx="19" cy="20.3" r="1.5" className="fill-current" />
        <path d="M19.6 19.2l-.7-1" stroke="white" strokeWidth="0.8" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Leggenda del tavolo: corona con aura radiante e gemma pulsante. */
export function TableLegendBadgeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <g
        className="pt-aura-spin"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.55"
      >
        <path d="M12 1.4v2" />
        <path d="M2.6 7.8l1.7 1" />
        <path d="M21.4 7.8l-1.7 1" />
        <path d="M4.2 17.6l2.1-.5" />
        <path d="M19.8 17.6l-2.1-.5" />
      </g>
      <path d="M4 15.8 2.9 9.9l4.3 2.9L12 5.8l4.8 7 4.3-2.9-1.1 5.9H4z" className="fill-current" />
      <path
        d="M4 17.2h16c0 1.6-1.2 2.8-2.8 2.8H6.8C5.2 20 4 18.8 4 17.2z"
        className="fill-current opacity-55"
      />
      <circle className="pt-legend-gem fill-white" cx="12" cy="10.4" r="1" />
    </svg>
  );
}
