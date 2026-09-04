import type { AvatarLook, AvatarRenderingContext } from './avatar-types';
import { AVATAR_PALETTE as C } from './avatar-palette';
import { drawArm, drawHair, drawOutfit, type Pixel } from './avatar-parts';

export interface AvatarFrameSpec {
  readonly aDx: number;
  readonly aDy: number;
  readonly bDx: number;
  readonly bDy: number;
  readonly armA: number;
  readonly armB: number;
  readonly bodyDy: number;
  readonly sit?: boolean;
  readonly wave?: boolean;
  readonly wavePhase?: number;
}

/** Quattro fasi: appoggio, salita, appoggio opposto e ritorno. */
export const WALK_FRAMES: readonly AvatarFrameSpec[] = [
  { aDx: 2, aDy: 1, bDx: -1, bDy: -2, armA: 2, armB: -1, bodyDy: 0 },
  { aDx: 1, aDy: 0, bDx: 0, bDy: 0, armA: 1, armB: 0, bodyDy: -1 },
  { aDx: -1, aDy: -2, bDx: 2, bDy: 1, armA: -1, armB: 2, bodyDy: 0 },
  { aDx: 0, aDy: 0, bDx: 1, bDy: 0, armA: 0, armB: 1, bodyDy: -1 },
];

/** Respirazione leggibile: spalle e mani cambiano, senza muovere l'anchor. */
export const IDLE_FRAMES: readonly AvatarFrameSpec[] = [
  { aDx: 0, aDy: 0, bDx: 0, bDy: 0, armA: 0, armB: 0, bodyDy: 0 },
  { aDx: 0, aDy: 0, bDx: 0, bDy: 0, armA: 1, armB: 1, bodyDy: 1 },
];

export const SIT_FRAMES: readonly AvatarFrameSpec[] = IDLE_FRAMES.map((frame) => ({
  ...frame,
  sit: true,
}));

/** Mini-animazione frontale per lo specchio: la mano alterna due altezze. */
export const WAVE_FRAMES: readonly AvatarFrameSpec[] = [
  { ...IDLE_FRAMES[0], wave: true, wavePhase: 0 },
  { ...IDLE_FRAMES[1], wave: true, wavePhase: 1 },
  { ...IDLE_FRAMES[0], wave: true, wavePhase: 1 },
];

function makePixel(ctx: AvatarRenderingContext): Pixel {
  return (x, y, width, height, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  };
}

function drawWaveArm(px: Pixel, bodyDy: number, phase: number, back: boolean): void {
  const skin = back ? C.skinDark : C.skin;
  const hand = back ? C.skin : C.skinLight;
  const handY = 10 + (phase % 2);
  px(4, 16 + bodyDy, 3, 8, skin);
  px(3, 13 + bodyDy, 3, 5, skin);
  px(2, handY + bodyDy, 3, 4, hand);
  px(1, handY - 1 + bodyDy, 2, 2, hand);
  px(4, 16 + bodyDy, 1, 8, C.skinLight);
}

function drawChain(px: Pixel, bodyDy: number, back: boolean): void {
  const b = bodyDy;
  if (back) {
    px(10, 20 + b, 9, 1, C.gold);
    px(12, 21 + b, 5, 1, C.goldLight);
    return;
  }
  px(9, 21 + b, 2, 1, C.gold); px(18, 21 + b, 2, 1, C.gold);
  px(10, 22 + b, 2, 1, C.goldLight); px(17, 22 + b, 2, 1, C.gold);
  px(12, 23 + b, 1, 1, C.gold); px(16, 23 + b, 1, 1, C.goldLight);
  px(13, 24 + b, 1, 1, C.gold); px(15, 24 + b, 1, 1, C.gold); px(14, 24 + b, 1, 1, C.goldLight);
  px(12, 25 + b, 5, 1, C.pendantRim); px(11, 26 + b, 7, 4, C.pendantRim);
  px(12, 26 + b, 5, 3, C.pendant); px(12, 26 + b, 1, 1, C.pendantLight); px(16, 26 + b, 1, 1, C.pendantLight);
  px(13, 26 + b, 3, 1, C.white); px(13, 27 + b, 1, 1, C.white); px(15, 27 + b, 1, 1, C.white);
  px(13, 28 + b, 3, 1, C.white); px(15, 29 + b, 1, 1, C.white);
  px(12, 30 + b, 5, 1, C.pendantRim); px(13, 31 + b, 3, 1, C.pendantRim);
}

/** Corpo completo in una vista frontale o di spalle, ancora in pixel logici. */
export function drawAvatar(
  ctx: AvatarRenderingContext,
  back: boolean,
  frame: AvatarFrameSpec,
  blink: boolean,
  look: AvatarLook,
): void {
  const px = makePixel(ctx);
  const b = frame.bodyDy;
  if (!frame.sit) {
    px(8 + frame.aDx, 36 + frame.aDy, 6, 11, C.pants);
    px(15 + frame.bDx, 36 + frame.bDy, 6, 11, C.pants);
    px(8 + frame.aDx, 36 + frame.aDy, 1, 11, C.pantsLight);
    px(20 + frame.bDx, 36 + frame.bDy, 1, 11, C.pantsDark);
    px(8 + frame.aDx, 44 + frame.aDy, 6, 3, C.pantsDark);
    px(15 + frame.bDx, 44 + frame.bDy, 6, 3, C.pantsDark);
    px(7 + frame.aDx, 47 + frame.aDy, 7, 3, C.shoe);
    px(15 + frame.bDx, 47 + frame.bDy, 7, 3, C.shoe);
    px(9 + frame.aDx, 47 + frame.aDy, 4, 1, C.white);
    px(16 + frame.bDx, 47 + frame.bDy, 4, 1, C.white);
    px(7 + frame.aDx, 50 + frame.aDy, 7, 2, C.sole);
    px(15 + frame.bDx, 50 + frame.bDy, 7, 2, C.sole);
  }
  px(7, 33 + b, 15, 4, C.pants);
  px(7, 33 + b, 15, 1, C.pantsDark);
  if (frame.wave) drawWaveArm(px, b, frame.wavePhase ?? 0, back);
  else drawArm(px, 4, b + frame.armA, false, back, look.outfit);
  drawArm(px, 22, b + frame.armB, true, back, look.outfit);
  drawOutfit(px, b, back, look.outfit);
  px(12, 17 + b, 5, 4, C.skin);
  px(12, 17 + b, 5, 1, C.skinDark);
  if (look.outfit === 'tank') drawChain(px, b, back);

  if (back) {
    px(6, 5 + b, 17, 12, C.hair);
  } else {
    px(6, 6 + b, 17, 12, C.skin);
    px(21, 7 + b, 2, 10, C.skinDark); px(6, 7 + b, 1, 10, C.skinLight);
    px(7, 16 + b, 15, 2, C.skinDark); px(10, 17 + b, 9, 1, C.skinDeep);
    px(8, 9 + b, 5, 2, C.hairDark); px(16, 9 + b, 5, 2, C.hairDark);
    if (blink) {
      px(9, 12 + b, 4, 1, C.skinDeep); px(16, 12 + b, 4, 1, C.skinDeep);
    } else {
      px(9, 11 + b, 2, 2, C.white); px(11, 11 + b, 2, 2, C.outline);
      px(16, 11 + b, 2, 2, C.white); px(18, 11 + b, 2, 2, C.outline);
    }
    px(14, 13 + b, 1, 2, C.skinDark); px(11, 15 + b, 7, 1, C.mouth);
  }
  drawHair(px, look.hair, b, back);
}
