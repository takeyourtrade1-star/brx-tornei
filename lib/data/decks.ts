import 'server-only';

import type { FormatId } from '@/lib/data/catalog';
import type { CreateDeckInput } from '@/lib/validations/deck';
import { countDeckCards } from '@/lib/validations/deck';
import type { Deck, DeckCardEntry } from '@/types/deck';

/**
 * Data layer mazzi — confine col backend.
 * MVP: mock in-memory filtrato per utente.
 */

let nextDeckId = 7;

const MOCK_DECKS: Deck[] = [
  {
    id: 'd-1',
    name: 'Izzet Murktide',
    format: 'modern',
    game: 'Magic: The Gathering',
    status: 'valido',
    cardCount: 60,
    updatedAt: '2026-06-10T14:30:00Z',
    colors: ['U', 'R'],
  },
  {
    id: 'd-2',
    name: 'Mono Black Coffers',
    format: 'modern',
    game: 'Magic: The Gathering',
    status: 'valido',
    cardCount: 60,
    updatedAt: '2026-06-08T09:15:00Z',
    colors: ['B'],
  },
  {
    id: 'd-3',
    name: 'Rakdos Midrange',
    format: 'pioneer',
    game: 'Magic: The Gathering',
    status: 'in_revisione',
    cardCount: 75,
    updatedAt: '2026-06-09T18:00:00Z',
    colors: ['B', 'R'],
  },
  {
    id: 'd-4',
    name: 'The Deck',
    format: 'old-school',
    game: 'Magic: The Gathering',
    status: 'valido',
    cardCount: 60,
    updatedAt: '2026-06-05T11:45:00Z',
    colors: ['W', 'U', 'B'],
  },
  {
    id: 'd-5',
    name: 'Delver of Secrets',
    format: 'legacy',
    game: 'Magic: The Gathering',
    status: 'non_valido',
    cardCount: 60,
    updatedAt: '2026-06-07T20:10:00Z',
    colors: ['U', 'B'],
  },
  {
    id: 'd-6',
    name: "Atraxa, Praetors' Voice",
    format: 'commander',
    game: 'Magic: The Gathering',
    status: 'valido',
    cardCount: 100,
    updatedAt: '2026-06-11T08:00:00Z',
    colors: ['W', 'U', 'B', 'G'],
  },
];

const simulateLatency = () => new Promise((r) => setTimeout(r, 50));

function extractDeckColors(entries: DeckCardEntry[]): string[] {
  const colors = new Set<string>();
  for (const entry of entries) {
    for (const color of entry.colors) {
      colors.add(color);
    }
  }
  return [...colors].sort();
}

/** Mazzi dell'utente, più recenti prima. */
export async function getDecks(_userId: string): Promise<Deck[]> {
  await simulateLatency();
  return [...MOCK_DECKS].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Crea un nuovo mazzo mock e lo aggiunge alla lista utente. */
export async function createDeck(_userId: string, input: CreateDeckInput): Promise<Deck> {
  await simulateLatency();

  const mainCount = countDeckCards(input.main);
  const sideCount = countDeckCards(input.sideboard);
  const deck: Deck = {
    id: `d-${nextDeckId++}`,
    name: input.name,
    format: input.format as FormatId,
    game: 'Magic: The Gathering',
    status: 'in_revisione',
    cardCount: mainCount + sideCount,
    updatedAt: new Date().toISOString(),
    colors: extractDeckColors([...input.main, ...input.sideboard]),
  };

  MOCK_DECKS.unshift(deck);
  return deck;
}
