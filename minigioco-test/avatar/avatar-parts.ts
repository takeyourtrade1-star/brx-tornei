import type { AvatarLook } from './avatar-types';
import { AVATAR_PALETTE as C } from './avatar-palette';

export type Pixel = (x: number, y: number, width: number, height: number, color: string) => void;
type Rect = readonly [number, number, number, number, string];

function paint(px: Pixel, bodyDy: number, rects: readonly Rect[]): void {
  for (const [x, y, width, height, color] of rects) px(x, y + bodyDy, width, height, color);
}

/** Disegna braccia e mani coerenti con la manica del look. */
export function drawArm(
  px: Pixel,
  x: number,
  dy: number,
  right: boolean,
  back: boolean,
  outfit: AvatarLook['outfit'],
): void {
  const skin = back || right ? C.skinDark : C.skin;
  const hand = back ? C.skin : right ? C.skin : C.skinLight;
  if (outfit === 'tank') {
    px(x, 20 + dy, 3, 12, skin);
    if (!back && !right) px(x, 20 + dy, 1, 12, C.skinLight);
    px(x, 30 + dy, 3, 2, hand);
    return;
  }
  const sleeve = outfit === 'jersey' ? 25 : 30;
  const sleeveColor = outfit === 'hoodie'
    ? right ? C.hoodieDark : C.hoodie
    : outfit === 'jacket'
      ? right ? C.jacketDark : C.jacket
      : outfit === 'jersey'
        ? right ? C.jerseyDark : C.jersey
        : right ? C.shirtDark : C.shirt;
  const sleeveLight = outfit === 'hoodie' ? C.hoodieLight
    : outfit === 'jacket' ? C.jacketLight
      : outfit === 'jersey' ? C.jerseyLight : C.shirtLight;
  px(x, 20 + dy, 3, sleeve - 20, sleeveColor);
  if (!back && !right) px(x, 20 + dy, 1, sleeve - 20, sleeveLight);
  if (sleeve < 32) px(x, sleeve + dy, 3, 32 - sleeve, skin);
  if (sleeve === 30) px(x, 29 + dy, 3, 1, right ? sleeveColor : sleeveLight);
  if (outfit === 'jersey') px(x, 24 + dy, 3, 1, right ? C.jerseyDark : C.jerseyLight);
  px(x, 30 + dy, 3, 2, hand);
}

