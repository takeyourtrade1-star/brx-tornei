import { describe, expect, it } from 'vitest';
import { DEFAULT_LOOK, avatarLookKey, buildAvatar, normalizeAvatarLook } from '@/minigioco-test/avatar/avatar-sprite-renderer';
import { createAvatarCache, invalidateAvatarLook } from '@/minigioco-test/avatar/avatar-cache';
import { drawAvatarPreview, getAvatarPreviewSprite } from '@/minigioco-test/avatar/avatar-preview';
import {
  AVATAR_DIRECTIONS,
  type AvatarCanvas,
  type AvatarCanvasFactory,
  type AvatarLook,
} from '@/minigioco-test/avatar/avatar-types';
import { AVATAR_PALETTE } from '@/minigioco-test/avatar/avatar-palette';
import { drawArm } from '@/minigioco-test/avatar/avatar-parts';
import { ASSO_WORLD_HAIRS, ASSO_WORLD_OUTFITS } from '@/types/asso-world';

class FakeContext {
  fillStyle: string | CanvasGradient | CanvasPattern = '#000000';
  globalCompositeOperation: GlobalCompositeOperation = 'source-over';
  imageSmoothingEnabled = true;
  readonly colors = new Set<string>();
  drawImages = 0;
  clearCalls = 0;

  fillRect(_x: number, _y: number, _width: number, _height: number): void {
    if (typeof this.fillStyle === 'string') this.colors.add(this.fillStyle);
  }

  clearRect(): void {
    this.clearCalls += 1;
  }

  save(): void {}
  restore(): void {}
  translate(): void {}
  scale(): void {}
  drawImage(): void {
    this.drawImages += 1;
  }
}

class FakeCanvas {
  readonly context = new FakeContext();

  constructor(readonly width: number, readonly height: number) {}

  getContext(): FakeContext {
    return this.context;
  }
}

function collectingFactory(created: FakeCanvas[]): AvatarCanvasFactory {
  return (width, height) => {
    const canvas = new FakeCanvas(width, height);
    created.push(canvas);
    return canvas as unknown as AvatarCanvas;
  };
}

function look(hair: AvatarLook['hair'], outfit: AvatarLook['outfit']): AvatarLook {
  return { hair, outfit };
}

