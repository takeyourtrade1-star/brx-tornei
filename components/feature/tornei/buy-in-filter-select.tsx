'use client';

import { BUY_IN_TIERS } from '@/lib/data/buy-in';
import type { TournamentFiltersState } from '@/lib/tournament-list-filters';
import { cn } from '@/lib/utils';
import { StyledSelect } from '@/components/ui/styled-select';

const BUY_IN_OPTIONS: { value: TournamentFiltersState['buyIn']; label: string }[] = [
  { value: 'all', label: 'Tutte' },
  ...BUY_IN_TIERS.map((t) => ({ value: t.id, label: t.label })),
];

interface BuyInFilterSelectProps {
  value: TournamentFiltersState['buyIn'];
  onChange: (buyIn: TournamentFiltersState['buyIn']) => void;
  /** id del trigger (accessibilità) */
  id?: string;
  className?: string;
  compact?: boolean;
  lightPanel?: boolean;
}

/** Filtro buy-in — pill stondata come gli altri filtri. */
export function BuyInFilterSelect({
  value,
  onChange,
  id = 'buy-in-filter',
  className,
  compact = false,
  lightPanel = false,
}: BuyInFilterSelectProps) {
  const isActive = value !== 'all';

  return (
    <div className={cn('flex shrink-0 items-center gap-2', className)}>
      <span
        id={`${id}-label`}
        className={cn(
          'shrink-0 font-bold uppercase tracking-wider text-white/40',
          compact ? 'sr-only' : 'text-[10px]',
        )}
      >
        Buy-In
      </span>
      <StyledSelect
        id={id}
        variant="pill"
        ariaLabelledBy={`${id}-label`}
        value={value}
        onChange={onChange}
        options={BUY_IN_OPTIONS}
        placeholder="Tutte"
        triggerClassName={cn(
          compact ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[11px]',
          isActive
            ? 'bg-primary/20 text-primary ring-primary/40 hover:brightness-105'
            : lightPanel && compact
              ? 'bg-black/[0.06] text-slate-600 ring-black/10 hover:bg-black/10 hover:text-slate-800'
              : 'bg-white/5 text-white/60 ring-white/10 hover:bg-white/10 hover:text-white/80',
        )}
      />
    </div>
  );
}
