'use client';

import { FORMATS } from '@/lib/data/catalog';
import { legalityLabel } from '@/lib/card-legality-label';
import type { FormatId } from '@/lib/data/catalog';
import type { TournamentLegalities } from '@/types/card-legality';
import { cn } from '@/lib/utils';

interface CardLegalityBadgesProps {
  legalities?: TournamentLegalities;
  compact?: boolean;
  highlightFormat?: FormatId;
}

function badgeClass(status: TournamentLegalities[FormatId]): string {
  switch (status) {
    case 'legal':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'restricted':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'banned':
      return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'not_legal':
      return 'bg-white/5 text-white/40 border-white/10';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function CardLegalityBadges({
  legalities,
  compact = false,
  highlightFormat,
}: CardLegalityBadgesProps) {
  if (!legalities) {
    return (
      <p className="text-[10px] text-white/40">Legalità non ancora verificata</p>
    );
  }

  return (
    <div className={cn('flex flex-wrap gap-1', compact ? 'max-w-[220px]' : '')}>
      {FORMATS.map((format) => {
        const status = legalities[format.id];
        const isHighlight = highlightFormat === format.id;
        return (
          <span
            key={format.id}
            title={`${format.name}: ${legalityLabel(status)}`}
            className={cn(
              'inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
              badgeClass(status),
              isHighlight && 'ring-1 ring-[#FF7300]/60'
            )}
          >
            {compact ? format.name.slice(0, 3) : format.name}
          </span>
        );
      })}
    </div>
  );
}
