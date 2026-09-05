import { glow } from "./primitives.js";
import { drawCharacterBody, drawCharacterShadow, poseMetrics } from "./character-body.js";
import { drawDetailedHead } from "./character-head.js";
import { drawDetailedPet as drawPet } from "./character-pets.js";
import { CHARACTER_COLORS as C, resolveCharacterStyle, resolveDirection, rgba } from "./character-style.js";

/**
 * Personaggio 2.5D ad alta definizione, ancorato ai piedi nei pixel del mondo.
 * @param {{ x: number, y: number, look?: { hair?: string, outfit?: string }, direction?: string, time?: number, walking?: boolean, seated?: boolean, blink?: boolean, ghost?: boolean }} options
 */
export function drawDetailedCharacter(ctx, options = {}) {
  const {
    x,
    y,
    look,
    direction = "se",
    time = 0,
    walking = false,
    seated = false,
    blink = false,
    ghost = false,
  } = options;
  if (!ctx || !Number.isFinite(x) || !Number.isFinite(y)) return;
  const safeTime = Number.isFinite(time) ? time : 0;
  const style = resolveCharacterStyle(look);
  const facing = resolveDirection(direction);
  const metrics = poseMetrics(safeTime, walking, seated);
  const anchor = { x, y };
  const ground = { x, y };

  ctx.save();
  if (ghost) {
    glow(ctx, ground.x, ground.y - 24, 22, 27, rgba(C.haze, 0.13));
    ctx.globalAlpha = 0.68;
  }
  drawCharacterShadow(ctx, anchor, ghost);
  drawCharacterBody(ctx, anchor, style, facing, metrics, seated, ghost);
  drawDetailedHead(ctx, anchor, style, facing, metrics, blink, ghost);
  ctx.restore();
}

export const drawDetailedPet = drawPet;
