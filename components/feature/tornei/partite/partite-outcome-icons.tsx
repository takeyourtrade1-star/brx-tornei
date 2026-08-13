import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
}

/**
 * Emblemi animati degli esiti di battaglia (registro /partite).
 * Come le icone stats: SVG puri + loop CSS in globals.css (prefisso `pt-`).
 */

function Sword() {
  return (
    <g>
      <path d="M11.2 3.6h1.6l-.2 11-0.6 1.6-.6-1.6z" className="fill-current" />
      <rect x="9.6" y="14.8" width="4.8" height="1.5" rx="0.75" className="fill-marquee" />
      <rect x="11.35" y="16.3" width="1.3" height="2.9" rx="0.65" className="fill-current opacity-55" />
      <circle cx="12" cy="19.9" r="0.85" className="fill-marquee" />
    </g>
  );
}

/** Vittoria: spade incrociate d'oro con bagliore e riflesso che corre sulla lama. */
export function WinEmblem({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <circle cx="12" cy="12" r="8.2" className="pt-win-glow fill-current opacity-10" />
      <g className="pt-win-blade-l">
        <Sword />
        <path className="pt-win-glint" d="M11.7 5.8 12.3 10.2" stroke="white" strokeWidth="0.8" strokeLinecap="round" />
      </g>
      <g className="pt-win-blade-r">
        <Sword />
      </g>
    </svg>
  );
}

/** Sconfitta: scudo spezzato che trema a scatti. */
export function LossEmblem({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <g className="pt-rot pt-loss-shake">
        <path
          d="M12 2.2l7.4 2.9v5.9c0 4.7-3.2 8-7.4 10.6-4.2-2.6-7.4-5.9-7.4-10.6V5.1z"
          className="fill-current"
        />
      </g>
      <path
        d="M7.6 7.4 10.4 9.8 9.2 12.6l2.4 3"
        stroke="header-bg"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** Abbandonata: bandiera bianca che sventola. */
export function AbandonedEmblem({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <path d="M5.6 3.2v17.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <g className="pt-flag-wave">
        <path d="M5.6 4.4h9.7l-1.7 2.8 1.7 2.8H5.6z" className="fill-current" />
      </g>
    </svg>
  );
}

/** Contestata: bilancia che oscilla con piatti contro-bilanciati. */
export function DisputedEmblem({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <g className="pt-rot pt-scales-beam">
        <path d="M3.2 12.4h17.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M12 4.4v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M9.2 4.4h5.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M12 12.4 10.6 9.8M12 12.4l1.4-2.6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
      </g>
      <g className="pt-scales-pan-l">
        <path d="M5.6 12.4v2.2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M3.5 16.4a2.1 1.6 0 0 1 4.2 0z" className="fill-current opacity-55" />
      </g>
      <g className="pt-scales-pan-r">
        <path d="M18.4 12.4v2.2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M16.3 16.4a2.1 1.6 0 0 1 4.2 0z" className="fill-current opacity-55" />
      </g>
    </svg>
  );
}
