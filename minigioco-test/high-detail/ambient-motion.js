import { ellipse, point } from "./primitives.js";
import { M } from "./furniture-helpers.js";
import { motionAllowed, roomId, safeTime } from "./motion-helpers.js";
import { phaseId } from "./background-atmosphere.js";

function foliageLayer(item, index) {
  const bounds = item?.bounds || item || {};
  const cv = item?.cv || item?.canvas || null;
  const values = [bounds.x, bounds.y, bounds.w, bounds.h];
  if (!cv || !values.every(Number.isFinite)) return null;
  const anchor = item.anchor && Number.isFinite(item.anchor.x) && Number.isFinite(item.anchor.y)
    ? item.anchor : { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 };
  return {
    cv, x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h, anchor,
    phase: Number.isFinite(item.phase) ? item.phase : index * 1.17,
    amplitude: Number.isFinite(item.amplitude) ? item.amplitude : 1,
    tilt: Number.isFinite(item.tilt) ? item.tilt : 0.012,
  };
}

/**
 * Disegna le cache del foliage prima degli attori. In reduced motion mantiene
 * la posa statica; in alta qualità muove solo bitmap già rasterizzate.
 */
export function drawFoliageLayers(ctx, foliage, time = 0, reducedMotion = false) {
  if (!ctx || !Array.isArray(foliage)) return 0;
  const safe = safeTime(time);
  let drawn = 0;
  for (let index = 0; index < Math.min(8, foliage.length); index += 1) {
    const layer = foliageLayer(foliage[index], index);
    if (!layer) continue;
    ctx.save();
    if (reducedMotion) {
      ctx.drawImage(layer.cv, layer.x, layer.y, layer.w, layer.h);
    } else {
      const sway = Math.sin(safe * 0.68 + layer.phase) * layer.amplitude;
      const drift = Math.sin(safe * 0.43 + layer.phase + 0.7) * layer.amplitude * 0.18;
      const angle = Math.sin(safe * 0.54 + layer.phase) * layer.tilt;
      const shear = Math.sin(safe * 0.49 + layer.phase + 1.1) * layer.tilt * 0.7;
      ctx.translate(layer.anchor.x + sway, layer.anchor.y + drift);
      ctx.rotate(angle);
      ctx.transform(1, shear, shear * 0.15, 1, 0, 0);
      ctx.drawImage(layer.cv, layer.x - layer.anchor.x, layer.y - layer.anchor.y, layer.w, layer.h);
    }
    ctx.restore();
    drawn += 1;
  }
  return drawn;
}

function drawPiazzaLights(ctx, time, phase) {
  const night = phase === "night";
  const warm = phase === "dusk" || phase === "dawn";
  const baseAlpha = night ? 0.22 : warm ? 0.16 : 0.10;
  const points = [
    [2.3, 77], [3.9, 75], [5.55, 76], [7.2, 75], [8.8, 77], [10.15, 79],
  ];
  for (let index = 0; index < points.length; index += 1) {
    const [x, z] = points[index];
    const bulb = point(x, 0.68, z);
    const pulse = 0.5 + 0.5 * Math.sin(time * 1.15 + index * 0.72);
    ctx.globalAlpha = baseAlpha + pulse * 0.08;
    ellipse(ctx, bulb.x, bulb.y + 5, 1.7 + pulse * 0.25, 2.2 + pulse * 0.25, M.amberLight);
    ctx.globalAlpha = 1;
  }
}

export function drawAmbientMotion(ctx, room, time = 0, options = {}) {
  const { reducedMotion = false, fx, phase = {} } = options || {};
  if (!ctx || !motionAllowed(reducedMotion, fx)) return null;
  if (!roomId(room).includes("piazza")) return null;
  const safe = safeTime(time);
  const id = phaseId(phase);
  ctx.save();
  drawPiazzaLights(ctx, safe, id);
  ctx.restore();
  return true;
}