/** Torso, cuciture e accessori sono disegnati con dettagli diversi per outfit. */
export function drawOutfit(px: Pixel, bodyDy: number, back: boolean, outfit: AvatarLook['outfit']): void {
  const b = bodyDy;
  const side = (main: string, light: string, dark: string) => {
    px(6, 20 + b, 17, 13, main);
    px(6, 20 + b, 2, 13, light);
    px(21, 20 + b, 2, 13, dark);
    px(6, 31 + b, 17, 2, dark);
  };
  switch (outfit) {
    case 'hoodie':
      side(C.hoodie, C.hoodieLight, C.hoodieDark);
      if (back) {
        px(8, 19 + b, 13, 4, C.hoodieDark);
        px(9, 20 + b, 11, 2, C.hoodie);
      } else {
        px(8, 19 + b, 13, 3, C.hoodieDark);
        px(9, 20 + b, 11, 1, C.hoodieLight);
        px(9, 27 + b, 11, 4, C.hoodieDark);
        px(10, 28 + b, 9, 2, C.hoodie);
        px(7, 24 + b, 1, 7, C.hoodieLight); px(20, 24 + b, 1, 7, C.hoodieDark);
        px(12, 22 + b, 1, 4, C.white); px(16, 22 + b, 1, 4, C.white);
        px(12, 26 + b, 1, 1, C.gold); px(16, 26 + b, 1, 1, C.gold);
        px(16, 23 + b, 3, 3, C.white); px(17, 24 + b, 1, 1, C.hoodie);
      }
      return;
    case 'jacket':
      side(C.jacket, C.jacketLight, C.jacketDark);
      px(6, 31 + b, 17, 1, C.jacketLight);
      if (!back) {
        px(12, 20 + b, 5, 13, C.tee);
        px(12, 20 + b, 1, 13, C.white);
        px(11, 20 + b, 1, 13, C.jacketDark); px(17, 20 + b, 1, 13, C.jacketDark);
        px(9, 20 + b, 3, 2, C.jacketLight); px(17, 20 + b, 3, 2, C.jacketLight);
        px(14, 23 + b, 1, 1, C.gold); px(14, 29 + b, 2, 1, C.gold);
        px(8, 27 + b, 3, 1, C.jacketDark); px(18, 27 + b, 3, 1, C.jacketDark);
      } else {
        px(9, 22 + b, 2, 1, C.jacketLight); px(18, 22 + b, 2, 1, C.jacketDark);
        px(10, 28 + b, 13, 1, C.jacketDark);
      }
      return;
    case 'shirt':
      side(C.shirt, C.shirtLight, C.shirtDark);
      if (!back) {
        px(10, 19 + b, 3, 2, C.shirtLight); px(16, 19 + b, 3, 2, C.shirtLight);
        px(13, 20 + b, 3, 2, C.skin); px(14, 22 + b, 1, 10, C.shirtDark);
        px(14, 24 + b, 1, 1, C.button); px(14, 27 + b, 1, 1, C.button); px(14, 30 + b, 1, 1, C.button);
        px(17, 24 + b, 3, 1, C.shirtDark); px(18, 25 + b, 2, 2, C.shirtLight);
      } else {
        px(10, 20 + b, 7, 1, C.shirtLight); px(14, 22 + b, 1, 8, C.shirtDark);
        px(17, 25 + b, 3, 1, C.shirtDark); px(18, 26 + b, 2, 1, C.shirtLight);
      }
      return;
    case 'jersey':
      side(C.jersey, C.jerseyLight, C.jerseyDark);
      px(6, 24 + b, 17, 2, C.jerseyLight);
      px(8, 21 + b, 3, 1, C.jerseyDark); px(18, 21 + b, 3, 1, C.jerseyDark);
      px(7, 26 + b, 2, 1, C.jerseyLight); px(20, 26 + b, 2, 1, C.jerseyDark);
      if (!back) {
        px(11, 20 + b, 7, 1, C.jerseyDark);
        px(12, 21 + b, 2, 1, C.jerseyNumber); px(15, 21 + b, 2, 1, C.jerseyNumber);
        px(12, 28 + b, 2, 4, C.jerseyNumber); px(15, 28 + b, 2, 4, C.jerseyNumber);
      } else {
        px(10, 24 + b, 7, 1, C.jerseyDark);
        px(11, 26 + b, 2, 5, C.jerseyNumber); px(15, 26 + b, 2, 5, C.jerseyNumber);
      }
      return;
    case 'tank':
      side(C.tank, C.tankLight, C.tankDark);
      if (!back) {
        px(11, 20 + b, 7, 2, C.skin); px(11, 20 + b, 7, 1, C.skinDark);
        px(8, 23 + b, 2, 1, C.tankLight); px(19, 23 + b, 2, 1, C.tankDark);
      } else {
        px(9, 21 + b, 2, 1, C.tankDark); px(18, 21 + b, 2, 1, C.tankLight);
      }
      return;
  }
}

