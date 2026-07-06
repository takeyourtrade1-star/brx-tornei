import 'server-only';
import type { FormatId } from '@/lib/data/catalog';
import { validateDeckLegality } from '@/lib/deck-legality';
import { enrichDeckFromScryfall } from '@/lib/enrich-deck-scryfall';
import type { DeckLegalityIssue } from '@/types/card-legality';
import type { Deck } from '@/types/deck';

/** Arricchisce legalità da Scryfall e valida il mazzo per formato. */
export async function validateDeckLegalityWithScryfall(
  deck: Deck,
  formatId: FormatId = deck.formatId
): Promise<{ legal: boolean; issues: DeckLegalityIssue[]; deck: Deck }> {
  const enriched = await enrichDeckFromScryfall(deck);
  const result = validateDeckLegality(enriched, formatId);
  return { ...result, deck: enriched };
}
