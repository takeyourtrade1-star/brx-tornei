import {
  DEFAULT_LOOK,
  type AvatarBuildOptions,
  type AvatarDirection,
  type AvatarDirectionFrames,
  type AvatarLook,
  type AvatarRenderSet,
} from './avatar-types';
import { parseAssoWorldLook } from '../../lib/asso-world-look';
import { avatarLookKey, createAvatarCache } from './avatar-cache';
import { defaultCanvasFactory, createAvatarSprite } from './avatar-canvas';
import {
  type AvatarFrameSpec,
  IDLE_FRAMES,
  SIT_FRAMES,
  WALK_FRAMES,
  WAVE_FRAMES,
  drawAvatar,
} from './avatar-drawing';

/** Cache condivisa per il caso normale; non crea canvas al module-load. */
export const avatarCache = createAvatarCache();

/** Unico confine del renderer: parser strict condiviso col contratto backend. */
export function normalizeAvatarLook(value: unknown): AvatarLook {
  return parseAssoWorldLook(value);
}

function hasRenderedSprite(set: AvatarRenderSet): boolean {
  return set.se.idle.some((sprite) => sprite.rendered);
}

function buildDirection(
  direction: AvatarDirection,
  look: AvatarLook,
  factory: AvatarBuildOptions['canvasFactory'],
): AvatarDirectionFrames {
  const back = direction === 'ne' || direction === 'nw';
  const flip = direction === 'sw' || direction === 'nw';
  const make = (frame: AvatarFrameSpec, blink = false) => createAvatarSprite(
    (context) => drawAvatar(context, back, frame, blink, look),
    {
      factory: factory ?? defaultCanvasFactory,
      flip,
      yOffset: frame.sit ? 9 : 1,
      feet: frame.sit ? { x: 15.5, y: 47 } : { x: 15.5, y: 54 },
    },
  );
  return {
    idle: IDLE_FRAMES.map((frame) => make(frame)),
    walk: WALK_FRAMES.map((frame) => make(frame)),
    blink: make(IDLE_FRAMES[0], true),
    wave: WAVE_FRAMES.map((frame) => make(frame)),
  };
}

/**
 * Costruisce il set completo compatibile con il game loop: se/sw/ne/nw + sit.
 * In assenza di canvas restituisce metadati sicuri e sprite non renderizzati.
 */
export function buildAvatar(value: unknown = DEFAULT_LOOK, options: AvatarBuildOptions = {}): AvatarRenderSet {
  const look = normalizeAvatarLook(value);
  const cache = options.cache === undefined && !options.canvasFactory ? avatarCache : options.cache;
  const key = avatarLookKey(look);
  const cached = cache?.get(key);
  if (cached) return cached;

  const se = buildDirection('se', look, options.canvasFactory);
  const sw = buildDirection('sw', look, options.canvasFactory);
  const ne = buildDirection('ne', look, options.canvasFactory);
  const nw = buildDirection('nw', look, options.canvasFactory);
  const sit = SIT_FRAMES.map((frame) => createAvatarSprite(
    (context) => drawAvatar(context, true, frame, false, look),
    {
      factory: options.canvasFactory ?? defaultCanvasFactory,
      flip: true,
      yOffset: 9,
      feet: { x: 15.5, y: 47 },
    },
  ));
  const set: AvatarRenderSet = { se, sw, ne, nw, sit, preview: { idle: se.idle, wave: se.wave } };
  if (cache && hasRenderedSprite(set)) cache.set(key, set);
  return set;
}

export { DEFAULT_LOOK };
export { avatarLookKey } from './avatar-cache';
export type {
  AvatarDirection,
  AvatarLook,
  AvatarRenderSet,
  AvatarSprite,
} from './avatar-types';
