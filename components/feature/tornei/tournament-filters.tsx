'use client';

import {
  DEFAULT_TOURNAMENT_FILTERS,
  type TournamentFiltersState,
} from '@/lib/tournament-list-filters';
import { cn } from '@/lib/utils';
import { BuyInFilterSelect } from './buy-in-filter-select';
import { StyledSelect } from '@/components/ui/styled-select';

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
  /** Layout dedicato mobile: etichette inline e riga pillole scrollabile a sinistra. */
  mobile?: boolean;
}

export function TournamentFilters({
  filters,
  onChange,
  resultCount,
  totalCount,
  buyInSelectId,
  compact = false,
  lightPanel = false,
  mobile = false,
}: TournamentFiltersProps) {
  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.bestOf !== 'all' ||
    filters.visibility !== 'all' ||
    filters.buyIn !== 'all';

  // Su mobile usiamo sempre le pillole dense con etichette inline.
  const dense = compact || mobile;

  // Mobile: filtri come dropdown che vanno a capo — niente scroll laterale.
  if (mobile) {
    return (
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-white/40">
            Filtri
          </span>
          <span className="text-[11px] font-semibold tabular-nums text-white/55">
            {resultCount} di {totalCount}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <BuyInFilterSelect
            id={buyInSelectId}
            value={filters.buyIn}
            onChange={(buyIn) => onChange({ ...filters, buyIn })}
            compact
            lightPanel={lightPanel}
          />
          <FilterSelect
            label="Stato"
            options={STATUS_OPTIONS}
            value={filters.status}
            onChange={(status) => onChange({ ...filters, status })}
          />
          <FilterSelect
            label="Best Of"
            options={BEST_OF_OPTIONS}
            value={filters.bestOf}
            onChange={(bestOf) => onChange({ ...filters, bestOf })}
          />
          <FilterSelect
            label="Visibilità"
            options={VISIBILITY_OPTIONS}
            value={filters.visibility}
            onChange={(visibility) => onChange({ ...filters, visibility })}
          />
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => onChange(DEFAULT_TOURNAMENT_FILTERS)}
              className="shrink-0 text-[11px] font-semibold text-primary transition-colors hover:text-primary/80"
            >
              Azzera
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex w-full flex-col transition-[gap] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:duration-0',
        dense ? 'items-stretch gap-2' : 'gap-3',
      )}
    >
      <div className="flex w-full items-center justify-between">
        {!compact && (
          <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-white/40">
            Filtri
          </span>
        )}
        <span
          className={cn(
            'tabular-nums',
            dense ? 'ml-auto text-[11px] font-semibold text-white/55' : 'text-[11px] text-white/40',
          )}
        >
          {resultCount} di {totalCount}
        </span>
      </div>

      <div
        className={cn(
          'flex w-full items-center overflow-x-auto scrollbar-none',
          // Più spazio tra i gruppi (con etichetta) in desktop espanso; va a capo se serve.
          dense ? 'gap-1.5' : 'flex-wrap gap-x-4 gap-y-2',
          // Su mobile la riga scorre da sinistra; il centraggio è solo per il compact desktop.
          compact && !mobile && 'justify-center',
        )}
      >
        <BuyInFilterSelect
          id={buyInSelectId}
          value={filters.buyIn}
          onChange={(buyIn) => onChange({ ...filters, buyIn })}
          compact={dense}
          lightPanel={lightPanel}
        />
        <FilterGroup
          label="Stato"
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(status) => onChange({ ...filters, status })}
          compact={dense}
          lightPanel={lightPanel}
        />
        <FilterGroup
          label="Best Of"
          options={BEST_OF_OPTIONS}
          value={filters.bestOf}
          onChange={(bestOf) => onChange({ ...filters, bestOf })}
          compact={dense}
          lightPanel={lightPanel}
        />
        <FilterGroup
          label="Visibilità"
          options={VISIBILITY_OPTIONS}
          value={filters.visibility}
          onChange={(visibility) => onChange({ ...filters, visibility })}
          compact={dense}
          lightPanel={lightPanel}
        />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_TOURNAMENT_FILTERS)}
            className={cn(
              'shrink-0 font-semibold text-primary transition-colors hover:text-primary/80',
              dense ? 'text-[11px]' : 'text-xs',
            )}
          >
            Azzera{dense ? '' : ' filtri'}
          </button>
        )}
      </div>
    </div>
  );
}

interface FilterSelectProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Dropdown filtro per il layout mobile (etichetta inline + select a pillola). */
function FilterSelect<T extends string>({ label, options, value, onChange }: FilterSelectProps<T>) {
  const labelId = `filter-${label.toLowerCase().replace(/\s+/g, '-')}-label`;
  // La prima opzione è sempre il valore neutro ("Tutti/Tutte").
  const isActive = value !== options[0]?.value;

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <span id={labelId} className="text-[8px] font-bold uppercase tracking-wider text-white/40">
        {label}
      </span>
      <StyledSelect
        value={value}
        onChange={onChange}
        options={options}
        variant="pill"
        ariaLabelledBy={labelId}
        triggerClassName={cn(
          'simple-pill px-2.5 py-1 text-[10px]',
          isActive ? 'simple-pill-active hover:brightness-105' : 'simple-pill-inactive',
        )}
      />
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
      aria-label={label}
    >
      <span
        className={cn(
          'shrink-0 font-bold uppercase tracking-wider text-white/40',
          compact ? 'mr-0.5 text-[8px]' : 'mr-1 text-[10px]',
        )}
      >
        {label}
      </span>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          aria-label={compact ? `${label}: ${opt.label}` : undefined}
          className={cn(
            'simple-pill shrink-0 font-bold uppercase tracking-wide',
            compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
            value === opt.value
              ? 'simple-pill-active ring-inset'
              : lightPanel && compact
                ? 'bg-black/[0.06] text-slate-600 ring-black/10 hover:bg-black/10 hover:text-slate-800'
                : 'simple-pill-inactive',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
