'use client';

import { Check } from 'lucide-react';
import type { MatchBadgeDef } from '@/lib/data/match-badge-catalog';
import { cn } from '@/lib/utils';
import { BADGE_ICONS, BADGE_TONES } from './honor-badge-icons';

interface HonorBadgeCardProps {
  badge: MatchBadgeDef;
  index: number;
  selected: boolean;
  onSelect: () => void;
}

/** Mappa per i bagliori radiali di ciascun badge (ispirato a StatBadgeCard di /partite). */
const BADGE_GLOW_MAP: Record<string, string> = {
  friendly: 'rgba(52, 211, 153, 0.35)',
  kind: 'rgba(244, 63, 94, 0.35)',
  great_player: 'rgba(243, 199, 106, 0.45)',
  sportive: 'rgba(20, 184, 166, 0.35)',
  strategist: 'rgba(56, 189, 248, 0.35)',
  creative_genius: 'rgba(251, 191, 36, 0.4)',
  fast_play: 'rgba(6, 182, 212, 0.35)',
  mentor: 'rgba(167, 139, 250, 0.4)',
  funny: 'rgba(251, 146, 60, 0.4)',
  table_legend: 'rgba(254, 240, 138, 0.4)',
  offensive: 'rgba(244, 63, 94, 0.35)',
  unfair: 'rgba(239, 68, 68, 0.35)',
  laggy: 'rgba(148, 163, 184, 0.3)',
  staller: 'rgba(161, 161, 170, 0.3)',
  arrogant: 'rgba(217, 70, 239, 0.35)',
};

/**
 * Card di valutazione in stile gaming ricco ispirata alle card statistiche di /partite:
 * - Icona viva in primo piano con micro-animazione e icona full in filigrana;
 * - Bagliore radiale coordinato col titolo;
 * - Riflesso superiore in vetro ed effetto hover dinamico.
 */
export function HonorBadgeCard({
  badge,
  index,
  selected,
  onSelect,
}: HonorBadgeCardProps) {
  const Icon = BADGE_ICONS[badge.id];
  const tone = BADGE_TONES[badge.id];
  const glow = BADGE_GLOW_MAP[badge.id] ?? 'rgba(255, 115, 0, 0.3)';
  const isNegative = badge.kind === 'negative';

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      title={badge.description}
      style={{ animationDelay: `${Math.min(index, 14) * 35}ms` }}
      className={cn(
        'group relative flex flex-col items-center justify-between overflow-hidden rounded-2xl border p-3 text-center backdrop-blur-md transition-all duration-200 active:scale-95 sm:p-3.5',
        'min-h-[116px] sm:min-h-[124px]',
        selected
          ? cn(
              tone.ring,
              'scale-[1.03] shadow-xl shadow-black/60 ring-2',
              isNegative ? 'ring-rose-400' : 'ring-marquee/90',
            )
          : 'border-white/10 bg-slate-950/80 shadow-lg shadow-black/40 hover:-translate-y-1 hover:border-white/25 hover:bg-slate-900/90 hover:shadow-xl',
      )}
    >
      {/* Riflesso superiore in vetro */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />

      {/* Bagliore radiale ambient (acceso al passaggio mouse o alla selezione) */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 transition-opacity duration-300',
          selected ? 'opacity-80' : 'opacity-25 group-hover:opacity-60',
        )}
        style={{
          background: `radial-gradient(circle at 50% 35%, ${glow}, transparent 75%)`,
        }}
      />

      {/* Icona full di sfondo in filigrana stile StatBadgeCard */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-2 -right-2 h-16 w-16 opacity-15 transition-all duration-300 [mask-image:radial-gradient(circle_at_center,black_50%,transparent_90%)] group-hover:scale-110 group-hover:opacity-30 sm:h-20 sm:w-20"
      >
        <Icon className={cn('h-full w-full', tone.icon)} />
      </div>

      {/* Badge check visivo quando selezionato */}
      {selected && (
        <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-white text-slate-950 shadow-md">
          <Check className="h-3 w-3 stroke-[3]" />
        </span>
      )}

      {/* Icona centrale in primo piano con micro-animazione viva */}
      <div className="relative mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/[0.06] p-2 shadow-inner transition-transform duration-200 group-hover:scale-110 group-hover:border-white/30">
        <Icon className={cn('h-6 w-6 transition-transform duration-200', tone.icon)} />
      </div>

      {/* Dati del badge: nome ed etichetta sintetica */}
      <div className="relative mt-2 min-w-0 w-full px-0.5">
        <span
          className={cn(
            'block truncate font-display text-xs font-black tracking-tight transition-colors sm:text-[13px]',
            selected ? 'text-white' : 'text-white/85 group-hover:text-white',
          )}
        >
          {badge.label}
        </span>
        <span className="mt-0.5 block truncate text-[9px] font-medium text-white/50 transition-colors group-hover:text-white/70">
          {badge.description}
        </span>
      </div>
    </button>
  );
}
