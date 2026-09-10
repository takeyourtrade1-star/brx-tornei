'use client';

import { useId, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { LobbyTable } from '@/lib/lobby';
import { TableCard, type TableCardProps } from './table-card';

type SearchableTableListProps = Omit<TableCardProps, 'table' | 'tableNumber'> & {
  tables: LobbyTable[];
};

/** Ricerca locale nella lista: i numeri restano quelli della vista completa. */
export function SearchableTableList({ tables, ...cardProps }: SearchableTableListProps) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const toggleRef = useRef<HTMLButtonElement>(null);
  const inputId = useId();
  const listId = useId();
  const normalized = query.trim().replace(/^(?:tavolo\s*|#\s*)/i, '');
  const searching = query.trim().length > 0;
  const numbered = tables.map((table, index) => ({ table, number: index + 1 }));
  const visible = searching
    ? numbered.filter(({ number }) => /^\d+$/.test(normalized) && number === Number(normalized))
    : numbered;

  const closeSearch = () => {
    setExpanded(false);
    setQuery('');
    toggleRef.current?.focus();
  };

  return (
    <div className="space-y-3">
      <div className="flex min-h-11 flex-wrap items-center justify-end gap-2">
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={expanded}
          aria-controls={expanded ? inputId : undefined}
          onClick={() => expanded ? closeSearch() : setExpanded(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-white/70 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          Cerca
        </button>
        {expanded && (
          <div className="flex max-w-full items-center rounded-lg border border-white/20 bg-header-bg/70 focus-within:border-primary/60">
            <label htmlFor={inputId} className="sr-only">Numero del tavolo</label>
            <input
              id={inputId}
              autoFocus
              type="search"
              inputMode="numeric"
              autoComplete="off"
              placeholder="N. tavolo"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Escape') return;
                event.preventDefault();
                event.stopPropagation();
                closeSearch();
              }}
              aria-controls={listId}
              className="h-11 w-32 min-w-0 bg-transparent pl-3 text-base font-semibold tabular-nums text-white outline-none placeholder:text-white/40 [&::-webkit-search-cancel-button]:hidden"
            />
            <button type="button" onClick={closeSearch} aria-label="Chiudi ricerca e mostra tutti i tavoli" className="grid h-11 w-11 place-items-center rounded-lg text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <p role="status" className="sr-only">
        {searching ? (visible.length === 1 ? '1 tavolo trovato' : `${visible.length} tavoli trovati`) : ''}
      </p>
      <div id={listId} className="flex flex-col gap-4" aria-label="Tavoli disponibili">
        {visible.map(({ table, number }) => (
          <TableCard key={table.key} table={table} tableNumber={number} {...cardProps} />
        ))}
        {searching && visible.length === 0 && (
          <div className="rounded-xl border border-white/10 px-4 py-6 text-center">
            <p className="text-sm font-semibold text-white/80">Nessun tavolo trovato.</p>
            <button type="button" onClick={closeSearch} className="mt-2 min-h-11 rounded-lg px-3 text-xs font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              Mostra tutti i tavoli
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
