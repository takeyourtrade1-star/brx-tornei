import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
}

/**
 * Icone animate ad alta fedeltà per le statistiche delle partite.
 * Grafica ricca, proporzioni grandi e micro-animazioni CSS dedicate.
 */

/** Corona Imperiale (Vittorie): archi dorati sfaccettati con rubino e perle scintillanti. */
export function CrownStatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-6 w-6 overflow-visible', className)}>
      <g className="pt-crown-body">
        <path
          d="M3 17 L2 7.5 L7.5 11.5 L12 3 L16.5 11.5 L22 7.5 L21 17 Z"
          className="fill-current"
          stroke="currentColor"
          strokeWidth="0.6"
        />
        <path d="M3 17.5 H21 V20 H3 Z" className="fill-current opacity-70" />
        <circle cx="2" cy="7.5" r="1.2" className="fill-white" />
        <circle cx="12" cy="3" r="1.5" className="fill-white" />
        <circle cx="22" cy="7.5" r="1.2" className="fill-white" />
        <polygon points="12,8.5 14,11.5 12,14.5 10,11.5" className="fill-rose-500 animate-pulse" />
      </g>
      <path
        className="pt-crown-spark fill-white drop-shadow-[0_0_4px_#FCD34D]"
        d="M20 2 L20.8 3.5 L22.5 4 L20.8 4.5 L20 6 L19.2 4.5 L17.5 4 L19.2 3.5 Z"
      />
    </svg>
  );
}

/** Cristallo Arcano (Win Rate): gemma prismatica a carica energetica. */
export function CrystalStatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-6 w-6 overflow-visible', className)}>
      <polygon points="12,1.5 20.5,7.5 12,22.5 3.5,7.5" className="fill-current opacity-30" stroke="currentColor" strokeWidth="0.8" />
      <polygon points="12,1.5 3.5,7.5 12,12" className="fill-current" />
      <polygon points="12,1.5 20.5,7.5 12,12" className="fill-current opacity-65" />
      <polygon points="3.5,7.5 12,12 12,22.5" className="fill-current opacity-45" />
      <polygon points="12,12 20.5,7.5 12,22.5" className="fill-current opacity-20" />
      <polygon points="12,10.5 14.5,13.5 12,16.5 9.5,13.5" className="pt-crystal-fill fill-white" />
      <path
        className="pt-crystal-glint"
        d="M8.5 4.5 L5.5 7.5"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Fiamma Viva (Striscia Record): fuoco a tre livelli termici con ondeggiamento. */
export function FlameStatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-6 w-6 overflow-visible', className)}>
      <g className="pt-flame-outer">
        <path
          d="M12 1.5 C16 5.5 20 9 20 14 C20 18.5 16.5 22.5 12 22.5 C7.5 22.5 4 18.5 4 14 C4 9 8 5.5 12 1.5 Z"
          className="fill-current opacity-40"
        />
      </g>
      <g className="pt-flame-inner">
        <path
          d="M12 4.5 C15 7.5 17.5 10 17.5 14 C17.5 17 15 20 12 20 C9 20 6.5 17 6.5 14 C6.5 10 9 7.5 12 4.5 Z"
          className="fill-current"
        />
      </g>
      <path d="M12 12.5 C13.5 12.5 14.5 14 14.5 15.5 C14.5 17 13.5 18 12 18 C10.5 18 9.5 17 9.5 15.5 C9.5 14 10.5 12.5 12 12.5 Z" className="fill-white" />
      <circle cx="12" cy="7" r="0.9" fill="#FFFBEB" className="animate-ping" />
    </svg>
  );
}

