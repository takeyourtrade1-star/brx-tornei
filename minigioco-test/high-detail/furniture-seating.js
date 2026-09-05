import { M, slab, top, poly, path, oval, aura, faceX, edgeLoop, at, faceRoundRect } from "./furniture-helpers.js";

export function drawSeat(ctx, f, upholstered = false) {
  oval(ctx, f, 0.5, 0.5, 25, 11, 0, M.shadowSoft);
  for (const [x, y] of [[0.22, 0.22], [0.70, 0.22], [0.22, 0.70], [0.70, 0.70]])
    path(ctx, f, [[x, y, 0], [x + (x - 0.5) * 0.12, y + (y - 0.5) * 0.12, 9]], M.brass, 1.5);
  if (upholstered) {
    slab(ctx, f, 0.31, 0.31, 0.38, 0.38, 7, 3, { top: M.walnutDeep, left: M.walnutDeep, right: M.walnut, edge: M.edgeDark });
    oval(ctx, f, 0.5, 0.52, 17, 7.2, 11, M.terracottaDeep);
    oval(ctx, f, 0.5, 0.48, 15, 5.7, 13, M.terracottaLight);
    path(ctx, f, [[0.35, 0.40, 13.7], [0.50, 0.36, 14], [0.65, 0.40, 13.7]], "rgba(255,247,230,0.50)", 0.6);
    poly(ctx, f, [[0.23, 0.14, 15], [0.77, 0.14, 15], [0.73, 0.14, 30], [0.63, 0.14, 34], [0.37, 0.14, 34], [0.27, 0.14, 30]], M.petrolDeep, M.edge, 0.7);
    poly(ctx, f, [[0.31, 0.135, 17], [0.69, 0.135, 17], [0.66, 0.135, 29], [0.59, 0.135, 32], [0.41, 0.135, 32], [0.34, 0.135, 29]], M.petrol, M.petrolLight, 0.55);
    oval(ctx, f, 0.5, 0.13, 12, 3.5, 33.5, M.petrolLight);
    path(ctx, f, [[0.50, 0.12, 19], [0.50, 0.12, 30]], "rgba(255,247,230,0.34)", 0.55);
    return;
  }
  slab(ctx, f, 0.28, 0.28, 0.44, 0.44, 8, 3, { top: M.ivoryLight, left: M.ivoryShade, right: M.walnutDeep, edge: M.edge });
  oval(ctx, f, 0.5, 0.5, 16, 6.5, 11.5, M.petrol);
  oval(ctx, f, 0.5, 0.47, 13, 4.5, 13, M.petrolLight);
}

function leaf(ctx, f, points, fill, vein) {
  poly(ctx, f, points, fill, M.green, 0.55);
  path(ctx, f, vein, "rgba(237,243,213,0.58)", 0.55);
}

export function drawPlant(ctx, f) {
  aura(ctx, f, 0.5, 0.5, 27, 11, 0, "rgba(30,37,38,0.11)");
  slab(ctx, f, 0.26, 0.26, 0.48, 0.48, 0, 13, { top: M.ivoryLight, left: M.terracottaDeep, right: M.terracotta, edge: M.edge });
  top(ctx, f, 0.31, 0.31, 0.38, 0.38, 13.2, M.walnutDeep, M.amber);
  path(ctx, f, [[0.5, 0.5, 13], [0.5, 0.5, 42], [0.44, 0.48, 49]], M.green, 2.1);
  path(ctx, f, [[0.49, 0.5, 27], [0.23, 0.27, 38]], M.green, 1.1);
  path(ctx, f, [[0.51, 0.49, 29], [0.82, 0.30, 42]], M.green, 1.1);
  leaf(ctx, f, [[0.48, 0.48, 28], [0.30, 0.28, 37], [0.06, 0.22, 42], [0.15, 0.56, 38], [0.41, 0.61, 31]], M.moss, [[0.48, 0.48, 29], [0.06, 0.22, 42]]);
  leaf(ctx, f, [[0.52, 0.48, 30], [0.66, 0.24, 40], [0.96, 0.20, 46], [0.86, 0.52, 39], [0.59, 0.61, 32]], M.green, [[0.52, 0.48, 31], [0.96, 0.20, 46]]);
  leaf(ctx, f, [[0.48, 0.50, 27], [0.24, 0.57, 33], [0.08, 0.83, 34], [0.43, 0.76, 28], [0.56, 0.57, 26]], M.moss, [[0.48, 0.50, 27], [0.08, 0.83, 34]]);
  leaf(ctx, f, [[0.52, 0.49, 26], [0.67, 0.58, 30], [0.96, 0.82, 32], [0.70, 0.87, 25], [0.48, 0.61, 24]], M.green, [[0.52, 0.49, 26], [0.96, 0.82, 32]]);
  leaf(ctx, f, [[0.47, 0.48, 34], [0.34, 0.20, 43], [0.51, 0.04, 47], [0.64, 0.22, 41], [0.55, 0.52, 35]], M.moss, [[0.47, 0.48, 35], [0.51, 0.04, 47]]);
  leaf(ctx, f, [[0.47, 0.50, 24], [0.32, 0.68, 26], [0.25, 0.96, 27], [0.47, 0.80, 23], [0.54, 0.57, 22]], M.green, [[0.47, 0.50, 24], [0.25, 0.96, 27]]);
  path(ctx, f, [[0.25, 0.29, 39], [0.18, 0.35, 40]], "rgba(21,61,57,0.54)", 0.7);
  path(ctx, f, [[0.78, 0.27, 42], [0.82, 0.36, 43]], "rgba(21,61,57,0.54)", 0.7);
  oval(ctx, f, 0.40, 0.31, 6, 2.6, 45, "rgba(216,235,198,0.46)");
}

