import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOOK,
  MIRROR_LOOK_PRESETS,
  randomCanonicalAssoWorldLook,
} from '@/minigioco-test/avatar/mirror-contract';
import {
  AVATAR_DIRECTIONS,
} from '@/minigioco-test/avatar/avatar-types';
import {
  DEFAULT_AVATAR_PREVIEW_FRAME,
  nextAvatarPreviewFrame,
  staticAvatarPreviewFrame,
  type AvatarPreviewFrame,
} from '@/minigioco-test/avatar/avatar-renderer';
import { isAssoWorldLook, parseAssoWorldLook } from '@/lib/asso-world-look';

describe('contratto del guardaroba avatar Asso World', () => {
  it('mantiene il parser strict e lascia merge e validation al parent', () => {
    const base = { hair: 'f1', outfit: 'shirt' } as const;

    expect(parseAssoWorldLook(base)).toEqual(base);
    expect(parseAssoWorldLook('look:m1:tank:extra')).toEqual(DEFAULT_LOOK);
    expect(parseAssoWorldLook({ hair: 'm2', outfit: 'shirt', extra: true })).toEqual(DEFAULT_LOOK);
  });

  it('espone solo preset canonici e il casuale non esce dal contratto', () => {
    for (const preset of MIRROR_LOOK_PRESETS) {
      expect(isAssoWorldLook(preset.look)).toBe(true);
    }
    expect(randomCanonicalAssoWorldLook(() => 0)).toEqual(MIRROR_LOOK_PRESETS[0].look);
    expect(randomCanonicalAssoWorldLook(() => 0.999999)).toEqual(
      MIRROR_LOOK_PRESETS[MIRROR_LOOK_PRESETS.length - 1].look,
    );
    expect(isAssoWorldLook(randomCanonicalAssoWorldLook(() => Number.NaN))).toBe(true);
  });

  it('ruota quattro direzioni e forza un frame statico con reduced motion', () => {
    let current: AvatarPreviewFrame = { ...DEFAULT_AVATAR_PREVIEW_FRAME, motion: 'walk' as const };
    const visited = [] as string[];
    for (let index = 0; index < AVATAR_DIRECTIONS.length; index += 1) {
      current = nextAvatarPreviewFrame(current, 'walk', false);
      visited.push(current.direction);
    }
    expect(visited).toEqual(['sw', 'nw', 'ne', 'se']);
    expect(current.frame).toBe(0);

    expect(nextAvatarPreviewFrame(current, 'walk', true)).toEqual({
      direction: 'sw',
      motion: 'walk',
      frame: 0,
      reducedMotion: true,
    });
  });

  it('mantiene vista e modalità quando blocca il frame per reduced motion', () => {
    expect(staticAvatarPreviewFrame({
      direction: 'nw',
      motion: 'walk',
      frame: 3,
      reducedMotion: false,
    }, true)).toEqual({
      direction: 'nw',
      motion: 'walk',
      frame: 0,
      reducedMotion: true,
    });
  });
});
