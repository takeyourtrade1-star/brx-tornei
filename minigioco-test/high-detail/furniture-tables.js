import { M, slab, top, poly, path, oval, aura, card, deck, die, fillGradient } from "./furniture-helpers.js";

function octagon(cut, z, w, d, inset = 0) {
  return [[inset + cut, inset, z], [w - inset - cut, inset, z], [w - inset, inset + cut, z], [w - inset, d - inset - cut, z],
    [w - inset - cut, d - inset, z], [inset + cut, d - inset, z], [inset, d - inset - cut, z], [inset, inset + cut, z]];
}

function closePath(points) { return points.concat([points[0]]); }

function verticalRim(ctx, f, bottom, topPoints) {
  const shades = [M.walnutDeep, M.walnut, M.walnutLight, M.walnut, M.walnutDeep, M.walnutDeep, M.walnut, M.walnutLight];
  for (let i = 0; i < bottom.length; i += 1) {
    const next = (i + 1) % bottom.length;
    poly(ctx, f, [bottom[i], bottom[next], topPoints[next], topPoints[i]], shades[i], M.edgeDark, 0.55);
  }
}

function illustratedCard(ctx, f, x, y, z, base, accent) {
  poly(ctx, f, [[x, y, z], [x + 0.30, y + 0.02, z], [x + 0.31, y + 0.45, z], [x + 0.02, y + 0.43, z]], base, M.ivoryLight, 0.65);
  poly(ctx, f, [[x + 0.04, y + 0.08, z + 0.3], [x + 0.26, y + 0.09, z + 0.3], [x + 0.27, y + 0.32, z + 0.3], [x + 0.05, y + 0.31, z + 0.3]], accent);
  poly(ctx, f, [[x + 0.05, y + 0.30, z + 0.45], [x + 0.12, y + 0.20, z + 0.45], [x + 0.18, y + 0.28, z + 0.45], [x + 0.27, y + 0.15, z + 0.45], [x + 0.27, y + 0.32, z + 0.45], [x + 0.05, y + 0.31, z + 0.45]], M.petrolDeep);
  oval(ctx, f, x + 0.18, y + 0.14, 1.7, 0.9, z + 0.55, M.amberLight);
  path(ctx, f, [[x + 0.08, y + 0.38, z + 0.55], [x + 0.26, y + 0.38, z + 0.55]], "rgba(255,247,230,0.7)", 0.45);
}

function fannedHand(ctx, f, x, y, z, base, accent, reverse = false) {
  for (let i = 0; i < 5; i += 1) {
    const spread = i * 0.055;
    const lift = i * 0.13;
    const offset = reverse ? (4 - i) * 0.035 : spread;
    illustratedCard(ctx, f, x + offset, y + (reverse ? spread : 0), z + lift, base, accent);
  }
}

function drawLegs(ctx, f, w, d) {
  for (const [x, y] of [[0.36, 0.36], [w - 0.52, 0.36], [0.36, d - 0.52], [w - 0.52, d - 0.52]]) {
    slab(ctx, f, x, y, 0.16, 0.16, 0, 16, { top: M.walnutLight, left: M.walnutDeep, right: M.walnut, edge: M.edgeDark });
    oval(ctx, f, x + 0.08, y + 0.08, 4, 2, 0.2, M.brass);
  }
  slab(ctx, f, 0.33, 0.30, w - 0.66, 0.11, 15, 3, { top: M.walnut, left: M.walnutDeep, right: M.walnut, edge: M.edgeDark });
  slab(ctx, f, 0.33, d - 0.41, w - 0.66, 0.11, 15, 3, { top: M.walnut, left: M.walnutDeep, right: M.walnut, edge: M.edgeDark });
}

