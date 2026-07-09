import type { FormatId } from '@/lib/data/catalog';
import type { ScryfallLegalityStatus, TournamentLegalities } from '@/types/card-legality';
import type { Deck, DeckCard } from '@/types/deck';

const ALL_FORMATS: FormatId[] = [
  'standard',
  'pioneer',
  'modern',
  'legacy',
  'pauper',
  'commander',
  'premodern',
  'old-school',
];

/** Legalità uniforme su tutti i formati, con override puntuali. */
export function legalities(
  base: ScryfallLegalityStatus = 'legal',
  overrides: Partial<TournamentLegalities> = {}
): TournamentLegalities {
  const out = {} as TournamentLegalities;
  for (const f of ALL_FORMATS) out[f] = base;
  return { ...out, ...overrides };
}

let nextId = 1;

export function card(
  name: string,
  quantity: number,
  opts: Partial<DeckCard> = {}
): DeckCard {
  return {
    id: String(nextId++),
    name,
    quantity,
    oracleId: opts.oracleId ?? `oracle-${name.toLowerCase()}`,
    tournamentLegalities: 'tournamentLegalities' in opts ? opts.tournamentLegalities : legalities(),
    ...opts,
  };
}

/** Riempitivo legale per arrivare alla taglia minima del main deck. */
export function filler(count: number): DeckCard[] {
  return [card('Forest', count, { oracleId: 'oracle-forest' })];
}

export function deck(main: DeckCard[], side: DeckCard[] = [], formatId: FormatId = 'modern'): Deck {
  return {
    id: 'test-deck',
    name: 'Test',
    formatId,
    archetypeId: 'aggro',
    main,
    side,
    createdAt: new Date().toISOString(),
    verificationStatus: 'none',
  };
}
