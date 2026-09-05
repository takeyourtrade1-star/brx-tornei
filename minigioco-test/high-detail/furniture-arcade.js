import { M, slab, top, poly, path, oval, aura, faceX, edgeLoop, fillGradient, faceRoundRect } from "./furniture-helpers.js";
import { drawDuelTable } from "./furniture-tables.js";

const ACCENTS = [M.cyan, M.amber, M.terracottaLight];
const SCREEN_BACKS = ["#123D46", "#204A3D", "#3B2E4B"];

function cabinetIndex(key) {
  const match = String(key).match(/([123])$/);
  return match ? Number(match[1]) - 1 : 0;
}

function screenArt(ctx, f, index) {
  const accent = ACCENTS[index];
  if (index === 0) {
    for (let n = 0; n < 5; n += 1) {
      faceX(ctx, f, 0.69 - n * 0.06, 1.31 + n * 0.06, 0.145, 39 + n * 3, 42 + n * 3, accent);
    }
    path(ctx, f, [[0.72, 0.14, 54], [1.28, 0.14, 49]], M.amberLight, 1.1);
  } else if (index === 1) {
    poly(ctx, f, [[0.88, 0.14, 39], [1.12, 0.14, 39], [1.12, 0.14, 48], [0.88, 0.14, 48]], M.terracottaLight);
    poly(ctx, f, [[0.83, 0.14, 48], [1.17, 0.14, 48], [1.17, 0.14, 53], [0.83, 0.14, 53]], M.amber);
    oval(ctx, f, 1, 0.12, 3.5, 1.6, 56, M.ivoryLight);
    path(ctx, f, [[0.58, 0.14, 39], [0.77, 0.14, 43], [0.58, 0.14, 47]], M.cyan, 1);
  } else {
    for (let col = 0; col < 3; col += 1) for (let row = 0; row < 2; row += 1) {
      const fill = (col + row) % 2 ? M.amber : M.terracottaLight;
      faceRoundRect(ctx, f, 0.70 + col * 0.30, 0.13, 43 + row * 8, 8, 8, 1.4, fill);
      faceRoundRect(ctx, f, 0.70 + col * 0.30, 0.125, 44 + row * 8, 2, 2, 0.6, M.ivoryLight);
    }
    path(ctx, f, [[0.59, 0.14, 55], [1.41, 0.14, 55]], M.cyan, 0.8);
  }
  for (let z = 39; z <= 57; z += 4) path(ctx, f, [[0.56, 0.14, z], [1.44, 0.14, z]], "rgba(238,246,224,0.12)", 0.45);
}

function drawCabinet(ctx, f, index, piazza) {
  const accent = ACCENTS[index];
  const body = piazza ? M.ivory : M.petrolDeep;
  const bodyTop = piazza ? M.ivoryLight : M.petrol;
  oval(ctx, f, f.w / 2, 0.53, 54, 15, 0, M.shadow);
  slab(ctx, f, 0.24, 0.11, 1.52, 0.78, 0, 8, { top: M.walnut, left: M.walnutDeep, right: M.walnutDeep, edge: M.edgeDark });
  slab(ctx, f, 0.36, 0.18, 1.28, 0.58, 8, 60, { top: bodyTop, left: body, right: piazza ? M.ivoryShade : M.petrol, edge: M.edge });
  slab(ctx, f, 0.30, 0.14, 1.40, 0.66, 68, 7, {
    top: piazza ? M.ivoryLight : accent, left: accent, right: piazza ? M.ivoryShade : M.petrolDeep, edge: M.edge,
  });
  edgeLoop(ctx, f, [[0.34, 0.14], [1.66, 0.14], [1.66, 0.80], [0.34, 0.80]], 75, accent, 1.25);
  faceX(ctx, f, 0.49, 1.51, 0.172, 31, 61, piazza ? M.petrolDeep : M.screen, M.ivoryShade, 1.2);
  const screen = fillGradient(ctx, f, [0.54, 0.16, 58], [1.46, 0.16, 35], [[0, SCREEN_BACKS[index]], [0.6, M.screen], [1, "#0A2632"]]);
  faceX(ctx, f, 0.55, 1.45, 0.16, 35, 58, screen);
  screenArt(ctx, f, index);
  faceX(ctx, f, 0.44, 1.56, 0.16, 62, 67, accent, M.ivoryLight, 0.6);
  path(ctx, f, [[0.51, 0.14, 65], [1.49, 0.14, 65]], "rgba(255,247,225,0.54)", 0.7);
  slab(ctx, f, 0.50, 0.72, 1.0, 0.22, 7, 5, { top: M.walnutLight, left: M.walnutDeep, right: M.walnut, edge: M.edge });
  top(ctx, f, 0.58, 0.73, 0.84, 0.18, 12.3, M.petrol, accent);
  path(ctx, f, [[0.77, 0.76, 13], [0.77, 0.76, 18]], M.brass, 1.1);
  oval(ctx, f, 0.77, 0.76, 3.4, 1.8, 18.5, accent);
  for (const x of [1.04, 1.22, 1.40]) oval(ctx, f, x, 0.79, 2.2, 1.1, 14, x === 1.22 ? M.amberLight : M.terracottaLight);
  slab(ctx, f, 0.55, 0.80, 0.90, 0.08, 0, 3, { top: accent, left: accent, right: M.petrolDeep, edge: M.edge });
  aura(ctx, f, 1, 0.14, 37, 12, 48, `${accent}22`);
}

