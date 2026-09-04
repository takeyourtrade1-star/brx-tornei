import {
  ASSO_WORLD_HAIRS,
  ASSO_WORLD_OUTFITS,
  DEFAULT_ASSO_WORLD_LOOK,
  type AssoWorldLook,
} from '../../types/asso-world';

/** Look chiuso condiviso dal renderer e dal contratto Asso World. */
export type AvatarLook = AssoWorldLook;

export const DEFAULT_LOOK: AvatarLook = Object.freeze({
  hair: DEFAULT_ASSO_WORLD_LOOK.hair,
  outfit: DEFAULT_ASSO_WORLD_LOOK.outfit,
});

export { ASSO_WORLD_HAIRS, ASSO_WORLD_OUTFITS };

/** Ordine visivo della rotazione: fronte destra, fronte sinistra, retro sinistra, retro destra. */
export const AVATAR_DIRECTIONS = ['se', 'sw', 'nw', 'ne'] as const;
export type AvatarDirection = (typeof AVATAR_DIRECTIONS)[number];

export const AVATAR_POSES = ['idle', 'walk', 'sit', 'blink', 'wave'] as const;
export type AvatarPose = (typeof AVATAR_POSES)[number];

export interface AvatarAnchor {
  readonly x: number;
  readonly y: number;
}

/** Canvas DOM o OffscreenCanvas, senza accedere a document durante l'import. */
export type AvatarCanvas = HTMLCanvasElement | OffscreenCanvas;
export type AvatarRenderingContext =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;

export type AvatarCanvasFactory = (width: number, height: number) => AvatarCanvas | null;

export interface AvatarSprite {
  /** Null quando il browser non espone un canvas o un contesto 2D. */
  readonly cv: AvatarCanvas | null;
  readonly ax: number;
  readonly ay: number;
  readonly feet: AvatarAnchor;
  readonly width: number;
  readonly height: number;
  readonly rendered: boolean;
}

export interface AvatarDirectionFrames {
  /** Le chiavi e la forma restano compatibili con IsoRoomGame. */
  readonly idle: readonly AvatarSprite[];
  readonly walk: readonly AvatarSprite[];
  readonly blink: AvatarSprite;
  readonly wave: readonly AvatarSprite[];
}

export interface AvatarPreviewFrames {
  readonly idle: readonly AvatarSprite[];
  readonly wave: readonly AvatarSprite[];
}

export interface AvatarRenderSet {
  readonly se: AvatarDirectionFrames;
  readonly sw: AvatarDirectionFrames;
  readonly ne: AvatarDirectionFrames;
  readonly nw: AvatarDirectionFrames;
  readonly sit: readonly AvatarSprite[];
  /** Vista frontale pensata per lo specchio e per i preview canvas. */
  readonly preview: AvatarPreviewFrames;
}

export interface AvatarSpriteCache {
  readonly limit: number;
  readonly size: number;
  get(key: string): AvatarRenderSet | undefined;
  set(key: string, value: AvatarRenderSet): void;
  invalidate(key: string): boolean;
  clear(): void;
}

export interface AvatarBuildOptions {
  /** Passare una cache per condividere gli sprite tra più render. */
  readonly cache?: AvatarSpriteCache | null;
  /** Utile per test, worker o host che forniscono il proprio canvas. */
  readonly canvasFactory?: AvatarCanvasFactory;
}
