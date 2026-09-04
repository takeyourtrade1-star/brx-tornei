import {
  ASSO_WORLD_HAIRS,
  ASSO_WORLD_OUTFITS,
  DEFAULT_ASSO_WORLD_LOOK,
  type AssoWorldHair,
  type AssoWorldLook,
  type AssoWorldOutfit,
} from '../../types/asso-world';

/** Patch accettato da MirrorModal: le chiavi assenti restano invariate. */
export type AssoWorldLookPatch = Readonly<Partial<AssoWorldLook>>;

export interface MirrorHairOption {
  readonly id: AssoWorldHair;
  readonly label: string;
  readonly marker: 'M' | 'F';
}

export interface MirrorOutfitOption {
  readonly id: AssoWorldOutfit;
  readonly label: string;
}

export const MIRROR_HAIR_OPTIONS = [
  { id: 'm1', label: 'Corto', marker: 'M' },
  { id: 'm2', label: 'Rasato', marker: 'M' },
  { id: 'm3', label: 'Ricci', marker: 'M' },
  { id: 'f1', label: 'Caschetto', marker: 'F' },
  { id: 'f2', label: 'Coda', marker: 'F' },
  { id: 'f3', label: 'Lunghi', marker: 'F' },
] as const satisfies readonly MirrorHairOption[];

export const MIRROR_OUTFIT_OPTIONS = [
  { id: 'tank', label: 'Canotta' },
  { id: 'hoodie', label: 'Felpa' },
  { id: 'jacket', label: 'Bomber' },
  { id: 'shirt', label: 'Camicia' },
  { id: 'jersey', label: 'Maglia' },
] as const satisfies readonly MirrorOutfitOption[];

export interface MirrorLookPreset {
  readonly id: 'storico' | 'street' | 'bomber' | 'classico' | 'arena' | 'libero';
  readonly label: string;
  readonly look: AssoWorldLook;
}

/** Combinazioni editoriali UI; non sono un nuovo insieme di valori persistenti. */
export const MIRROR_LOOK_PRESETS = [
  { id: 'storico', label: 'Storico', look: { hair: 'm3', outfit: 'tank' } },
  { id: 'street', label: 'Street', look: { hair: 'm1', outfit: 'hoodie' } },
  { id: 'bomber', label: 'Bomber', look: { hair: 'm2', outfit: 'jacket' } },
  { id: 'classico', label: 'Classico', look: { hair: 'f1', outfit: 'shirt' } },
  { id: 'arena', label: 'Arena', look: { hair: 'f2', outfit: 'jersey' } },
  { id: 'libero', label: 'Libero', look: { hair: 'f3', outfit: 'jersey' } },
] as const satisfies readonly MirrorLookPreset[];

/** Alias descrittivo per i consumer che non usano il prefisso MIRROR. */
export const CANONICAL_ASSO_WORLD_LOOK_PRESETS = MIRROR_LOOK_PRESETS;
export const DEFAULT_LOOK = DEFAULT_ASSO_WORLD_LOOK;

function randomIndex(length: number, source: () => number): number {
  const sample = source();
  if (!Number.isFinite(sample)) return 0;
  return Math.min(length - 1, Math.max(0, Math.floor(sample * length)));
}

/** Estrae sempre un preset canonico, anche se la sorgente casuale è anomala. */
export function randomCanonicalAssoWorldLook(source: () => number = Math.random): AssoWorldLook {
  const preset = MIRROR_LOOK_PRESETS[randomIndex(MIRROR_LOOK_PRESETS.length, source)];
  return { ...preset.look };
}

export { ASSO_WORLD_HAIRS, ASSO_WORLD_OUTFITS };
export type { AssoWorldHair, AssoWorldLook, AssoWorldOutfit };