function drawSofa(ctx, f) {
  oval(ctx, f, 1, 0.5, 53, 15, 0, M.shadow);
  for (const x of [0.22, 1.72]) slab(ctx, f, x, 0.18, 0.08, 0.58, 0, 6, { top: M.brass, left: M.walnutDeep, right: M.brass, edge: M.edge });
  slab(ctx, f, 0.08, 0.12, 1.84, 0.18, 6, 21, { top: M.terracotta, left: M.terracottaDeep, right: M.terracotta, edge: M.edge });
  slab(ctx, f, 0.15, 0.21, 1.70, 0.58, 6, 5, { top: M.walnutDeep, left: M.walnutDeep, right: M.walnut, edge: M.edgeDark });
  oval(ctx, f, 0.60, 0.51, 19, 6.5, 12, M.terracottaLight);
  oval(ctx, f, 1.40, 0.51, 19, 6.5, 12, M.terracottaLight);
  path(ctx, f, [[1, 0.28, 13], [1, 0.73, 13]], M.terracottaDeep, 0.8);
  slab(ctx, f, 0.12, 0.18, 0.14, 0.65, 6, 14, { top: M.terracottaLight, left: M.terracottaDeep, right: M.terracotta, edge: M.edge });
  slab(ctx, f, 1.74, 0.18, 0.14, 0.65, 6, 14, { top: M.terracottaLight, left: M.terracottaDeep, right: M.terracotta, edge: M.edge });
  path(ctx, f, [[0.36, 0.20, 26], [1.64, 0.20, 26]], "rgba(255,242,213,0.35)", 0.7);
}

function drawTicket(ctx, f) {
  oval(ctx, f, 0.5, 0.5, 25, 10, 0, M.shadowSoft);
  slab(ctx, f, 0.15, 0.15, 0.70, 0.70, 0, 48, { top: M.ivory, left: M.petrolDeep, right: M.petrol, edge: M.edge });
  faceX(ctx, f, 0.27, 0.73, 0.13, 19, 43, M.screen, M.amber, 0.8);
  for (let z = 23; z < 42; z += 4) path(ctx, f, [[0.34, 0.12, z], [0.66, 0.12, z]], "rgba(240,202,115,0.6)", 0.6);
  faceX(ctx, f, 0.28, 0.72, 0.12, 11, 18, M.terracotta, M.terracottaLight, 0.7);
  faceRoundRect(ctx, f, 0.50, 0.10, 14, 12, 3, 1, M.ivoryLight, M.amber);
  path(ctx, f, [[0.40, 0.10, 14], [0.60, 0.10, 14]], M.terracotta, 0.6);
  oval(ctx, f, 0.50, 0.12, 3.5, 1.8, 7, M.cyan);
}

function drawPopcorn(ctx, f) {
  oval(ctx, f, 0.5, 0.5, 23, 9, 0, M.shadowSoft);
  slab(ctx, f, 0.28, 0.28, 0.44, 0.44, 0, 15, { top: M.walnut, left: M.walnutDeep, right: M.petrolDeep, edge: M.edge });
  poly(ctx, f, [[0.30, 0.31, 16], [0.70, 0.31, 16], [0.65, 0.63, 31], [0.35, 0.63, 31]], M.terracotta, M.amberLight, 0.7);
  path(ctx, f, [[0.37, 0.38, 21], [0.40, 0.59, 30]], M.ivoryLight, 1.25);
  path(ctx, f, [[0.51, 0.36, 21], [0.51, 0.61, 30]], M.ivoryLight, 1.25);
  path(ctx, f, [[0.65, 0.38, 21], [0.61, 0.59, 30]], M.ivoryLight, 1.25);
  for (const [x, y, z] of [[0.39, 0.48, 32], [0.51, 0.39, 34], [0.64, 0.48, 33], [0.49, 0.56, 35], [0.59, 0.55, 35]])
    oval(ctx, f, x, y, 3.6, 2.2, z, M.amberLight);
}

export function drawArcadeFurniture(ctx, entity, room) {
  const { key } = entity;
  const normalized = key.toLowerCase();
  if (key === "kakeTable") return drawDuelTable(ctx, entity, M.terracottaLight, M.petrolDeep);
  if (key === "sofa") return drawSofa(ctx, entity);
  if (key === "ticket") return drawTicket(ctx, entity);
  if (key === "popcorn") return drawPopcorn(ctx, entity);
  if (normalized.startsWith("cabinet") || normalized.startsWith("arcadecabinet") || normalized.startsWith("piazzacabinet") || normalized.startsWith("allroomcabinet")) {
    return drawCabinet(ctx, entity, cabinetIndex(key), room === "piazza");
  }
  return null;
}