/** Capelli frontali e posteriori: ogni silhouette ha highlight e ombre proprie. */
export function drawHair(px: Pixel, hair: AvatarLook['hair'], bodyDy: number, back: boolean): void {
  const h = C.hair, l = C.hairLight, d = C.hairDark;
  switch (hair) {
    case 'm1':
      paint(px, bodyDy, back ? [
        [5, 2, 19, 3, h], [4, 4, 21, 9, h], [5, 13, 17, 2, d], [7, 3, 10, 1, l], [21, 6, 2, 3, d],
      ] : [
        [6, 2, 17, 2, h], [5, 3, 19, 4, h], [4, 5, 2, 4, h], [23, 5, 2, 5, h],
        [5, 7, 18, 1, d], [11, 3, 1, 3, l], [7, 2, 9, 1, l], [22, 6, 1, 2, d],
      ]);
      return;
    case 'm2':
      paint(px, bodyDy, back ? [
        [5, 4, 19, 3, h], [4, 6, 21, 7, h],
        [8, 7, 1, 1, d], [12, 8, 1, 1, d], [16, 7, 1, 1, d], [10, 10, 1, 1, d], [15, 10, 1, 1, d],
      ] : [
        [6, 3, 17, 2, h], [5, 4, 19, 3, h], [5, 7, 18, 1, d], [4, 5, 1, 3, h], [23, 5, 2, 4, h],
        [8, 4, 1, 1, d], [12, 4, 1, 1, d], [16, 4, 1, 1, d], [20, 4, 1, 1, d], [10, 5, 1, 1, d], [14, 5, 1, 1, d], [18, 5, 1, 1, d],
      ]);
      return;
    case 'm3':
      paint(px, bodyDy, back ? [
        [8, 0, 5, 2, h], [15, 0, 6, 2, h], [5, 1, 19, 5, h], [4, 3, 21, 10, h], [3, 6, 1, 4, h], [25, 6, 1, 4, h],
        [5, 13, 19, 3, h], [6, 16, 4, 1, h], [12, 16, 5, 1, h], [19, 16, 4, 1, h],
        [10, 5, 2, 2, d], [16, 6, 2, 2, d], [7, 8, 2, 2, d], [13, 10, 2, 2, d], [19, 9, 2, 2, d],
        [7, 2, 2, 1, l], [13, 2, 2, 1, l], [18, 3, 2, 1, l], [5, 5, 2, 1, l], [11, 7, 2, 1, l], [15, 9, 2, 1, l], [6, 10, 2, 1, l], [20, 11, 2, 1, l],
      ] : [
        [8, 0, 5, 1, h], [15, 0, 5, 1, h], [6, 1, 17, 2, h], [5, 2, 19, 3, h], [4, 4, 21, 3, h], [3, 5, 1, 3, h], [25, 5, 1, 3, h],
        [4, 7, 3, 4, h], [22, 7, 3, 5, h], [5, 7, 19, 1, h], [6, 8, 3, 1, h], [13, 8, 3, 1, h], [20, 8, 2, 1, h],
        [10, 2, 2, 2, d], [15, 2, 2, 2, d], [20, 4, 2, 2, d], [8, 5, 2, 2, d], [13, 6, 2, 2, d], [18, 6, 2, 2, d],
        [7, 1, 2, 1, l], [12, 1, 2, 1, l], [17, 1, 2, 1, l], [5, 3, 2, 1, l], [10, 4, 2, 1, l], [15, 4, 2, 1, l], [21, 3, 2, 1, l], [23, 7, 2, 1, l],
      ]);
      return;
    case 'f1':
      paint(px, bodyDy, back ? [
        [5, 0, 17, 3, h], [3, 2, 21, 15, h], [4, 16, 19, 2, d], [6, 1, 10, 1, l],
      ] : [
        [7, 0, 5, 1, h], [15, 0, 4, 1, h], [5, 1, 17, 3, h], [4, 2, 19, 4, h], [3, 4, 3, 12, h], [23, 4, 3, 12, h],
        [5, 6, 18, 1, h], [5, 7, 18, 1, d], [3, 15, 3, 2, h], [23, 15, 3, 2, h], [6, 1, 10, 1, l], [4, 4, 1, 8, l], [18, 3, 2, 1, C.goldLight],
      ]);
      return;
    case 'f2':
      paint(px, bodyDy, back ? [
        [5, 1, 17, 3, h], [4, 3, 21, 5, h], [11, 7, 7, 16, h], [12, 8, 5, 15, d], [13, 9, 2, 12, l], [11, 7, 7, 2, l],
      ] : [
        [6, 1, 17, 2, h], [5, 2, 19, 3, h], [4, 4, 21, 2, h], [4, 4, 2, 4, h], [23, 4, 3, 5, h], [5, 6, 18, 1, d],
        [8, 6, 3, 2, h], [16, 6, 3, 2, h], [25, 8, 3, 8, h], [26, 10, 2, 6, d], [25, 8, 1, 8, l], [24, 7, 2, 2, C.gold], [7, 2, 9, 1, l],
      ]);
      return;
    case 'f3':
      paint(px, bodyDy, back ? [
        [5, 0, 17, 3, h], [3, 2, 21, 21, h], [4, 22, 19, 2, d], [5, 4, 1, 16, l], [8, 8, 2, 2, d], [14, 12, 2, 2, d], [18, 16, 2, 2, d],
      ] : [
        [6, 0, 17, 2, h], [5, 1, 19, 4, h], [3, 3, 3, 19, h], [23, 3, 3, 19, h], [5, 5, 18, 1, d], [13, 5, 2, 3, h],
        [3, 20, 4, 2, h], [22, 20, 4, 2, h], [4, 4, 1, 15, l], [24, 4, 1, 15, d], [6, 1, 8, 1, l],
      ]);
      return;
  }
}
