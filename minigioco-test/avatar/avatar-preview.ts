import {
  AVATAR_DIRECTIONS,
  DEFAULT_LOOK,
  type AvatarBuildOptions,
  type AvatarCanvas,
  type AvatarDirection,
  type AvatarPose,
  type AvatarRenderSet,
  type AvatarSprite,
} from './avatar-types';
import type { AssoWorldLook } from '../../types/asso-world';
import { buildAvatar } from './avatar-sprite-renderer';
import { getAvatarContext } from './avatar-canvas';

export type AvatarPreviewMotion = 'idle' | 'walk';

export interface AvatarPreviewFrame {
  readonly direction: AvatarDirection;
  readonly motion: AvatarPreviewMotion;
  readonly frame: number;
  readonly reducedMotion: boolean;
}

export type AvatarPreviewRenderer = (
  canvas: HTMLCanvasElement,
  look: AssoWorldLook,
  frame: AvatarPreviewFrame,
) => void | boolean;

export const DEFAULT_AVATAR_PREVIEW_FRAME: AvatarPreviewFrame = Object.freeze({
  direction: 'se',
  motion: 'idle',
  frame: 0,
  reducedMotion: false,
});

export const AVATAR_DIRECTION_LABELS: Readonly<Record<AvatarDirection, string>> = {
  se: 'frontale destra',
  sw: 'frontale sinistra',
  ne: 'di spalle destra',
  nw: 'di spalle sinistra',
};

/** Blocca l'animazione mantenendo vista e modalità scelte dall'utente. */
export function staticAvatarPreviewFrame(
  frame: AvatarPreviewFrame,
  reducedMotion: boolean,
): AvatarPreviewFrame {
  return reducedMotion ? { ...frame, frame: 0, reducedMotion: true } : frame;
}

/** Avanza direzione e frame usando la stessa griglia sprite del gioco. */
export function nextAvatarPreviewFrame(
  current: AvatarPreviewFrame,
  motion: AvatarPreviewMotion,
  reducedMotion: boolean,
): AvatarPreviewFrame {
  const index = Math.max(0, AVATAR_DIRECTIONS.indexOf(current.direction));
  const direction = AVATAR_DIRECTIONS[(index + 1) % AVATAR_DIRECTIONS.length];
  const frameCount = motion === 'walk' ? 4 : 2;
  return {
    direction,
    motion,
    frame: reducedMotion ? 0 : (current.frame + 1) % frameCount,
    reducedMotion,
  };
}

export interface AvatarPreviewOptions extends AvatarBuildOptions {
  readonly direction?: AvatarDirection;
  readonly pose?: Extract<AvatarPose, 'idle' | 'walk' | 'wave' | 'blink' | 'sit'>;
  readonly frame?: number;
  /** Scala intera; se omessa usa il massimo intero che entra nel canvas. */
  readonly scale?: number;
}

function frameAt(frames: readonly AvatarSprite[], index: number): AvatarSprite | null {
  if (!frames.length) return null;
  const safeIndex = Number.isFinite(index) ? Math.floor(index) : 0;
  return frames[((safeIndex % frames.length) + frames.length) % frames.length] ?? null;
}

/** Seleziona un frame reale del set costruito da buildAvatar. */
export function getAvatarPreviewSprite(
  avatar: AvatarRenderSet,
  options: Pick<AvatarPreviewOptions, 'direction' | 'pose' | 'frame'> = {},
): AvatarSprite | null {
  const pose = options.pose ?? 'idle';
  if (pose === 'sit') return frameAt(avatar.sit, options.frame ?? 0);
  const direction = options.direction ?? 'se';
  const frames = avatar[direction];
  if (pose === 'blink') return frames.blink;
  return frameAt(frames[pose], options.frame ?? 0);
}

/** Disegna un frame sprite già costruito, senza sostituirlo con forme ad hoc. */
export function drawAvatarPreviewFrame(
  target: AvatarCanvas | null | undefined,
  sprite: AvatarSprite | null | undefined,
  scale?: number,
): boolean {
  if (!target || !sprite?.cv || !sprite.rendered || target.width <= 0 || target.height <= 0) return false;
  const context = getAvatarContext(target);
  if (!context) return false;
  try {
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, target.width, target.height);
    const fit = Math.max(1, Math.floor(Math.min(target.width / sprite.width, target.height / sprite.height)));
    const requested = Number.isFinite(scale) && (scale ?? 0) > 0 ? Math.floor(scale as number) : fit;
    const unit = Math.max(1, requested);
    const width = sprite.width * unit;
    const height = sprite.height * unit;
    context.drawImage(sprite.cv, Math.round((target.width - width) / 2), Math.round((target.height - height) / 2), width, height);
    return true;
  } catch {
    return false;
  }
}

/** Helper completo: parser strict, cache condivisa, sprite reale e disegno centrato. */
export function drawAvatarPreview(
  target: AvatarCanvas | null | undefined,
  look: unknown = DEFAULT_LOOK,
  options: AvatarPreviewOptions = {},
): boolean {
  if (!target) return false;
  const avatar = buildAvatar(look, options);
  const sprite = getAvatarPreviewSprite(avatar, options);
  return drawAvatarPreviewFrame(target, sprite, options.scale);
}

/** Compatibilità per il vecchio nome: delega comunque al set sprite reale. */
export function drawAssoWorldAvatarPreview(
  target: HTMLCanvasElement,
  look: AssoWorldLook,
  frame: AvatarPreviewFrame = DEFAULT_AVATAR_PREVIEW_FRAME,
): boolean {
  const pose = frame.reducedMotion ? 'idle' : frame.motion;
  const avatar = buildAvatar(look);
  const sprite = getAvatarPreviewSprite(avatar, {
    direction: frame.direction,
    pose,
    frame: frame.reducedMotion ? 0 : frame.frame,
  });
  return drawAvatarPreviewFrame(target, sprite);
}

export const renderAvatarPreview = drawAvatarPreview;
