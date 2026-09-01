import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ fetchJson: vi.fn() }));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/data/scryfall', () => ({
  fetchScryfallJson: mocks.fetchJson,
  imageFromScryfall: () => null,
  mapLegalities: (raw: Record<string, string>) => raw,
}));

import { enrichCardFromScryfall } from '@/lib/data/scryfall-enrichment';

const printA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const printB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('cache identità Scryfall', () => {
  beforeEach(() => vi.clearAllMocks());

  it('non salva una risposta per ID sotto nome/set forniti dal caller', async () => {
    mocks.fetchJson
      .mockResolvedValueOnce({
        id: printA,
        name: 'Carta A',
        set: 'aaa',
        collector_number: '1',
        legalities: { modern: 'legal' },
      })
      .mockResolvedValueOnce({
        id: printB,
        name: 'Carta B',
        set: 'bbb',
        collector_number: '2',
        legalities: { modern: 'not_legal' },
      });

    const first = await enrichCardFromScryfall({
      cardName: 'Carta B',
      setCode: 'bbb',
      scryfallId: printA,
    });
    const second = await enrichCardFromScryfall({ cardName: 'Carta B' });

    expect(first?.name).toBe('Carta A');
    expect(second?.name).toBe('Carta B');
    expect(mocks.fetchJson).toHaveBeenCalledTimes(2);
  });

  it('rifiuta una risposta il cui ID non coincide con quello richiesto', async () => {
    mocks.fetchJson.mockResolvedValueOnce({
      id: printB,
      name: 'Carta B',
      legalities: { modern: 'legal' },
    });
    await expect(enrichCardFromScryfall({
      cardName: 'Carta A',
      scryfallId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    })).resolves.toBeNull();
  });
});
