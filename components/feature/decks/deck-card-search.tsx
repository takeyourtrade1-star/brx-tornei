'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { getCardDisplayNames } from '@/lib/card-display-name';
import { getCardImageUrl, getSetIconUrl } from '@/lib/assets';
import { getRemainingCopies } from '@/lib/deck-copy-limits';
import { searchHitToCatalogHit } from '@/lib/search/catalog-hit-from-meili';
import { getSideboardMaxSize } from '@/lib/data/deck-utils';
import type { CardCatalogHit } from '@/types/card';
import type { FormatId } from '@/lib/data/catalog';
import type { DeckCard } from '@/types/deck';
import type { SearchApiResponse, SearchHit } from '@/types/search';
import { cn } from '@/lib/utils';

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

function buildSearchUrl(q: string, page: number): string {
  const sp = new URLSearchParams();
  if (q) sp.set('q', q);
  sp.set('game', 'mtg');
  sp.set('limit', '20');
  sp.set('sort', 'relevance');
  sp.set('page', String(page));
  return `/api/search?${sp.toString()}`;
}

async function fetchSearchPage(q: string, page: number): Promise<SearchApiResponse> {
  const res = await fetch(buildSearchUrl(q, page));
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Errore ricerca (${res.status})`);
  }
  return res.json();
}

function SearchHitRow({
  hit,
  lang,
  canAddMain,
  canAddSide,
  maxSide,
  onAddMain,
  onAddSide,
}: {
  hit: SearchHit;
  lang: string;
  canAddMain: boolean;
  canAddSide: boolean;
  maxSide: number;
  onAddMain: () => void;
  onAddSide: () => void;
}) {
  const imgUrl = getCardImageUrl(hit.image ?? null);
  const setIconUrl = getSetIconUrl(hit.set_icon_uri, {
    gameSlug: hit.game_slug,
    setCode: hit.set_code ?? undefined,
  });
  const { primary, secondary } = getCardDisplayNames(hit, lang);

  return (
    <li className="flex items-stretch gap-3 border-b border-white/5 px-2 py-2 last:border-b-0">
      <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-black/30">
        {imgUrl ? (
          <img src={imgUrl} alt={primary} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-white/30">
            ?
          </div>
        )}
      </div>

      {setIconUrl ? (
        <img
          src={setIconUrl}
          alt=""
          className="hidden h-7 w-7 shrink-0 self-center object-contain sm:block"
          loading="lazy"
        />
      ) : null}

      <div className="min-w-0 flex-1 self-center">
        <p className="truncate text-xs font-bold text-white">{primary}</p>
        {secondary ? <p className="truncate text-[10px] text-white/40">{secondary}</p> : null}
        <p className="truncate text-[10px] text-white/50">{hit.set_name}</p>
        {hit.available_languages && hit.available_languages.length > 0 ? (
          <p className="truncate text-[9px] uppercase tracking-wide text-white/30">
            {hit.available_languages.join(' · ')}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col justify-center gap-1.5 self-center">
        <button
          type="button"
          disabled={!canAddMain}
          onClick={onAddMain}
          className="rounded-md bg-[#FF7300]/20 px-2 py-1 text-[10px] font-bold uppercase text-[#FF7300] transition-colors hover:bg-[#FF7300]/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Main
        </button>
        {maxSide > 0 ? (
          <button
            type="button"
            disabled={!canAddSide}
            onClick={onAddSide}
            className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold uppercase text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Side
          </button>
        ) : null}
      </div>
    </li>
  );
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
        <p className="font-display text-xs font-black uppercase tracking-wide text-white/80">
          Cerca carte
        </p>
        <div className="flex gap-0.5 rounded-lg border border-white/10 bg-black/20 p-0.5">
          {SEARCH_LANGS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setLang(id)}
              className={cn(
                'rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase transition-colors',
                lang === id ? 'bg-[#FF7300] text-white' : 'text-white/40 hover:text-white/70'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-3">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nome carta in qualsiasi lingua…"
          className="w-full rounded-xl border border-white/15 bg-white/5 py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/30 focus:border-[#FF7300] focus:outline-none"
          autoComplete="off"
        />
      </div>

      {loading && debounced ? (
        <p className="flex items-center gap-2 text-xs text-white/50" role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Ricerca in corso…
        </p>
      ) : null}

      {error && debounced ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && debounced && !error && hits.length === 0 ? (
        <p className="text-center text-xs text-white/40">Nessun risultato per &quot;{debounced}&quot;</p>
      ) : null}

      {!debounced ? (
        <p className="text-center text-xs text-white/35">
          Cerca nel catalogo Ebartex (Meilisearch) e aggiungi le carte al mazzo.
        </p>
      ) : null}

      {hits.length > 0 ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <ul className="min-h-0 flex-1 overflow-auto rounded-xl border border-white/10 bg-black/20">
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
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2 text-[10px] font-bold uppercase text-white/70 transition hover:bg-white/10 disabled:opacity-50"
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
