import { describe, expect, it } from 'vitest';
import {
  MATCH_STICKERS,
  stickerFromText,
  stickerToText,
} from '@/components/feature/tornei/match/match-stickers';

describe('Match Stickers Protocol & Parsing', () => {
  it('defines exactly 10 high-impact gaming stickers', () => {
    expect(MATCH_STICKERS).toHaveLength(10);
    const ids = MATCH_STICKERS.map((s) => s.id);
    expect(ids).toEqual([
      'fire',
      'brain',
      'rip',
      'clown',
      'salt',
      'topdeck',
      'ez',
      'tilt',
      'crown',
      'freeze',
    ]);
  });

  it('formats sticker IDs to protocol text format [sticker:<id>]', () => {
    expect(stickerToText('fire')).toBe('[sticker:fire]');
    expect(stickerToText('clown')).toBe('[sticker:clown]');
    expect(stickerToText('tilt')).toBe('[sticker:tilt]');
  });

  it('parses valid sticker messages into sticker definitions', () => {
    const fire = stickerFromText('[sticker:fire]');
    expect(fire).toBeDefined();
    expect(fire?.id).toBe('fire');
    expect(fire?.label).toBe('ON FIRE!');

    const clown = stickerFromText('[sticker:clown]');
    expect(clown?.id).toBe('clown');
    expect(clown?.label).toBe('CLOWN PLAY');

    const topdeck = stickerFromText('[sticker:topdeck]');
    expect(topdeck?.id).toBe('topdeck');
    expect(topdeck?.label).toBe('TOPDECK GOD');
  });

  it('handles legacy and alias sticker IDs for backward compatibility', () => {
    expect(stickerFromText('[sticker:skull]')?.id).toBe('rip');
    expect(stickerFromText('[sticker:lucky]')?.id).toBe('topdeck');
    expect(stickerFromText('[sticker:rage]')?.id).toBe('tilt');
    expect(stickerFromText('[sticker:shock]')?.id).toBe('tilt');
    expect(stickerFromText('[sticker:chill]')?.id).toBe('freeze');
    expect(stickerFromText('[sticker:gg]')?.id).toBe('crown');
  });

  it('returns null for standard chat or malformed text', () => {
    expect(stickerFromText('Hello world')).toBeNull();
    expect(stickerFromText('[sticker:]')).toBeNull();
    expect(stickerFromText('[sticker:unknown_invalid_id]')).toBeNull();
    expect(stickerFromText('gg [sticker:fire]')).toBeNull();
  });
});
