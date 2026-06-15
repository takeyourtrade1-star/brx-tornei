import type { FormatId } from './catalog';

/** Dimensione minima del main deck in base al formato. */
export function getMainDeckMinSize(formatId: FormatId): number {
  return formatId === 'commander' ? 100 : 60;
}

/** Numero massimo di carte in sideboard (0 per Commander). */
export function getSideboardMaxSize(formatId: FormatId): number {
  return formatId === 'commander' ? 0 : 15;
}

/** Calcola il numero totale di carte in una sezione. */
export function countCards(cards: { quantity: number }[]): number {
  return cards.reduce((sum, c) => sum + c.quantity, 0);
}