/** Clessidra Celestiale (Tempo di Gioco): flusso continuo di sabbia dorata. */
export function HourglassStatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-6 w-6 overflow-visible', className)}>
      <g className="pt-rot pt-hourglass-body">
        <path
          d="M4.5 2 H19.5 V5.5 L14 12 L19.5 18.5 V22 H4.5 V18.5 L10 12 L4.5 5.5 Z"
          className="fill-current opacity-30"
          stroke="currentColor"
          strokeWidth="0.8"
        />
        <polygon points="7,6 17,6 12,11.5" className="fill-current opacity-60" />
        <polygon points="7,20 17,20 12,14" className="fill-current opacity-85" />
        <line x1="12" y1="11.5" x2="12" y2="15.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" className="pt-hourglass-sand" />
        <circle cx="12" cy="18" r="1" fill="#FEF08A" className="animate-pulse" />
      </g>
    </svg>
  );
}

/** Cronometro Precisione (Durata Media): ghiera da torneo con scatto lancetta. */
export function WatchStatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-6 w-6 overflow-visible', className)}>
      <rect x="10" y="1" width="4" height="3.5" rx="1.5" className="fill-current" />
      <circle cx="12" cy="13" r="8.5" className="fill-current opacity-20" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="13" r="6.5" className="fill-current opacity-30" />
      {/* Tacche ghiera */}
      <line x1="12" y1="5.5" x2="12" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="12" y1="19" x2="12" y2="20.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="4.5" y1="13" x2="6" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="18" y1="13" x2="19.5" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <g className="pt-rot pt-watch-hand">
        <path d="M12 13 L12 7.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 13 L15.5 15.5" stroke="#38BDF8" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      <circle cx="12" cy="13" r="1.3" className="fill-white" />
    </svg>
  );
}

/** Teschio Demoniaco (Sconfitte): cranio d'ossidiana con occhi ardenti carminio. */
export function SkullStatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-6 w-6 overflow-visible', className)}>
      <g className="pt-rot pt-skull-sway">
        <path
          d="M12 2 C7 2 3.5 5.5 3.5 10 C3.5 13 5 15.5 6.5 17.5 V21 H17.5 V17.5 C19 15.5 20.5 13 20.5 10 C20.5 5.5 17 2 12 2 Z"
          className="fill-current"
          stroke="currentColor"
          strokeWidth="0.8"
        />
        <path d="M6.5 17.5 H17.5 V21 H6.5 Z" className="fill-current" />
        <line x1="9" y1="17.5" x2="9" y2="21" stroke="#080d1a" strokeWidth="1.2" />
        <line x1="12" y1="17.5" x2="12" y2="21" stroke="#080d1a" strokeWidth="1.2" />
        <line x1="15" y1="17.5" x2="15" y2="21" stroke="#080d1a" strokeWidth="1.2" />
        <ellipse cx="8.5" cy="10" rx="1.8" ry="2.2" className="pt-skull-eyes fill-[#080d1a]" />
        <ellipse cx="15.5" cy="10" rx="1.8" ry="2.2" className="pt-skull-eyes fill-[#080d1a]" />
        <circle cx="8.5" cy="10" r="1" fill="#F43F5E" className="animate-pulse" />
        <circle cx="15.5" cy="10" r="1" fill="#F43F5E" className="animate-pulse" />
        <polygon points="12,12 10.5,14.5 13.5,14.5" fill="#080d1a" />
      </g>
    </svg>
  );
}

/** Egida d'Onore (Fair Play): scudo templare con croce e timbro di purezza. */
export function ShieldStatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-6 w-6 overflow-visible', className)}>
      <g className="pt-shield-pulse">
        <path
          d="M12 1.5 L21 5 V11.5 C21 17 17 21 12 23 C7 21 3 17 3 11.5 V5 Z"
          className="fill-current opacity-30"
          stroke="currentColor"
          strokeWidth="0.8"
        />
        <path
          d="M12 3 L19 6 V11.5 C19 16 16 19.5 12 21 C8 19.5 5 16 5 11.5 V6 Z"
          className="fill-current"
        />
      </g>
      <path
        className="pt-shield-stamp"
        d="M8.5 11.5 L11 14 L16 8.5"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
