import type {
  AvatarAnchor,
  AvatarCanvas,
  AvatarCanvasFactory,
  AvatarRenderingContext,
  AvatarSprite,
} from './avatar-types';
import { AVATAR_PALETTE } from './avatar-palette';

/** Factory lazy: non legge document finché non viene richiesto uno sprite. */
export function defaultCanvasFactory(width: number, height: number): AvatarCanvas | null {
  try {
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
    if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      return canvas;
    }
  } catch {
    return null;
  }
  return null;
}

export function getAvatarContext(canvas: AvatarCanvas | null): AvatarRenderingContext | null {
  if (!canvas) return null;
  try {
    return canvas.getContext('2d') as AvatarRenderingContext | null;
  } catch {
    return null;
  }
}

function emptySprite(feet: AvatarAnchor): AvatarSprite {
  return {
    cv: null,
    ax: 1,
    ay: 1,
    feet,
    width: 31,
    height: 56,
    rendered: false,
  };
}

/** Aggiunge il contorno senza smoothing, mantenendo un pixel di margine. */
function outlinedSprite(
  source: AvatarCanvas,
  feet: AvatarAnchor,
  factory: AvatarCanvasFactory,
): AvatarSprite {
  const sourceContext = getAvatarContext(source);
  if (!sourceContext) return emptySprite(feet);
  const silhouette = factory(source.width, source.height);
  const output = factory(source.width + 2, source.height + 2);
  const silhouetteContext = getAvatarContext(silhouette);
  const outputContext = getAvatarContext(output);
  if (!silhouette || !output || !silhouetteContext || !outputContext) return emptySprite(feet);
  try {
    silhouetteContext.drawImage(source, 0, 0);
    silhouetteContext.globalCompositeOperation = 'source-in';
    silhouetteContext.fillStyle = AVATAR_PALETTE.outline;
    silhouetteContext.fillRect(0, 0, silhouette.width, silhouette.height);
    for (const [x, y] of [[0, 1], [2, 1], [1, 0], [1, 2]] as const) {
      outputContext.drawImage(silhouette, x, y);
    }
    outputContext.drawImage(source, 1, 1);
    return {
      cv: output,
      ax: 1,
      ay: 1,
      feet,
      width: output.width,
      height: output.height,
      rendered: true,
    };
  } catch {
    return emptySprite(feet);
  }
}

export interface AvatarSpriteRenderOptions {
  readonly factory?: AvatarCanvasFactory;
  readonly flip?: boolean;
  readonly yOffset?: number;
  readonly feet?: AvatarAnchor;
}

/** Crea un frame 29x54 e lo espone nella forma usata dal gioco isometrico. */
export function createAvatarSprite(
  draw: (context: AvatarRenderingContext) => void,
  options: AvatarSpriteRenderOptions = {},
): AvatarSprite {
  const factory = options.factory ?? defaultCanvasFactory;
  const feet = options.feet ?? { x: 15.5, y: 54 };
  const canvas = factory(29, 54);
  const context = getAvatarContext(canvas);
  if (!canvas || !context) return emptySprite(feet);
  try {
    context.imageSmoothingEnabled = false;
    context.save();
    if (options.flip) {
      context.translate(29, 0);
      context.scale(-1, 1);
    }
    context.translate(0, options.yOffset ?? 1);
    draw(context);
    context.restore();
    return outlinedSprite(canvas, feet, factory);
  } catch {
    return emptySprite(feet);
  }
}