export function drawTournamentTable(ctx, f) {
  const w = Math.min(3, f.w), d = Math.min(3, f.d);
  aura(ctx, f, w / 2, d / 2 + 0.05, 88, 30, 0, "rgba(30,37,38,0.18)");
  aura(ctx, f, w / 2, d / 2 + 0.05, 62, 20, 0, "rgba(30,37,38,0.09)");
  drawLegs(ctx, f, w, d);
  const bottom = octagon(0.14, 16.5, w, d);
  const outer = octagon(0.14, 21.8, w, d);
  const rim = octagon(0.20, 22.15, w, d, .11);
  const felt = octagon(0.18, 22.45, w, d, .26);
  verticalRim(ctx, f, bottom, outer);
  poly(ctx, f, outer, fillGradient(ctx, f, [0.2, 0.1, 22], [2.8, 2.9, 22], [[0, M.walnutLight], [0.5, M.walnut], [1, M.walnutDeep]]), M.edge, 0.7);
  poly(ctx, f, rim, M.walnut, M.amberLight, 0.8);
  poly(ctx, f, felt, fillGradient(ctx, f, [0.4, 0.4, 22], [2.6, 2.6, 22], [[0, "#2F7867"], [0.52, "#1C5A55"], [1, "#123E4D"]]), M.petrolLight, 0.7);
  path(ctx, f, closePath(outer), M.amberLight, 1.15);
  path(ctx, f, closePath(rim), "rgba(244,202,115,0.7)", 0.65);
  path(ctx, f, [[1.5, 0.52, 22.7], [1.5, d - 0.52, 22.7]], "rgba(232,245,221,0.46)", 0.55);
  path(ctx, f, [[0.52, 1.50, 22.7], [w - 0.52, 1.50, 22.7]], "rgba(232,245,221,0.34)", 0.55);
  poly(ctx, f, [[1.5, 1.10, 22.8], [1.65, 1.50, 22.8], [1.5, 1.90, 22.8], [1.35, 1.50, 22.8]], "rgba(240,202,115,0.38)");
  fannedHand(ctx, f, 0.54, 0.56, 23.0, M.ivoryLight, M.terracottaLight);
  fannedHand(ctx, f, 1.72, 1.98, 23.1, M.blush, M.petrolLight, true);
  deck(ctx, f, 0.48, 1.00, 22.9, M.terracotta, "A");
  deck(ctx, f, 2.10, 1.08, 22.9, M.petrolMid, "B");
  illustratedCard(ctx, f, 1.23, 1.03, 23.0, M.ivoryLight, M.amber);
  illustratedCard(ctx, f, 1.49, 1.34, 23.1, M.ivoryLight, M.cyanDeep);
  die(ctx, f, 0.86, 1.72, 23.0, M.amber);
  die(ctx, f, 2.13, 1.70, 23.0, M.ivoryShade);
}

function drawDuelMark(ctx, f, accent) {
  poly(ctx, f, [[1, 0.98, 23.1], [1.12, 1.25, 23.1], [1, 1.52, 23.1], [0.88, 1.25, 23.1]], accent);
  oval(ctx, f, 1, 1.25, 6, 2.5, 23.25, "rgba(255,247,224,0.28)");
}

export function drawDuelTable(ctx, f, accent = M.cyan, felt = M.petrol) {
  const w = Math.min(2, f.w), d = Math.min(2, f.d);
  aura(ctx, f, 1, 1.03, 50, 17, 0, "rgba(30,37,38,0.15)");
  slab(ctx, f, 0.22, 0.20, w - 0.44, d - 0.40, 0, 14, { top: M.walnut, left: M.walnutDeep, right: M.walnutDeep, edge: M.edgeDark });
  slab(ctx, f, 0.72, 0.70, 0.56, 0.56, 0, 14, { top: M.brass, left: M.walnutDeep, right: M.walnutDeep, edge: M.edge });
  slab(ctx, f, 0.04, 0.03, 1.92, 1.91, 14, 5, { top: M.walnutLight, left: M.walnutDeep, right: M.walnut, edge: M.edge });
  top(ctx, f, 0.14, 0.12, 1.72, 1.72, 19.2, M.walnut);
  top(ctx, f, 0.22, 0.20, 1.56, 1.56, 19.7, felt, accent);
  path(ctx, f, [[0.25, 0.22, 20], [1.75, 0.22, 20], [1.75, 1.72, 20], [0.25, 1.72, 20], [0.25, 0.22, 20]], M.amberLight, 0.95);
  path(ctx, f, [[1, 0.31, 20.1], [1, 1.66, 20.1]], "rgba(255,246,216,0.52)", 0.6);
  drawDuelMark(ctx, f, accent);
  card(ctx, f, 0.38, 0.42, 0.30, 0.46, 20.3, M.ivoryLight, M.terracottaLight);
  card(ctx, f, 0.64, 0.70, 0.30, 0.46, 20.5, M.terracotta, M.amberLight);
  card(ctx, f, 1.20, 1.14, 0.30, 0.46, 20.4, M.ivoryLight, accent);
  card(ctx, f, 1.42, 1.40, 0.30, 0.46, 20.6, M.blush, M.petrolLight);
  die(ctx, f, 0.99, 0.53, 20.4, accent);
  die(ctx, f, 1.07, 1.35, 20.4, M.amber);
}
