'use client';

import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import type { CatalogCard } from '@/types/deck';
import type { DeckZone } from './builder-types';

interface CardSearchPanelProps {
  catalogCards: CatalogCard[];
  zone: DeckZone;
  zoneLabel: string;
  onAdd: (card: CatalogCard) => void;
}

export function CardSearchPanel({ catalogCards, zone, zoneLabel, onAdd }: CardSearchPanelProps) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const pool = normalized
      ? catalogCards.filter((card) => card.name.toLowerCase().includes(normalized))
      : catalogCards;
    return pool.slice(0, 12);
  }, [catalogCards, query]);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-sans text-xl font-bold uppercase tracking-wide text-white">
          Aggiungi carte al {zoneLabel}
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Cerca per nome e aggiungi al {zone === 'main' ? 'main deck' : 'sideboard'}.
          Max 4 copie per carta.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cerca una carta…"
          className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-marquee/50 focus:outline-none focus:ring-2 focus:ring-marquee/30"
        />
      </div>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {results.map((card) => (
          <li
            key={card.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{card.name}</p>
              <p className="truncate text-xs text-white/50">{card.typeLine}</p>
            </div>
            <button
              type="button"
              onClick={() => onAdd(card)}
              className="shrink-0 rounded-full bg-marquee/20 p-2 text-marquee ring-1 ring-marquee/30 transition-colors hover:bg-marquee/30"
              aria-label={`Aggiungi ${card.name}`}
            >
              <Plus className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      {results.length === 0 && (
        <p className="py-6 text-center text-sm text-white/50">Nessuna carta trovata.</p>
      )}
    </section>
  );
}
