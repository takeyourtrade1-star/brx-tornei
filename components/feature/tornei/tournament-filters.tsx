'use client';

import {
  DEFAULT_TOURNAMENT_FILTERS,
  type TournamentFiltersState,
} from '@/lib/tournament-list-filters';
import { cn } from '@/lib/utils';
import { BuyInFilterSelect } from './buy-in-filter-select';

export {
  applyTournamentFilters,
  DEFAULT_TOURNAMENT_FILTERS,
  hasActiveTournamentFilters,
  type TournamentFiltersState,
} from '@/lib/tournament-list-filters';

const STATUS_OPTIONS: { value: TournamentFiltersState['status']; label: string }[] = [
  { value: 'all', label: 'Tutti' },
  { value: 'in_registrazione', label: 'Aperti' },
  { value: 'iniziata', label: 'Live' },
  { value: 'terminata', label: 'Conclusi' },
];

const BEST_OF_OPTIONS: { value: TournamentFiltersState['bestOf']; label: string }[] = [
  { value: 'all', label: 'Tutti' },
  { value: 'BO1', label: 'BO1' },
  { value: 'BO3', label: 'BO3' },
  { value: 'BO5', label: 'BO5' },
];

const VISIBILITY_OPTIONS: { value: TournamentFiltersState['visibility']; label: string }[] = [
  { value: 'all', label: 'Tutti' },
  { value: 'public', label: 'Pubblici' },
  { value: 'private', label: 'Privati' },
];

interface TournamentFiltersProps {
  filters: TournamentFiltersState;
  onChange: (filters: TournamentFiltersState) => void;
  resultCount: number;
  totalCount: number;
  /** Prefisso id per il select buy-in (es. modale PC minigioco). */
  buyInSelectId?: string;
  compact?: boolean;
  lightPanel?: boolean;
}

export function TournamentFilters({
  filters,
  onChange,
  resultCount,
  totalCount,
  buyInSelectId,
  compact = false,
  lightPanel = false,
}: TournamentFiltersProps) {
  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.bestOf !== 'all' ||
    filters.visibility !== 'all' ||
    filters.buyIn !== 'all';

  return (
    <div
      className={cn(
        'flex w-full flex-col transition-[gap] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:duration-0',
        compact ? 'items-stretch gap-2' : 'gap-3',
      )}
    >
      <div
        className={cn(
          'flex w-full flex-wrap items-center gap-2',
          compact ? 'justify-between' : 'justify-between',
        )}
      >
        {!compact && (
          <span className="font-sans text-xs font-bold uppercase tracking-widest text-white/50">
            Filtri
          </span>
        )}
        <span
          className={cn(
            'tabular-nums',
            compact ? 'ml-auto text-[11px] font-semibold text-white/55' : 'text-xs text-white/45',
          )}
        >
          {resultCount} di {totalCount}
        </span>
      </div>

      <div
        className={cn(
          compact
            ? 'flex w-full flex-col gap-2'
            : 'flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4',
        )}
      >
        <div
          className={cn(
            'flex flex-wrap items-center',
            compact ? 'justify-center gap-1.5' : 'gap-4',
          )}
        >
          <BuyInFilterSelect
            id={buyInSelectId}
            value={filters.buyIn}
            onChange={(buyIn) => onChange({ ...filters, buyIn })}
            compact={compact}
            lightPanel={lightPanel}
          />
          <FilterGroup
            label="Stato"
            options={STATUS_OPTIONS}
            value={filters.status}
            onChange={(status) => onChange({ ...filters, status })}
            compact={compact}
            lightPanel={lightPanel}
          />
        </div>
        <div
          className={cn(
            'flex flex-wrap items-center',
            compact ? 'justify-center gap-1.5' : 'gap-4',
          )}
        >
          <FilterGroup
            label="Forma"
            options={BEST_OF_OPTIONS}
            value={filters.bestOf}
            onChange={(bestOf) => onChange({ ...filters, bestOf })}
            compact={compact}
            lightPanel={lightPanel}
          />
          <FilterGroup
            label="Visibilità"
            options={VISIBILITY_OPTIONS}
            value={filters.visibility}
            onChange={(visibility) => onChange({ ...filters, visibility })}
            compact={compact}
            lightPanel={lightPanel}
          />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => onChange(DEFAULT_TOURNAMENT_FILTERS)}
              className={cn(
                'shrink-0 font-semibold text-primary transition-colors hover:text-primary/80',
                compact ? 'text-[11px]' : 'text-xs sm:ml-auto',
              )}
            >
              Azzera{compact ? '' : ' filtri'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface FilterGroupProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
  lightPanel?: boolean;
}

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  compact = false,
  lightPanel = false,
}: FilterGroupProps<T>) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center',
        compact ? 'justify-center gap-1' : 'flex-wrap gap-1.5',
      )}
    >
      {!compact && (
        <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</span>
      )}
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          aria-label={compact ? `${label}: ${opt.label}` : undefined}
          className={cn(
            'shrink-0 rounded-full font-bold uppercase tracking-wide transition-colors',
            compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]',
            value === opt.value
              ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
              : lightPanel && compact
                ? 'bg-black/[0.06] text-slate-600 ring-1 ring-black/10 hover:bg-black/10 hover:text-slate-800'
                : 'bg-white/5 text-white/60 ring-1 ring-white/10 hover:bg-white/10 hover:text-white/80',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
