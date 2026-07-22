import { Check, Plus } from 'lucide-react';
import type { Deck } from '@/types/deck';
import { cn } from '@/lib/utils';

interface TableSeatDeckSectionProps {
  formatName: string;
  decks: Deck[];
  selected: string;
  ignoreDeckValue: string;
  loading: boolean;
  newDeckName: string;
  creating: boolean;
  createError: string | null;
  onSelect: (deckId: string) => void;
  onNameChange: (name: string) => void;
  onCreate: () => void;
}

export function TableSeatDeckSection({
  formatName,
  decks,
  selected,
  ignoreDeckValue,
  loading,
  newDeckName,
  creating,
  createError,
  onSelect,
  onNameChange,
  onCreate,
}: TableSeatDeckSectionProps) {
  return (
    <section aria-labelledby="seat-deck-heading">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Passaggio 1</p>
          <h3 id="seat-deck-heading" className="mt-1 text-base font-black text-white">
            Scegli il mazzo
          </h3>
        </div>
        <span className="text-xs font-bold text-white/45">{formatName}</span>
      </div>

      <div className="space-y-2">
        <DeckOption
          checked={selected === ignoreDeckValue}
          title="Gioca senza associare un mazzo"
          detail="Scelta rapida"
          onChange={() => onSelect(ignoreDeckValue)}
        />
        {loading && decks.length === 0 && (
          <p className="px-1 py-2 text-sm font-medium text-white/45">Carico i tuoi mazzi…</p>
        )}
        {decks.map((deck) => (
          <DeckOption
            key={deck.id}
            checked={selected === deck.id}
            title={deck.name}
            onChange={() => onSelect(deck.id)}
          />
        ))}
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <label htmlFor="quick-deck-name" className="text-xs font-extrabold text-white/65">
          Oppure crea un mazzo al volo
        </label>
        <div className="mt-2 flex items-center gap-2">
          <input
            id="quick-deck-name"
            type="text"
            value={newDeckName}
            onChange={(event) => onNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onCreate();
              }
            }}
            placeholder="Nome del nuovo mazzo"
            maxLength={60}
            className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white placeholder:text-white/35 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <button
            type="button"
            onClick={onCreate}
            disabled={creating || !newDeckName.trim()}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-white/10 px-4 text-xs font-extrabold text-white transition hover:bg-white/20 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Crea
          </button>
        </div>
        {createError && (
          <p role="alert" className="mt-2 text-xs font-semibold text-destructive">
            {createError}
          </p>
        )}
      </div>
    </section>
  );
}

function DeckOption({
  checked,
  title,
  detail,
  onChange,
}: {
  checked: boolean;
  title: string;
  detail?: string;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-3 transition',
        'focus-within:outline-none focus-within:ring-2 focus-within:ring-primary',
        checked
          ? 'border-primary/60 bg-primary/15 ring-1 ring-primary/20'
          : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.07]',
      )}
    >
      <input
        type="radio"
        name="table-deck"
        checked={checked}
        onChange={onChange}
        data-modal-initial-focus={checked ? 'true' : undefined}
        className="sr-only"
      />
      <span
        className={cn(
          'grid h-5 w-5 shrink-0 place-items-center rounded-full border',
          checked ? 'border-primary bg-primary text-white' : 'border-white/30',
        )}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">{title}</span>
      {detail && <span className="shrink-0 text-xs font-semibold text-white/40">{detail}</span>}
    </label>
  );
}
