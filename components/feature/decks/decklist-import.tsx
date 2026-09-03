'use client';

import { useState } from 'react';
import { CheckCircle2, FileInput, Loader2, X } from 'lucide-react';
import { parseDecklist } from '@/lib/decklist-import';
import { searchHitToCatalogHit } from '@/lib/search/catalog-hit-from-meili';
import type { CardCatalogHit } from '@/types/card';
import type { SearchHit } from '@/types/search';
import { fetchSearchPage } from './deck-card-search-row';

const MAX_IMPORT_ROWS = 80;
const CONCURRENT_SEARCHES = 6;

interface DecklistImportProps {
  onAddCard: (
    card: CardCatalogHit,
    section: 'main' | 'side',
    quantity?: number,
  ) => void;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('en');
}

function findMatchingHit(hits: SearchHit[], name: string): SearchHit | undefined {
  const expected = normalize(name);
  return hits.find((hit) => {
    if (normalize(hit.name) === expected) return true;
    return hit.keywords_localized?.some((candidate) => normalize(candidate) === expected) ?? false;
  });
}

export function DecklistImport({ onAddCard }: DecklistImportProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleImport = async () => {
    const entries = parseDecklist(value).slice(0, MAX_IMPORT_ROWS);
    if (entries.length === 0) {
      setMessage('Nessuna riga valida. Usa il formato “4 Lightning Bolt”.');
      return;
    }

    setLoading(true);
    setMessage(null);
    const missing: string[] = [];
    let imported = 0;

    for (let index = 0; index < entries.length; index += CONCURRENT_SEARCHES) {
      const group = entries.slice(index, index + CONCURRENT_SEARCHES);
      const results = await Promise.all(group.map(async (entry) => {
        try {
          const page = await fetchSearchPage(entry.name, 1);
          return { entry, hit: findMatchingHit(page.hits, entry.name) };
        } catch {
          return { entry, hit: undefined };
        }
      }));

      for (const { entry, hit } of results) {
        if (!hit) {
          missing.push(entry.name);
          continue;
        }
        onAddCard(searchHitToCatalogHit(hit), entry.section, entry.quantity);
        imported += 1;
      }
    }

    setLoading(false);
    if (missing.length > 0) {
      const preview = missing.slice(0, 3).join(', ');
      const remainder = missing.length > 3 ? ` e altre ${missing.length - 3}` : '';
      setMessage(`${imported} voci elaborate. Non trovate: ${preview}${remainder}.`);
      return;
    }
    setMessage(`${imported} voci elaborate: controlla i contatori del mazzo.`);
    setValue('');
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border border-primary/25 bg-primary/[0.08] px-3 py-2.5 text-left transition hover:border-primary/45 hover:bg-primary/[0.12]"
      >
        <span className="flex items-center gap-2">
          <FileInput className="h-4 w-4 text-primary" aria-hidden />
          <span>
            <span className="block text-xs font-black uppercase tracking-wide text-white">
              Aggiunta rapida
            </span>
            <span className="block text-[10px] text-white/45">Incolla tutta la lista in un colpo</span>
          </span>
        </span>
        <span className="rounded-full bg-primary/15 px-2 py-1 text-[9px] font-black uppercase text-primary">
          Più veloce
        </span>
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/[0.07] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-white">Aggiunta rapida</p>
          <p className="text-[10px] text-white/45">Una carta per riga, quantità prima del nome.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={loading}
          aria-label="Chiudi importazione"
          className="grid h-7 w-7 place-items-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={loading}
        rows={7}
        placeholder={'4 Lightning Bolt\n4 Monastery Swiftspear\n\nSideboard\n2 Pyroblast'}
        className="w-full resize-y rounded-xl border border-white/15 bg-black/25 px-3 py-2.5 font-mono text-xs leading-relaxed text-white placeholder:text-white/25 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
      />
      {message ? (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] font-semibold text-white/65" role="status">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          {message}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void handleImport()}
        disabled={loading || !value.trim()}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-primary/20 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FileInput className="h-4 w-4" aria-hidden />}
        {loading ? 'Importazione…' : 'Aggiungi tutta la lista'}
      </button>
    </div>
  );
}
