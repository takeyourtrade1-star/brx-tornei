import { drawDetailedBackground } from './background';
import { drawDetailedFurniture } from './furniture';
import { point } from './primitives';

// Una sola stanza in memoria. Il dettaglio è precalcolato, mai ridisegnato a 60 FPS.
const RESOLUTION = 3;
function layer(bounds, draw) {
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(bounds.w * RESOLUTION);
  cv.height = Math.ceil(bounds.h * RESOLUTION);
  const ctx = cv.getContext('2d');
  ctx.setTransform(RESOLUTION, 0, 0, RESOLUTION, -bounds.x * RESOLUTION, -bounds.y * RESOLUTION);
  draw(ctx);
  return { cv, ...bounds };
}

export function releaseDetailedScene(engine) {
  if (!engine.detailScene) return;
  for (const entry of [engine.detailScene.background, ...engine.detailScene.furniture.values()]) {
    if (entry) { entry.cv.width = 1; entry.cv.height = 1; }
  }
  engine.detailScene = null;
}

export function getDetailedScene(engine) {
  const key = `${engine.st.room}:${engine.phase.id}`;
  if (engine.detailScene?.key === key) return engine.detailScene;
  releaseDetailedScene(engine);
  const furniture = new Map();
  const scene = { key, furniture, background: null };
  // Registrazione immediata: il cleanup libera anche una costruzione incompleta.
  engine.detailScene = scene;
  scene.background = layer({ x: 0, y: 0, w: 736, h: 560 }, (ctx) => drawDetailedBackground(ctx, engine.st.room, engine.phase));
  for (const e of engine.entities) {
    const left = point(e.minX, e.maxY + 1);
    const right = point(e.maxX + 1, e.minY);
    const top = point(e.minX, e.minY);
    const bottom = point(e.maxX + 1, e.maxY + 1);
    const bounds = { x: Math.floor(left.x - 24), y: Math.floor(top.y - 125), w: Math.ceil(right.x - left.x + 48), h: Math.ceil(bottom.y - top.y + 155) };
    const entry = layer(bounds, (ctx) => drawDetailedFurniture(ctx, engine.st.room, e, 0));
    // La maschera compatta evita letture GPU durante il movimento del puntatore.
    if (e.inter) {
      const mask = document.createElement('canvas');
      mask.width = bounds.w; mask.height = bounds.h;
      const maskCtx = mask.getContext('2d', { willReadFrequently: true });
      maskCtx.drawImage(entry.cv, 0, 0, bounds.w, bounds.h);
      const pixels = maskCtx.getImageData(0, 0, bounds.w, bounds.h).data;
      entry.alpha = new Uint8Array(bounds.w * bounds.h);
      for (let i = 0; i < entry.alpha.length; i++) entry.alpha[i] = pixels[i * 4 + 3];
      mask.width = 1; mask.height = 1;
    }
    furniture.set(e.key, entry);
  }
  return scene;
}

export function drawDetailedLayer(ctx, entry) {
  ctx.drawImage(entry.cv, entry.x, entry.y, entry.w, entry.h);
}

/** Sagoma visiva ad alta risoluzione; il percorso continua a usare i collider originali. */
export function hitDetailedObject(engine, worldPoint) {
  const scene = engine.detailScene;
  if (!scene) return null;
  const entities = [...engine.entities].reverse();
  for (const e of entities) {
    if (!e.inter) continue;
    const entry = scene.furniture.get(e.key);
    const x = Math.floor(worldPoint.x - entry.x);
    const y = Math.floor(worldPoint.y - entry.y);
    if (x < 0 || y < 0 || x >= entry.w || y >= entry.h) continue;
    const alpha = entry.alpha[y * entry.w + x];
    if (alpha >= 80) return engine.inter[e.inter];
  }
  for (const id of ['board', 'door', 'socialDoor', 'doorBack']) {
    const obj = engine.inter[id];
    if (obj && engine.inRect(worldPoint, obj.hitRect)) return obj;
  }
  return null;
}
