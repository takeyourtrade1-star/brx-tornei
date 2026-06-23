import { cn } from '@/lib/utils';

/** Token CSS bottoni azione (dashboard + minigioco PC). */
export const TOURNAMENT_ACTION_BUTTON_TOKENS = {
  background: '#d9d9d9',
  border: '#878787',
  color: '#FF7300',
} as const;

/** Regole CSS inline per il minigioco (PcModal · Partecipa / Chiedi). */
export function tournamentActionButtonCssRules(selector = '.irg-ebx-join'): string {
  const { background, border, color } = TOURNAMENT_ACTION_BUTTON_TOKENS;
  return [
    `${selector}{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:4px 12px;`,
    `font-family:var(--font-sans, 'EB Garamond', Georgia, serif);font-size:11px;font-weight:700;`,
    `letter-spacing:0;color:${color};cursor:pointer;text-transform:none;background:${background};`,
    `border:1px solid ${border};box-shadow:none;transition:filter .15s ease;white-space:nowrap;}`,
    `${selector}:hover{filter:brightness(1.05);}`,
    `${selector}:active{filter:brightness(0.98);}`,
    `${selector} svg{flex-shrink:0;}`,
  ].join('');
}

/** Stile condiviso: pill bianco opaco, testo arancione bold (Crea torneo / Partecipa). */
export function tournamentActionButtonClass(size: 'md' | 'sm' = 'md') {
  return cn(
    'flex items-center rounded-full border border-stroke-grey bg-input-bg font-bold text-primary transition-[filter] hover:brightness-105 disabled:pointer-events-none disabled:opacity-50',
    size === 'md' ? 'gap-1.5 px-4 py-2 text-sm' : 'gap-1 px-3 py-1 text-xs',
  );
}

export const tournamentActionIconClass = 'h-3.5 w-3.5 shrink-0 text-primary';
