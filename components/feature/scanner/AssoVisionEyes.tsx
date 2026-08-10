'use client';

import { cn } from '@/lib/utils';

/**
 * Occhi della mascotte "Asso" ripresi dal frontend principale (face-svgs.ts):
 * cerchi bianchi con pupilla scura e highlight. Qui rappresentano "Asso Vision":
 * è Asso che analizza la carta per l'utente — le pupille scorrono (scanning) e
 * ogni tanto sbatte le palpebre. Componente autonomo, nessuna dipendenza esterna.
 */
export function AssoVisionEyes({
  size = 40,
  active = true,
  className,
}: {
  /** Lato in px del riquadro occhi. */
  size?: number;
  /** Anima lo sguardo (scanning + blink) e accende il bagliore arancione. */
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size * 0.62 }}
      aria-hidden
    >
      <svg
        viewBox="14 20 72 36"
        width={size}
        height={size * 0.62}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn('asso-eyes', active && 'asso-eyes--active')}
      >
        {/* Bagliore scanner dietro gli occhi */}
        <g className="asso-glow">
          <circle cx="35" cy="39" r="14" fill="#FF7300" opacity="0.18" />
          <circle cx="65" cy="39" r="14" fill="#FF7300" opacity="0.18" />
        </g>

        <g className="asso-lid">
          {/* Occhio sinistro — alone chiaro + contorno scuro */}
          <circle cx="35" cy="39" r="11.5" stroke="#faf9f6" strokeWidth="3.5" />
          <circle cx="35" cy="39" r="11.5" stroke="#3a463b" strokeWidth="2.5" />
          {/* Occhio destro */}
          <circle cx="65" cy="39" r="11.5" stroke="#faf9f6" strokeWidth="3.5" />
          <circle cx="65" cy="39" r="11.5" stroke="#3a463b" strokeWidth="2.5" />

          {/* Pupille + highlight che seguono la carta */}
          <g className="asso-gaze">
            <circle cx="35" cy="40" r="5.6" fill="#3a463b" />
            <circle cx="32.3" cy="36.4" r="2.2" fill="#faf9f6" />
            <circle cx="65" cy="40" r="5.6" fill="#3a463b" />
            <circle cx="62.3" cy="36.4" r="2.2" fill="#faf9f6" />
          </g>
        </g>
      </svg>
    </span>
  );
}
