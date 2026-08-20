'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { getRemainingCopies } from '@/lib/deck-copy-limits';
import { searchHitToCatalogHit } from '@/lib/search/catalog-hit-from-meili';
import { getSideboardMaxSize } from '@/lib/data/deck-utils';
import type { CardCatalogHit } from '@/types/card';
import type { FormatId } from '@/lib/data/catalog';
import type { DeckCard } from '@/types/deck';
import type { SearchHit } from '@/types/search';
import { cn } from '@/lib/utils';
import { fetchSearchPage, SearchHitRow } from './deck-card-search-row';

const SEARCH_LANGS = [
  { id: 'it', label: 'IT' },
  { id: 'en', label: 'EN' },
  { id: 'de', label: 'DE' },
  { id: 'es', label: 'ES' },
  { id: 'fr', label: 'FR' },
  { id: 'pt', label: 'PT' },
] as const;

interface DeckCardSearchProps {
  formatId: FormatId;
  main: DeckCard[];
  side: DeckCard[];
  sideCount: number;
  onAddCard: (card: CardCatalogHit, section: 'main' | 'side') => void;
}

export function DeckCardSearch({
  formatId,
  main,
  side,
  sideCount,
  onAddCard,
}: DeckCardSearchProps) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [lang, setLang] = useState('it');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxSide = getSideboardMaxSize(formatId);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim()), 350);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (!debounced) {
      setHits([]);
      setPage(1);
      setTotalPages(0);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchSearchPage(debounced, 1)
      .then((data) => {
        if (cancelled) return;
        setHits(data.hits);
        setPage(data.page);
        setTotalPages(data.totalPages);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setHits([]);
        setError(err instanceof Error ? err.message : 'Ricerca non disponibile');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const loadMore = useCallback(async () => {
    if (!debounced || page >= totalPages || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchSearchPage(debounced, page + 1);
      setHits((prev) => [...prev, ...data.hits]);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore caricamento risultati');
    } finally {
      setLoadingMore(false);
    }
  }, [debounced, page, totalPages, loadingMore]);

  const canAddForHit = useMemo(() => {
    return (hit: SearchHit, section: 'main' | 'side') => {
      const catalog = searchHitToCatalogHit(hit);
      const remaining = getRemainingCopies(formatId, catalog, main, side);
      if (remaining <= 0) return false;
      if (section === 'side' && maxSide > 0 && sideCount >= maxSide) return false;
      return true;
    };
  }, [formatId, main, side, maxSide, sideCount]);

  const handleAdd = (hit: SearchHit, section: 'main' | 'side') => {
    onAddCard(searchHitToCatalogHit(hit), section);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-display text-xs font-black uppercase tracking-wide text-header-bg">
          Cerca carte
        </p>
        <div className="flex gap-0.5 rounded-lg border border-slate-900/10 bg-slate-100 p-0.5">
          {SEARCH_LANGS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setLang(id)}
              className={cn(
                'rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase transition-colors',
                lang === id ? 'bg-[#FF7300] text-white' : 'text-slate-500 hover:text-header-bg'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-3">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nome carta in qualsiasi lingua…"
          className="w-full rounded-xl border border-slate-900/15 bg-white py-2 pl-9 pr-3 text-xs text-header-bg placeholder:text-slate-400 focus:border-[#FF7300] focus:outline-none"
          autoComplete="off"
        />
      </div>

      {loading && debounced ? (
        <p className="flex items-center gap-2 text-xs text-slate-500" role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Ricerca in corso…
        </p>
      ) : null}

      {error && debounced ? (
        <p className="rounded-lg border border-red-500/30 bg-red-50 px-3 py-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && debounced && !error && hits.length === 0 ? (
        <p className="text-center text-xs text-slate-400">Nessun risultato per &quot;{debounced}&quot;</p>
      ) : null}

      {!debounced ? (
        <p className="text-center text-xs text-slate-400">
          Cerca nel catalogo Ebartex (Meilisearch) e aggiungi le carte al mazzo.
        </p>
      ) : null}

      {hits.length > 0 ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <ul className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-900/10 bg-white">
            {hits.map((hit) => (
              <SearchHitRow
                key={hit.id}
                hit={hit}
                lang={lang}
                maxSide={maxSide}
                canAddMain={canAddForHit(hit, 'main')}
                canAddSide={canAddForHit(hit, 'side')}
                onAddMain={() => handleAdd(hit, 'main')}
                onAddSide={() => handleAdd(hit, 'side')}
              />
            ))}
          </ul>
          {page < totalPages ? (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-900/10 bg-white py-2 text-[10px] font-bold uppercase text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {loadingMore ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
              Carica altri
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
