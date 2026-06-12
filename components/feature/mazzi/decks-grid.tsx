import type { Deck } from '@/types/deck';
import type { Selection } from '@/lib/validations/selection';
import { DeckCard } from './deck-card';
import { DecksEmptyState } from './decks-empty-state';

interface DecksGridProps {
  decks: Deck[];
  selection: Selection;
}

/** Griglia responsive dei mazzi dell'utente. */
export function DecksGrid({ decks, selection }: DecksGridProps) {
  if (decks.length === 0) {
    return <DecksEmptyState selection={selection} />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {decks.map((deck) => (
        <DeckCard key={deck.id} deck={deck} />
      ))}
    </div>
  );
}
