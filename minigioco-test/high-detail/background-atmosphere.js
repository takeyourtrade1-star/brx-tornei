import { point, polygon, line, glow, gradient } from "./primitives.js";
import { M } from "./furniture-helpers.js";

export function rgba(hex, alpha) {
  const value = String(hex).replace("#", "");
  const number = Number.parseInt(value.length === 3 ? value.split("").map((part) => part + part).join("") : value, 16);
  if (!Number.isFinite(number)) return hex;
  return `rgba(${(number >> 16) & 255},${(number >> 8) & 255},${number & 255},${alpha})`;
}

export function phaseId(phase) {
  return typeof phase?.id === "string" ? phase.id : "day";
}

export function drawOutsideAtmosphere(ctx, room, phase) {
  const id = phaseId(phase);
  const warm = id === "dusk" || id === "dawn";
  const night = id === "night";
  const floorGlow = room === "arcade" ? rgba(M.plum, night ? 0.10 : 0.08) : rgba(M.amberLight, warm ? 0.11 : 0.07);
  const rimGlow = room === "piazza" ? rgba(M.cyan, night ? 0.08 : 0.10) : rgba(M.petrolLight, night ? 0.06 : 0.08);

  // La sagoma esterna resta trasparente: questi aloni sono soltanto contatto e atmosfera.
  glow(ctx, 400, 506, 335, 42, "rgba(12,20,28,0.22)");
  glow(ctx, 400, 497, 270, 25, "rgba(12,20,28,0.13)");
  glow(ctx, 164, 325, 170, 96, rimGlow);
  glow(ctx, 650, 318, 172, 94, floorGlow);
}

export function wallFill(ctx, points, from, to, direction = "horizontal") {
  const p0 = points[0];
  const p1 = points[direction === "vertical" ? 3 : 1] || points[1];
  const fill = direction === "vertical"
    ? gradient(ctx, p0.x, p0.y, p0.x, p1.y, [[0, from], [0.5, to], [1, from]])
    : gradient(ctx, p0.x, p0.y, p1.x, p1.y, [[0, from], [0.62, to], [1, from]]);
  polygon(ctx, points, fill);
}

export function drawSoftHorizon(ctx, side, c0, c1, z0, z1, colors) {
  const wall = side === "left"
    ? (c, z) => point(0, c, z)
    : (c, z) => point(c, 0, z);
  const shape = [wall(c0, z1), wall(c1, z1), wall(c1, z0), wall(c0, z0)];
  wallFill(ctx, shape, colors.top, colors.bottom, "vertical");
  line(ctx, [wall(c0, z0), wall(c1, z0)], rgba(colors.edge, 0.36), 0.8);
}
