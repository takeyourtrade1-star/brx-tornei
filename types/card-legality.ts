import type { FormatId } from '@/lib/data/catalog';

/** Stato legalità Scryfall per un formato Constructed. */
export type ScryfallLegalityStatus = 'legal' | 'not_legal' | 'restricted' | 'banned';

/** Mappa formato tornei → chiave Scryfall in `legalities`. */
export const FORMAT_TO_SCRYFALL: Record<FormatId, string> = {
  standard: 'standard',
  pioneer: 'pioneer',
  modern: 'modern',
  legacy: 'legacy',
  pauper: 'pauper',
  commander: 'commander',
  premodern: 'premodern',
  'old-school': 'oldschool',
};

/** Legalità per i formati supportati da Ebartex Tornei. */
export type TournamentLegalities = Record<FormatId, ScryfallLegalityStatus>;

export interface DeckLegalityIssue {
  blueprintId: number;
  cardName: string;
  formatId: FormatId;
  status: ScryfallLegalityStatus;
  message: string;
}