export function drawCamera(ctx, f, alt = false) {
  oval(ctx, f, 0.5, 0.5, 25, 10, 0, M.shadowSoft);
  for (const [x, y] of [[0.18, 0.18], [0.80, 0.25], [0.48, 0.82]])
    path(ctx, f, [[0.5, 0.5, 30], [x, y, 0]], M.brass, 1.2);
  slab(ctx, f, 0.29, 0.30, 0.42, 0.34, 28, 10, { top: M.ivoryLight, left: M.petrolDeep, right: M.petrol, edge: M.edge });
  const lensY = alt ? 0.30 : 0.64;
  faceX(ctx, f, 0.30, 0.70, lensY, 31, 37, M.screen, M.ivoryLight, 0.7);
  oval(ctx, f, 0.50, lensY - 0.01, 6.2, 3.2, 34, M.screen);
  oval(ctx, f, 0.50, lensY - 0.01, 3.1, 1.7, 34.3, alt ? M.terracottaLight : M.cyan);
  faceRoundRect(ctx, f, 0.50, alt ? 0.29 : 0.63, 39, 8, 2, 0.8, M.amber, M.amberLight);
  path(ctx, f, [[0.39, 0.50, 40], [0.61, 0.50, 40]], M.ivoryLight, 0.6);
}

export function drawLamp(ctx, f) {
  oval(ctx, f, 0.5, 0.5, 24, 10, 0, M.shadowSoft);
  slab(ctx, f, 0.28, 0.28, 0.44, 0.44, 0, 3, { top: M.brass, left: M.walnutDeep, right: M.brass, edge: M.edge });
  path(ctx, f, [[0.50, 0.50, 3], [0.50, 0.50, 53], [0.58, 0.46, 61]], M.brass, 2.2);
  path(ctx, f, [[0.50, 0.50, 25], [0.48, 0.51, 46]], M.amberLight, 0.65);
  aura(ctx, f, 0.56, 0.44, 38, 22, 54, "rgba(240,202,115,0.10)");
  slab(ctx, f, 0.27, 0.22, 0.58, 0.40, 54, 8, { top: M.amber, left: M.walnutLight, right: M.brass, edge: M.edge });
  oval(ctx, f, 0.56, 0.42, 18, 6, 54, "rgba(255,236,170,0.68)");
  edgeLoop(ctx, f, [[0.25, 0.20], [0.86, 0.20], [0.86, 0.63], [0.25, 0.63]], 62.5, M.amberLight, 0.75);
}

export function drawTurntable(ctx, f) {
  oval(ctx, f, 0.5, 0.5, 25, 10, 0, M.shadowSoft);
  slab(ctx, f, 0.12, 0.12, 0.76, 0.76, 0, 9, { top: M.walnut, left: M.walnutDeep, right: M.walnutDeep, edge: M.edge });
  oval(ctx, f, 0.5, 0.5, 20, 8, 9.5, M.petrolDeep);
  oval(ctx, f, 0.5, 0.5, 17, 6.8, 10.5, M.screen);
  oval(ctx, f, 0.5, 0.5, 4.5, 2.1, 11, M.terracotta);
  oval(ctx, f, 0.5, 0.5, 1.7, 0.9, 11.5, M.amberLight);
  path(ctx, f, [[0.25, 0.37, 11.8], [0.78, 0.58, 11.8]], "rgba(202,232,220,0.44)", 0.45);
  path(ctx, f, [[0.70, 0.30, 13], [0.70, 0.30, 23], [0.53, 0.45, 23]], M.brass, 1.1);
  oval(ctx, f, 0.53, 0.45, 2.2, 1.2, 23, M.amberLight);
  const p = at(f, 0.30, 0.74, 14);
  faceRoundRect(ctx, f, 0.30, 0.74, 14, 5, 3, 1, M.terracotta, M.terracottaLight);
  return p;
}

export function drawSeatingFurniture(ctx, entity) {
  const { key } = entity;
  if (key === "chair") return drawSeat(ctx, entity, true);
  if (key === "stool" || key === "stool2") return drawSeat(ctx, entity, false);
  if (key === "plant") return drawPlant(ctx, entity);
  if (key === "cam") return drawCamera(ctx, entity, false);
  if (key === "cam2") return drawCamera(ctx, entity, true);
  if (key === "lamp") return drawLamp(ctx, entity);
  if (key === "turn") return drawTurntable(ctx, entity);
  return null;
}
