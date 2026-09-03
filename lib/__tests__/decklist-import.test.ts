import { describe, expect, it } from 'vitest';
import { parseDecklist } from '@/lib/decklist-import';

describe('importazione decklist', () => {
  it('legge quantità, suffissi set e sezioni sideboard', () => {
    expect(parseDecklist(`
      4x Lightning Bolt (M11) 146 *F*
      2 Counterspell
      Sideboard
      3 Pyroblast
      SB: 1 Red Elemental Blast
    `)).toEqual([
      { name: 'Lightning Bolt', quantity: 4, section: 'main' },
      { name: 'Counterspell', quantity: 2, section: 'main' },
      { name: 'Pyroblast', quantity: 3, section: 'side' },
      { name: 'Red Elemental Blast', quantity: 1, section: 'side' },
    ]);
  });

  it('unisce le righe duplicate e ignora quelle non valide', () => {
    expect(parseDecklist('2 Island\n3 Island\nnota libera')).toEqual([
      { name: 'Island', quantity: 5, section: 'main' },
    ]);
  });
});
