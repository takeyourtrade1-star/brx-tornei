import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
}

/**
 * Emblemi animati degli esiti di battaglia per il registro partite.
 * Grafica vettoriale rifinita ad alto contrasto.
 */

function SwordBlade() {
  return (
    <g>
      <polygon points="11,2 13,2 13.5,13 12,15 10.5,13" className="fill-current" stroke="currentColor" strokeWidth="0.4" />
      <line x1="12" y1="2" x2="12" y2="13" stroke="white" strokeWidth="0.6" />
      <rect x="9" y="14" width="6" height="1.8" rx="0.9" className="fill-marquee" />
      <rect x="11.2" y="15.8" width="1.6" height="3.2" rx="0.6" className="fill-current opacity-60" />
      <circle cx="12" cy="19.8" r="1.1" className="fill-marquee" />
    </g>
  );
}

/** Vittoria: spade incrociate d'oro con clash scintillante. */
export function WinEmblem({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-6 w-6 overflow-visible', className)}>
      <circle cx="12" cy="12" r="9" className="pt-win-glow fill-current opacity-15" />
      <g className="pt-win-blade-l">
        <SwordBlade />
        <path className="pt-win-glint" d="M11.5 4.5 L12.5 9.5" stroke="white" strokeWidth="1" strokeLinecap="round" />
      </g>
      <g className="pt-win-blade-r">
        <SwordBlade />
      </g>
      <polygon points="12,9 13.5,11.5 16,12 13.5,12.5 12,15 10.5,12.5 8,12 10.5,11.5" fill="#FEF08A" className="animate-spin" style={{ animationDuration: '8s' }} />
    </svg>
  );
}

/** Sconfitta: scudo da battaglia spezzato con frattura cremisi. */
export function LossEmblem({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-6 w-6 overflow-visible', className)}>
      <g className="pt-rot pt-loss-shake">
        <path
          d="M12 2 L20 5.5 V12 C20 17 16.5 20.5 12 22.5 C7.5 20.5 4 17 4 12 V5.5 Z"
          className="fill-current"
          stroke="currentColor"
          strokeWidth="0.8"
        />
        <path
          d="M7 6.5 L11 10.5 L9 13.5 L12.5 17.5"
          stroke="#080d1a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="12" cy="12" r="1" fill="#F43F5E" className="animate-ping" />
      </g>
    </svg>
  );
}

/** Abbandonata: stendardo araldico su lancia che sventola al vento. */
export function AbandonedEmblem({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-6 w-6 overflow-visible', className)}>
      <line x1="4.5" y1="2" x2="4.5" y2="22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <polygon points="4.5,1 6,3 3,3" className="fill-current" />
      <g className="pt-flag-wave">
        <path
          d="M4.5 3.5 H17.5 L14.5 7.5 L17.5 11.5 H4.5 Z"
          className="fill-current"
          stroke="currentColor"
          strokeWidth="0.6"
        />
        <circle cx="10" cy="7.5" r="1.3" fill="#FFFBEB" />
      </g>
    </svg>
  );
}

/** Contestata: bilancia della giustizia con piatti oscillanti in contrapposizione. */
export function DisputedEmblem({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-6 w-6 overflow-visible', className)}>
      <g className="pt-rot pt-scales-beam">
        <line x1="2.5" y1="11.5" x2="21.5" y2="11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="12" y1="3.5" x2="12" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="9" y1="3.5" x2="15" y2="3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <polygon points="12,10 13.5,12.5 10.5,12.5" className="fill-current" />
      </g>
      <g className="pt-scales-pan-l">
        <line x1="5.5" y1="11.5" x2="5.5" y2="14.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2.5 17 A3 2 0 0 0 8.5 17 Z" className="fill-current opacity-70" stroke="currentColor" strokeWidth="0.8" />
      </g>
      <g className="pt-scales-pan-r">
        <line x1="18.5" y1="11.5" x2="18.5" y2="14.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M15.5 17 A3 2 0 0 0 21.5 17 Z" className="fill-current opacity-70" stroke="currentColor" strokeWidth="0.8" />
      </g>
    </svg>
  );
}
