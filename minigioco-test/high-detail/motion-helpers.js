import { polygon, line } from "./primitives.js";
import { at, frameFor } from "./furniture-helpers.js";

export function roomId(room) {
  if (typeof room === "string") return room.toLowerCase();
  if (!room || typeof room !== "object") return "tournament";
  return String(room.id || room.kind || room.name || "tournament").toLowerCase();
}

export function motionFrame(entity) {
  if (!entity) return null;
  if ([entity.x, entity.y, entity.w, entity.d].every(Number.isFinite)) {
    return { x: entity.x, y: entity.y, w: entity.w, d: entity.d };
  }
  const frame = frameFor(entity);
  return [frame.x, frame.y, frame.w, frame.d].every(Number.isFinite) ? frame : null;
}

export function motionAllowed(reducedMotion, fx) {
  if (reducedMotion || !fx || fx === false) return false;
  if (typeof fx !== "object") return true;
  return fx.reducedMotion !== true
    && fx.enabled !== false
    && fx.motion !== false
    && fx.animations !== false
    && fx.cssAnimations !== false;
}

export function safeTime(time) {
  return Number.isFinite(time) ? time : 0;
}

export function fract(value) {
  return value - Math.floor(value);
}

export function screenQuadY(f, x, y0, y1, z0, z1) {
  return [at(f, x, y0, z0), at(f, x, y1, z0), at(f, x, y1, z1), at(f, x, y0, z1)];
}

export function screenQuadX(f, x0, x1, y, z0, z1) {
  return [at(f, x0, y, z0), at(f, x1, y, z0), at(f, x1, y, z1), at(f, x0, y, z1)];
}

export function quadPoint(quad, u, v) {
  const left = {
    x: quad[0].x + (quad[3].x - quad[0].x) * v,
    y: quad[0].y + (quad[3].y - quad[0].y) * v,
  };
  const right = {
    x: quad[1].x + (quad[2].x - quad[1].x) * v,
    y: quad[1].y + (quad[2].y - quad[1].y) * v,
  };
  return {
    x: left.x + (right.x - left.x) * u,
    y: left.y + (right.y - left.y) * u,
  };
}

export function quadStrip(quad, u0, u1, v0, v1) {
  return [quadPoint(quad, u0, v0), quadPoint(quad, u1, v0), quadPoint(quad, u1, v1), quadPoint(quad, u0, v1)];
}

export function clipQuad(ctx, quad) {
  ctx.beginPath();
  ctx.moveTo(quad[0].x, quad[0].y);
  for (const point of quad.slice(1)) ctx.lineTo(point.x, point.y);
  ctx.closePath();
  ctx.clip();
}

export function fillQuad(ctx, quad, fill, stroke, width = 1) {
  return polygon(ctx, quad, fill, stroke, width);
}

export function screenLine(ctx, quad, u0, v0, u1, v1, color, width = 1) {
  return line(ctx, [quadPoint(quad, u0, v0), quadPoint(quad, u1, v1)], color, width);
}
