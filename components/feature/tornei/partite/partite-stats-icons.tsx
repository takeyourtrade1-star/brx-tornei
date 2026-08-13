import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
}

/**
 * Icone custom animate delle tile stats (pagina /partite).
 * Server Components puri: ogni animazione è un loop CSS dichiarato in
 * globals.css (prefisso `pt-`), con pose di riposo leggibili quando
 * prefers-reduced-motion è attivo.
 */

/** Corona regale che ondeggia con una scintilla periodica. */
export function CrownStatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <g className="pt-crown-body">
        <path
          d="M4.2 16.8 2.8 9.4l4.4 3L12 5.2l4.8 7.2 4.4-3-1.4 7.4H4.2z"
          className="fill-current"
        />
        <rect x="4.2" y="18.2" width="15.6" height="2.2" rx="1.1" className="fill-current opacity-70" />
        <circle cx="7.2" cy="12.4" r="0.7" className="fill-white/75" />
        <circle cx="12" cy="5.2" r="0.8" className="fill-white/85" />
        <circle cx="16.8" cy="12.4" r="0.7" className="fill-white/75" />
      </g>
      <path
        className="pt-crown-spark fill-marquee"
        d="M19.4 3.4l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5z"
      />
    </svg>
  );
}

/** Cristallo sfaccettato che si carica di energia (win rate). */
export function CrystalStatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <path d="M12 2.6 17.8 8 12 21.4 6.2 8z" className="fill-current opacity-30" />
      <path d="M12 2.6 6.2 8 12 12.4z" className="fill-current" />
      <path d="M12 2.6 17.8 8 12 12.4z" className="fill-current opacity-65" />
      <path d="M6.2 8 12 12.4 12 21.4z" className="fill-current opacity-45" />
      <path d="M12 12.4l5.6-4.4L12 21.4z" className="fill-current opacity-15" />
      <path d="M12 13.4l2 2.2-2 2.1-2-2.1z" className="pt-crystal-fill fill-white/85" />
      <path
        className="pt-crystal-glint"
        d="M9.6 5 7.2 7.3"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0"
      />
    </svg>
  );
}

/** Fiamma a doppio velo che ondeggia. */
export function FlameStatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <g className="pt-flame-outer">
        <path
          d="M12 2.2c2.9 3.4 5.6 6.1 5.6 9.9a5.6 5.6 0 0 1-11.2 0c0-3.8 2.7-6.5 5.6-9.9z"
          className="fill-current opacity-45"
        />
      </g>
      <g className="pt-flame-inner">
        <path
          d="M12 4.6c2.1 2.5 4 4.5 4 7.3a4 4 0 0 1-8 0c0-2.8 1.9-4.8 4-7.3z"
          className="fill-current"
        />
      </g>
      <path d="M12 12.9a1.5 1.5 0 0 0 1.5 1.5c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5c0-.8.7-1.5 1.5-1.5z" className="fill-white/85" />
    </svg>
  );
}

/** Clessidra che si capovolge in loop con flusso di sabbia continuo. */
export function HourglassStatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <g className="pt-rot pt-hourglass-body">
        <path
          d="M6 2.8h12v3.4l-4.5 5.8 4.5 5.8v3.4H6v-3.4l4.5-5.8L6 6.2V2.8z"
          className="fill-current opacity-30"
        />
        <path d="M8.7 7 12 11.3 15.3 7V5.1H8.7z" className="fill-current opacity-60" />
        <path d="M8.7 17.4 12 13.7l3.3 3.7v1.8H8.7z" className="fill-current opacity-85" />
        <path d="M11.55 12.6h.9v2.6h-.9z" className="pt-hourglass-sand fill-white/90" />
      </g>
    </svg>
  );
}

/** Orologio da tasca con lancetta che ticchetta. */
export function WatchStatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <rect x="10.6" y="1.8" width="2.8" height="3.4" rx="1.2" className="fill-current" />
      <circle cx="12" cy="12.6" r="7.4" className="fill-current opacity-20" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12.6" r="5.6" className="fill-current opacity-25" />
      <g className="pt-rot pt-watch-hand">
        <path d="M12 12.6V7.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M12 12.6l2.8 2.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
      </g>
      <circle cx="12" cy="12.6" r="1" className="fill-current" />
    </svg>
  );
}

/** Teschio che dondola con orbite che si accendono. */
export function SkullStatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <g className="pt-rot pt-skull-sway">
        <path
          d="M12 2.6c3.9 0 6.6 2.7 6.6 6.4 0 2.6-1.5 4.4-2.7 6v2.2H8.1V15c-1.2-1.6-2.7-3.4-2.7-6 0-3.7 2.7-6.4 6.6-6.4z"
          className="fill-current"
        />
        <path d="M8.1 15.2h7.8v1.7H8.1z" className="fill-current" />
        <path d="M9.6 15.2v2M12 15.2v2M14.4 15.2v2" stroke="header-bg" strokeWidth="1.1" strokeLinecap="round" />
        <circle cx="9.3" cy="8.5" r="1.25" className="pt-skull-eyes fill-header-bg" />
        <circle cx="14.7" cy="8.5" r="1.25" className="pt-skull-eyes fill-header-bg" />
        <path d="M12 9.8 10.7 12h2.6z" className="fill-header-bg" />
      </g>
    </svg>
  );
}

/** Scudo che pulsa con un check che "timbra" periodicamente. */
export function ShieldStatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <g className="pt-shield-pulse">
        <path
          d="M12 2.2l7.4 2.9v5.9c0 4.7-3.2 8-7.4 10.6-4.2-2.6-7.4-5.9-7.4-10.6V5.1z"
          className="fill-current opacity-30"
        />
        <path
          d="M12 3.2 18.2 5.6v5.4c0 4.2-2.9 7.2-6.2 9.4-3.3-2.2-6.2-5.2-6.2-9.4V5.6z"
          className="fill-current"
        />
      </g>
      <path
        className="pt-shield-stamp"
        d="M8.7 11.9l2.4 2.4 4.3-4.8"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
