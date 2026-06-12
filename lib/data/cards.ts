import 'server-only';

import type { CatalogCard } from '@/types/deck';

/**
 * Catalogo carte mock per il deck builder.
 * In produzione verrà sostituito da API Scryfall/backend.
 */

const MOCK_CARDS: CatalogCard[] = [
  { id: 'c-1', name: 'Lightning Bolt', typeLine: 'Instant', manaCost: '{R}', colors: ['R'] },
  { id: 'c-2', name: 'Counterspell', typeLine: 'Instant', manaCost: '{U}{U}', colors: ['U'] },
  { id: 'c-3', name: 'Thoughtseize', typeLine: 'Sorcery', manaCost: '{B}', colors: ['B'] },
  { id: 'c-4', name: 'Ragavan, Nimble Pilferer', typeLine: 'Legendary Creature', manaCost: '{R}', colors: ['R'] },
  { id: 'c-5', name: 'Murktide Regent', typeLine: 'Creature', manaCost: '{2}{U}', colors: ['U'] },
  { id: 'c-6', name: 'Orcish Bowmasters', typeLine: 'Creature', manaCost: '{1}{B}', colors: ['B'] },
  { id: 'c-7', name: 'Fatal Push', typeLine: 'Instant', manaCost: '{B}', colors: ['B'] },
  { id: 'c-8', name: 'Expressive Iteration', typeLine: 'Sorcery', manaCost: '{U}{R}', colors: ['U', 'R'] },
  { id: 'c-9', name: 'Preordain', typeLine: 'Sorcery', manaCost: '{U}', colors: ['U'] },
  { id: 'c-10', name: 'Consider', typeLine: 'Instant', manaCost: '{U}', colors: ['U'] },
  { id: 'c-11', name: 'Unholy Heat', typeLine: 'Instant', manaCost: '{1}{R}', colors: ['R'] },
  { id: 'c-12', name: 'Spell Pierce', typeLine: 'Instant', manaCost: '{U}', colors: ['U'] },
  { id: 'c-13', name: 'Daze', typeLine: 'Instant', manaCost: '{1}{U}', colors: ['U'] },
  { id: 'c-14', name: 'Wasteland', typeLine: 'Land', colors: [] },
  { id: 'c-15', name: 'Island', typeLine: 'Basic Land — Island', colors: ['U'] },
  { id: 'c-16', name: 'Mountain', typeLine: 'Basic Land — Mountain', colors: ['R'] },
  { id: 'c-17', name: 'Swamp', typeLine: 'Basic Land — Swamp', colors: ['B'] },
  { id: 'c-18', name: 'Plains', typeLine: 'Basic Land — Plains', colors: ['W'] },
  { id: 'c-19', name: 'Forest', typeLine: 'Basic Land — Forest', colors: ['G'] },
  { id: 'c-20', name: 'Sol Ring', typeLine: 'Artifact', manaCost: '{1}', colors: [] },
  { id: 'c-21', name: 'Command Tower', typeLine: 'Land', colors: [] },
  { id: 'c-22', name: 'Atraxa, Praetors\' Voice', typeLine: 'Legendary Creature', manaCost: '{2}{G}{W}{U}{B}', colors: ['W', 'U', 'B', 'G'] },
  { id: 'c-23', name: 'Swords to Plowshares', typeLine: 'Instant', manaCost: '{W}', colors: ['W'] },
  { id: 'c-24', name: 'Brainstorm', typeLine: 'Instant', manaCost: '{U}', colors: ['U'] },
  { id: 'c-25', name: 'Ponder', typeLine: 'Sorcery', manaCost: '{U}', colors: ['U'] },
  { id: 'c-26', name: 'Force of Will', typeLine: 'Instant', manaCost: '{3}{U}{U}', colors: ['U'] },
  { id: 'c-27', name: 'Sheoldred, the Apocalypse', typeLine: 'Legendary Creature', manaCost: '{2}{B}{B}', colors: ['B'] },
  { id: 'c-28', name: 'Fable of the Mirror-Breaker', typeLine: 'Enchantment — Saga', manaCost: '{2}{R}', colors: ['R'] },
  { id: 'c-29', name: 'Ledger Shredder', typeLine: 'Creature', manaCost: '{1}{U}', colors: ['U'] },
  { id: 'c-30', name: 'Bloodchief\'s Thirst', typeLine: 'Sorcery', manaCost: '{1}{B}', colors: ['B'] },
];

const simulateLatency = () => new Promise((r) => setTimeout(r, 30));

/** Tutte le carte mock (per idratazione client del builder). */
export async function getCatalogCards(): Promise<CatalogCard[]> {
  await simulateLatency();
  return [...MOCK_CARDS].sort((a, b) => a.name.localeCompare(b.name, 'it'));
}

/** Ricerca carte per nome (case-insensitive, substring). */
export async function searchCatalogCards(query: string): Promise<CatalogCard[]> {
  await simulateLatency();
  const normalized = query.trim().toLowerCase();
  if (!normalized) return MOCK_CARDS.slice(0, 12);

  return MOCK_CARDS.filter((card) => card.name.toLowerCase().includes(normalized)).slice(0, 20);
}
