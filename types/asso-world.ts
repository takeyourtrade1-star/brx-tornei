/**
 * Aspetto persistente dell'avatar pixel-art di Asso World.
 *
 * I valori sono intenzionalmente chiusi: il renderer della Piazza conosce
 * soltanto questi asset e non deve mai ricevere nomi arbitrari dal backend.
 */

export const ASSO_WORLD_HAIRS = [
  'm1',
  'm2',
  'm3',
  'f1',
  'f2',
  'f3',
] as const;

export type AssoWorldHair = (typeof ASSO_WORLD_HAIRS)[number];

export const ASSO_WORLD_OUTFITS = [
  'tank',
  'hoodie',
  'jacket',
  'shirt',
  'jersey',
] as const;

export type AssoWorldOutfit = (typeof ASSO_WORLD_OUTFITS)[number];

export interface AssoWorldLook {
  readonly hair: AssoWorldHair;
  readonly outfit: AssoWorldOutfit;
}

export const DEFAULT_ASSO_WORLD_LOOK = Object.freeze({
  hair: 'm3',
  outfit: 'tank',
}) satisfies AssoWorldLook;
