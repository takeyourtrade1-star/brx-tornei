import { cn } from '@/lib/utils';
import type { MatchConnectionLevel } from '@/lib/validations/match-feedback';

interface IconProps {
  className?: string;
}

/**
 * Icone del questionario di fine partita (rapporto di battaglia):
 * barre di segnale per la connessione e timbro del rapporto inviato.
 */

/**
 * Barre di segnale a tre livelli: la barra piena più alta pulsa leggermente,
 * come un segnale vivo.
 */
export function ConnectionBarsIcon({
  level,
  className,
}: IconProps & { level: MatchConnectionLevel }) {
  const filled = level === 'smooth' ? 3 : level === 'some_issues' ? 2 : 1;
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-5 w-5', className)}>
      <rect
        x="4.2"
        y="13.2"
        width="3.4"
        height="7.2"
        rx="1.1"
        className={cn('fill-current', filled >= 1 ? 'opacity-95' : 'opacity-25')}
      />
      <rect
        x="10.3"
        y="9.8"
        width="3.4"
        height="10.6"
        rx="1.1"
        className={cn('fill-current', filled >= 2 ? 'opacity-95' : 'opacity-25')}
      />
      <rect
        x="16.4"
        y="5.4"
        width="3.4"
        height="15"
        rx="1.1"
        className={cn('fill-current', filled >= 3 ? 'pt-conn-top opacity-95' : 'opacity-25')}
      />
    </svg>
  );
}

/** Timbro "rapporto inviato": anello inchiostro + check che colpisce la carta. */
export function ReportStampIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-8 w-8', className)}>
      <g className="pt-stamp-in">
        <circle cx="12" cy="12" r="8.8" className="fill-current opacity-15" />
        <circle
          cx="12"
          cy="12"
          r="8.2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="3.2 2.8"
        />
        <path
          d="M8.6 12.3l2.4 2.4 4.4-5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
