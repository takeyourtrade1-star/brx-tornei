import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ASSO_WORLD_LOOK,
  parseAssoWorldLook,
  serializeAssoWorldLook,
  tryParseAssoWorldLook,
} from '@/lib/asso-world-look';

describe('contratto look Asso World', () => {
  it('serializza e riparssa ogni combinazione ammessa', () => {
    const values = [
      ['m1', 'tank'],
      ['m2', 'hoodie'],
      ['m3', 'jacket'],
      ['f1', 'shirt'],
      ['f2', 'jersey'],
      ['f3', 'tank'],
    ] as const;

    for (const [hair, outfit] of values) {
      const look = { hair, outfit };
      const encoded = serializeAssoWorldLook(look);
      expect(encoded).toBe(`look:${hair}:${outfit}`);
      expect(tryParseAssoWorldLook(encoded)).toEqual(look);
    }
  });

  it('rifiuta forme ambigue e usa il default solo nel parser UI', () => {
    const invalid = [
      undefined,
      null,
      '',
      'crown',
      'look:m1',
      'look:m1:tank:extra',
      ' look:m1:tank',
      'look:M1:tank',
      'look:m1:jacket ',
      'look:guest:tank',
      'look:m1:poncho',
    ];

    for (const value of invalid) {
      expect(tryParseAssoWorldLook(value)).toBeNull();
      expect(parseAssoWorldLook(value)).toEqual(DEFAULT_ASSO_WORLD_LOOK);
    }
  });

  it('non serializza oggetti runtime manipolati', () => {
    expect(() => serializeAssoWorldLook({ hair: 'm1', outfit: 'poncho' })).toThrow(
      'Personalizzazione Asso World non valida.',
    );
    expect(() => serializeAssoWorldLook({ hair: 'm1', outfit: 'tank', extra: true })).toThrow(
      'Personalizzazione Asso World non valida.',
    );
  });

  it('accetta un look canonico già decodificato per inizializzare la UI', () => {
    expect(parseAssoWorldLook({ hair: 'f3', outfit: 'jacket' })).toEqual({
      hair: 'f3',
      outfit: 'jacket',
    });
  });
});