describe('renderer avatar Asso World', () => {
  it('rispetta il look canonico e il parser strict condiviso', () => {
    expect(DEFAULT_LOOK).toEqual({ hair: 'm3', outfit: 'tank' });
    expect(normalizeAvatarLook('look:f3:jersey')).toEqual(look('f3', 'jersey'));
    expect(normalizeAvatarLook(look('m1', 'hoodie'))).toEqual(look('m1', 'hoodie'));
    expect(normalizeAvatarLook({ hair: 'm1', outfit: 'tank', extra: true })).toEqual(DEFAULT_LOOK);
    expect(normalizeAvatarLook('look:m1:tank:extra')).toEqual(DEFAULT_LOOK);
    expect(avatarLookKey(look('f2', 'shirt'))).toBe('look:f2:shirt');
  });

  it('non esplode quando il browser non offre un canvas o un contesto 2D', () => {
    const avatar = buildAvatar(look('m1', 'tank'), {
      cache: null,
      canvasFactory: () => null,
    });
    expect(avatar.se.idle[0]?.cv).toBeNull();
    expect(avatar.se.idle[0]?.rendered).toBe(false);
    expect(avatar.se.idle[0]?.width).toBe(31);
    expect(drawAvatarPreview(null, DEFAULT_LOOK)).toBe(false);
  });

  it('costruisce quattro direzioni, pose compatibili, dettagli e foot anchor', () => {
    const created: FakeCanvas[] = [];
    const avatar = buildAvatar(look('m3', 'tank'), {
      cache: null,
      canvasFactory: collectingFactory(created),
    });
    for (const direction of AVATAR_DIRECTIONS) {
      const frames = avatar[direction];
      expect(frames.idle).toHaveLength(2);
      expect(frames.walk).toHaveLength(4);
      expect(frames.wave).toHaveLength(3);
      expect(frames.blink.feet).toEqual({ x: 15.5, y: 54 });
      expect(frames.idle.every((sprite) => sprite.rendered)).toBe(true);
      expect(frames.idle[0]?.width).toBe(31);
      expect(frames.idle[0]?.height).toBe(56);
    }
    expect(avatar.sit).toHaveLength(2);
    expect(avatar.sit.every((sprite) => sprite.feet.y === 47)).toBe(true);
    expect(avatar.preview.idle).toBe(avatar.se.idle);
    expect(avatar.preview.wave).toBe(avatar.se.wave);
    expect(created[0]?.context.colors.has(AVATAR_PALETTE.hairLight)).toBe(true);
    expect(created[0]?.context.colors.has(AVATAR_PALETTE.gold)).toBe(true);
  });

  it('distingue tutti i look canonici e mantiene una cache LRU bounded', () => {
    const cache = createAvatarCache(2);
    const opts = { cache, canvasFactory: collectingFactory([]) };
    const first = buildAvatar(look('m1', 'tank'), opts);
    expect(buildAvatar(look('m1', 'tank'), opts)).toBe(first);
    buildAvatar(look('m2', 'hoodie'), opts);
    buildAvatar(look('f1', 'jacket'), opts);
    expect(cache.size).toBe(2);
    expect(cache.get(avatarLookKey(look('m1', 'tank')))).toBeUndefined();
    expect(invalidateAvatarLook(cache, look('m2', 'hoodie'))).toBe(true);
    expect(cache.size).toBe(1);
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it('renderizza le 30 combinazioni backend su tutte le quattro direzioni', () => {
    const cache = createAvatarCache(30);
    const factory = collectingFactory([]);
    for (const hair of ASSO_WORLD_HAIRS) {
      for (const outfit of ASSO_WORLD_OUTFITS) {
        const avatar = buildAvatar(look(hair, outfit), { cache, canvasFactory: factory });
        expect(AVATAR_DIRECTIONS.every((direction) => avatar[direction].walk.length === 4)).toBe(true);
        expect(AVATAR_DIRECTIONS.every((direction) => avatar[direction].walk.every((sprite) => sprite.rendered))).toBe(true);
      }
    }
    expect(cache.size).toBe(30);
  });

  it('usa la palette jersey anche per maniche e dettagli laterali', () => {
    const frontColors: string[] = [];
    drawArm((_x, _y, _width, _height, color) => frontColors.push(color), 4, 0, false, false, 'jersey');
    expect(frontColors).toContain(AVATAR_PALETTE.jersey);
    expect(frontColors).toContain(AVATAR_PALETTE.jerseyLight);
    expect(frontColors).not.toContain(AVATAR_PALETTE.shirt);
    expect(frontColors).not.toContain(AVATAR_PALETTE.shirtLight);

    const backColors: string[] = [];
    drawArm((_x, _y, _width, _height, color) => backColors.push(color), 22, 0, true, false, 'jersey');
    expect(backColors).toContain(AVATAR_PALETTE.jerseyDark);
  });

  it('disegna il preview centrato e seleziona anche saluto e posa seduta', () => {
    const created: FakeCanvas[] = [];
    const factory = collectingFactory(created);
    const cache = createAvatarCache(1);
    const avatar = buildAvatar(look('f2', 'jersey'), { cache, canvasFactory: factory });
    const target = new FakeCanvas(132, 232) as unknown as AvatarCanvas;
    expect(drawAvatarPreview(target, look('f2', 'jersey'), {
      cache,
      canvasFactory: factory,
      pose: 'wave',
      frame: 2,
      scale: 3,
    })).toBe(true);
    expect((target as unknown as FakeCanvas).context.clearCalls).toBe(1);
    expect((target as unknown as FakeCanvas).context.drawImages).toBe(1);
    expect(getAvatarPreviewSprite(avatar, { pose: 'sit' })?.feet.y).toBe(47);
    expect(getAvatarPreviewSprite(avatar, { pose: 'wave', frame: -1 })).toBe(avatar.se.wave[2]);
    expect(created.some((canvas) => canvas.context.colors.has(AVATAR_PALETTE.jerseyLight))).toBe(true);
  });
});
