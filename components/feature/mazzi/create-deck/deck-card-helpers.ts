import type { CatalogCard, DeckCardEntry } from '@/types/deck';

/** Aggiunge o incrementa una carta nella zona indicata (max 4 copie). */
export function addCardToZone(
  entries: DeckCardEntry[],
  card: CatalogCard
): DeckCardEntry[] {
  const existing = entries.find((entry) => entry.cardId === card.id);
  if (existing) {
    if (existing.quantity >= 4) return entries;
    return entries.map((entry) =>
      entry.cardId === card.id ? { ...entry, quantity: entry.quantity + 1 } : entry
    );
  }

  return [
    ...entries,
    {
      cardId: card.id,
      name: card.name,
      quantity: 1,
      colors: card.colors,
    },
  ];
}

/** Rimuove una copia dalla zona; elimina la voce se quantity diventa 0. */
export function removeCardFromZone(
  entries: DeckCardEntry[],
  cardId: string
): DeckCardEntry[] {
  return entries
    .map((entry) =>
      entry.cardId === cardId ? { ...entry, quantity: entry.quantity - 1 } : entry
    )
    .filter((entry) => entry.quantity > 0);
}
