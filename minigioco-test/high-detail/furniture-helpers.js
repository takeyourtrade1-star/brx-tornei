import { point, polygon, line, box, plane, ellipse, roundRect, glow, gradient } from "./primitives.js";

export const M = Object.freeze({
  ivory: "#F1E7D6", ivoryLight: "#FFF7E8", ivoryShade: "#CFC1AF",
  petrol: "#1C5665", petrolDeep: "#123B49", petrolMid: "#2E7782", petrolLight: "#76AAA1",
  walnut: "#70472F", walnutLight: "#A6754F", walnutDeep: "#452B24",
  terracotta: "#B7624C", terracottaLight: "#D78A6A", terracottaDeep: "#7D4037",
  amber: "#D4A04A", amberLight: "#F0CA73", brass: "#947044",
  cyan: "#5AD8D5", cyanDeep: "#197681", screen: "#102F3B", screenLight: "#2E717B",
  moss: "#6F8D6C", green: "#527E67", plum: "#695273", blush: "#D59A86",
  shadow: "rgba(30,37,38,0.18)", shadowSoft: "rgba(30,37,38,0.10)", edge: "rgba(255,248,230,0.48)",
  edgeDark: "rgba(45,34,30,0.22)", white: "#FFFFFF",
});

const numberOr = (value, fallback) => Number.isFinite(value) ? value : fallback;

export function frameFor(entity = {}) {
  const x = numberOr(entity.minX, numberOr(entity.anchor?.x, 0));
  const y = numberOr(entity.minY, numberOr(entity.anchor?.y, 0));
  const maxX = numberOr(entity.maxX, x);
  const maxY = numberOr(entity.maxY, y);
  return { x, y, w: Math.max(1, maxX - x + 1), d: Math.max(1, maxY - y + 1) };
}

export function at(f, x, y, z = 0) { return point(f.x + x, f.y + y, z); }

export function poly(ctx, f, pts, fill, stroke, width = 1) {
  return polygon(ctx, pts.map(([x, y, z]) => at(f, x, y, z || 0)), fill, stroke, width);
}

export function path(ctx, f, pts, color, width = 1) {
  return line(ctx, pts.map(([x, y, z]) => at(f, x, y, z || 0)), color, width);
}

export function slab(ctx, f, x, y, w, d, z, h, colors) {
  return box(ctx, f.x + x, f.y + y, w, d, z, h, colors);
}

export function top(ctx, f, x, y, w, d, z, fill, stroke) {
  return plane(ctx, f.x + x, f.y + y, w, d, z, fill, stroke);
}

export function oval(ctx, f, x, y, rx, ry, z, fill) {
  const p = at(f, x, y, z);
  return ellipse(ctx, p.x, p.y, rx, ry, fill);
}

export function aura(ctx, f, x, y, rx, ry, z, color) {
  const p = at(f, x, y, z);
  return glow(ctx, p.x, p.y, rx, ry, color);
}

export function fillGradient(ctx, f, from, to, stops) {
  const a = at(f, from[0], from[1], from[2] || 0);
  const b = at(f, to[0], to[1], to[2] || 0);
  return gradient(ctx, a.x, a.y, b.x, b.y, stops);
}

export function faceX(ctx, f, x0, x1, y, z0, z1, fill, stroke, width = 1) {
  return poly(ctx, f, [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], fill, stroke, width);
}

export function faceY(ctx, f, x, y0, y1, z0, z1, fill, stroke, width = 1) {
  return poly(ctx, f, [[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]], fill, stroke, width);
}

export function edgeLoop(ctx, f, pts, z, color = M.edge, width = 1) {
  const closed = pts.concat([pts[0]]).map(([x, y]) => [x, y, z]);
  return path(ctx, f, closed, color, width);
}

export function faceRoundRect(ctx, f, x, y, z, w, h, r, fill, stroke) {
  const p = at(f, x, y, z);
  return roundRect(ctx, p.x - w / 2, p.y - h / 2, w, h, r, fill, stroke);
}

export function worldLabel(ctx, f, x, y, z, value, color = M.ivoryLight) {
  if (!value) return;
  const p = at(f, x, y, z);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(Math.atan2(16, 32));
  ctx.fillStyle = color;
  ctx.font = "700 5px ui-sans-serif, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(value), 0, 0);
  ctx.restore();
}

export function card(ctx, f, x, y, w, d, z, fill, accent) {
  poly(ctx, f, [[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]], fill, M.ivoryLight, 0.8);
  poly(ctx, f, [[x + w * 0.18, y + d * 0.22, z + 0.2], [x + w * 0.82, y + d * 0.22, z + 0.2], [x + w * 0.82, y + d * 0.78, z + 0.2], [x + w * 0.18, y + d * 0.78, z + 0.2]], accent);
  oval(ctx, f, x + w * 0.5, y + d * 0.5, 2.6, 1.3, z + 0.4, M.amberLight);
}

export function deck(ctx, f, x, y, z, fill, label) {
  slab(ctx, f, x, y, 0.34, 0.44, z, 7, { top: M.ivoryLight, left: fill, right: M.walnutDeep, edge: M.edge });
  faceX(ctx, f, x + 0.04, x + 0.30, y - 0.002, z + 1, z + 5, fill, M.edgeDark, 0.5);
  faceRoundRect(ctx, f, x + 0.17, y - 0.006, z + 3.5, 6, 3, 1, fill, M.amberLight);
  worldLabel(ctx, f, x + 0.17, y - 0.008, z + 3.5, label, M.ivoryLight);
}

export function die(ctx, f, x, y, z, fill) {
  slab(ctx, f, x, y, 0.24, 0.24, z, 5, { top: M.ivoryLight, left: fill, right: M.terracottaDeep, edge: M.edge });
  oval(ctx, f, x + 0.11, y + 0.11, 2.1, 1.1, z + 5.2, fill);
}

export function verticalGlow(ctx, f, x, y, z, w, h, color) {
  const p = at(f, x, y, z + h * 0.5);
  aura(ctx, f, x, y, w, h * 0.42, z + h * 0.5, color);
  return p;
}
