import { describe, expect, it } from 'vitest';
import {
  addCardToDeck,
  setCommanderInDeck,
  updateCardQtyInDeck,
} from '@/lib/data/deck-mutations';
import { card, deck } from './test-helpers';

describe('mutazioni mazzo con dimensione esatta', () => {
  it('non aggiunge la sessantunesima carta ai formati costruiti', () => {
    const current = deck([card('Forest', 60)]);
    const next = addCardToDeck(current, { id: '999', name: 'Island' }, 'main');
    expect(next).toBe(current);
  });

  it('aggiunge un playset in un solo passaggio e rispetta la capienza residua', () => {
    const current = deck([card('Forest', 55)]);
    const withPlayset = addCardToDeck(
      current,
      { id: '999', name: 'Lightning Bolt' },
      'main',
      4,
    );
    expect(withPlayset.main.find((item) => item.id === '999')?.quantity).toBe(4);

    const capped = addCardToDeck(
      withPlayset,
      { id: '1000', name: 'Island' },
      'main',
      10,
    );
    expect(capped.main.find((item) => item.id === '1000')?.quantity).toBe(1);
    expect(capped.main.reduce((sum, item) => sum + item.quantity, 0)).toBe(60);
  });

  it('ignora quantità rapide non finite', () => {
    const current = deck([]);
    expect(addCardToDeck(
      current,
      { id: '999', name: 'Lightning Bolt' },
      'main',
      Number.NaN,
    )).toBe(current);
  });

  it('limita un aumento alla capienza residua del main', () => {
    const bolt = card('Lightning Bolt', 3);
    const current = deck([bolt, card('Forest', 56)]);
    const next = updateCardQtyInDeck(current, Number(bolt.id), 'main', 4, 4);
    expect(next.main.find((item) => item.id === bolt.id)?.quantity).toBe(4);

    const unchanged = updateCardQtyInDeck(next, Number(bolt.id), 'main', 5, 5);
    expect(unchanged.main.find((item) => item.id === bolt.id)?.quantity).toBe(4);
  });

  it('mantiene un solo comandante e accetta solo carte singole', () => {
    const first = card('Atraxa', 1);
    const second = card('Muldrotha', 1);
    const basics = card('Forest', 98);
    const current = deck([first, second, basics], [], 'commander');

    const selectedFirst = setCommanderInDeck(current, Number(first.id));
    const selectedSecond = setCommanderInDeck(selectedFirst, Number(second.id));
    expect(selectedSecond.main.filter((item) => item.isCommander)).toEqual([
      expect.objectContaining({ id: second.id }),
    ]);
    expect(setCommanderInDeck(selectedSecond, Number(basics.id))).toBe(selectedSecond);
  });
});
