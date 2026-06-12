import { Eye, Pencil, Trash2 } from 'lucide-react';
import { getFormat } from '@/lib/data/catalog';
import type { Deck } from '@/types/deck';
import { DeckStatusBadge } from './deck-status-badge';

const COLOR_LABEL: Record<string, string> = {
  W: 'Bianco',
  U: 'Blu',
  B: 'Nero',
  R: 'Rosso',
  G: 'Verde',
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

/**
 * Card singolo mazzo — presentazione Ebartex glass con azioni placeholder.
 */
export function DeckCard({ deck }: { deck: Deck }) {
  const format = getFormat(deck.format);

  return (
    <article className="brx-glass flex flex-col rounded-3xl border border-white/15 p-5 transition-colors hover:bg-white/[0.06]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-sans text-lg font-bold text-white">{deck.name}</h2>
          <p className="mt-0.5 text-sm text-white/55">{deck.game}</p>
        </div>
        <DeckStatusBadge status={deck.status} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-white/45">Formato</dt>
          <dd className="mt-0.5 font-semibold text-marquee">{format?.name ?? deck.format}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-white/45">Carte</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-white/90">{deck.cardCount}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs font-bold uppercase tracking-wider text-white/45">Colori</dt>
          <dd className="mt-1 flex flex-wrap gap-1.5">
            {deck.colors.map((c) => (
              <span
                key={c}
                className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-white/80 ring-1 ring-white/15"
                title={COLOR_LABEL[c] ?? c}
              >
                {c}
              </span>
            ))}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-white/40">Aggiornato il {formatDate(deck.updatedAt)}</p>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/15 transition-colors hover:bg-white/20"
          aria-label={`Visualizza ${deck.name}`}
        >
          <Eye className="h-3.5 w-3.5" />
          Visualizza
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/15 transition-colors hover:bg-white/20"
          aria-label={`Modifica ${deck.name}`}
        >
          <Pencil className="h-3.5 w-3.5" />
          Modifica
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-red-300 ring-1 ring-red-400/20 transition-colors hover:bg-red-500/20"
          aria-label={`Elimina ${deck.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Elimina
        </button>
      </div>
    </article>
  );
}
