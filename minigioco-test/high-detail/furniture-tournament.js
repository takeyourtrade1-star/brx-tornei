import { M, slab, top, path, oval, aura, faceY, edgeLoop, at, fillGradient, faceRoundRect } from "./furniture-helpers.js";
import { drawTournamentTable } from "./furniture-tables.js";

function drawMonitor(ctx, f) {
  const x = 0.61;
  const screenX = 0.77;
  const y0 = 1.15;
  const y1 = 2.73;
  const centerY = 1.94;
  slab(ctx, f, x - 0.05, y0 - 0.04, 0.14, 1.66, 28, 4, { top: M.ivoryShade, left: M.petrolDeep, right: M.petrol, edge: M.edge });
  slab(ctx, f, x, y0, 0.16, 1.58, 32, 26, { top: M.ivoryLight, left: M.petrolDeep, right: M.petrol, edge: M.edge });
  faceY(ctx, f, screenX, y0 - 0.01, y1, 35, 60, M.petrolDeep, M.ivoryShade, 0.8);
  const screen = fillGradient(ctx, f, [screenX - 0.01, y0 + 0.07, 58], [screenX - 0.01, y1 - 0.07, 38], [[0, "#2A6B78"], [0.55, "#123B49"], [1, "#0A2935"]]);
  faceY(ctx, f, screenX - 0.01, y0 + 0.07, y1 - 0.07, 37.2, 57.8, screen);
  faceY(ctx, f, screenX - 0.02, 1.34, 1.63, 48, 53, M.cyanDeep);
  faceY(ctx, f, screenX - 0.02, 1.78, 2.04, 48, 53, M.terracottaLight);
  faceY(ctx, f, screenX - 0.02, 2.19, 2.46, 48, 53, M.amber);
  path(ctx, f, [[screenX - 0.025, 1.31, 42], [screenX - 0.025, 2.57, 42]], "rgba(147,237,222,0.76)", 0.8);
  path(ctx, f, [[screenX - 0.025, 1.31, 44], [screenX - 0.025, 2.06, 44]], "rgba(244,241,214,0.48)", 0.55);
  path(ctx, f, [[screenX - 0.02, y0 - 0.03, 60.8], [screenX - 0.02, y1, 60.8], [screenX - 0.02, y1, 34.5], [screenX - 0.02, y0 - 0.03, 34.5], [screenX - 0.02, y0 - 0.03, 60.8]], M.edge, 0.7);
  aura(ctx, f, screenX, centerY, 29, 42, 47, "rgba(90,216,213,0.08)");
  faceRoundRect(ctx, f, screenX, centerY, 62, 5, 2, 1, M.petrolDeep, M.cyan);
  oval(ctx, f, screenX, centerY, 1.1, 0.75, 63, M.cyan);
  return at(f, screenX, centerY, 48);
}

function drawDesk(ctx, f) {
  oval(ctx, f, 0.5, 1.52, 26, 13, 0, M.shadow);
  for (const [x, y] of [[0.08, 0.28], [0.72, 0.28], [0.08, 2.36], [0.72, 2.36]])
    slab(ctx, f, x, y, 0.12, 0.18, 0, 25, { top: M.ivoryShade, left: M.walnutDeep, right: M.walnut, edge: M.edgeDark });
  slab(ctx, f, 0.05, 0.13, 0.90, 2.74, 23, 5, { top: M.walnutLight, left: M.walnutDeep, right: M.walnut, edge: M.edge });
  top(ctx, f, 0.10, 0.17, 0.80, 2.66, 28.3, fillGradient(ctx, f, [0.05, 0.14, 28], [0.95, 2.85, 28], [[0, M.walnutLight], [0.5, M.walnut], [1, M.walnutDeep]]), M.edge);
  top(ctx, f, 0.16, 0.42, 0.68, 1.07, 28.8, M.petrolDeep, M.petrolLight);
  edgeLoop(ctx, f, [[0.14, 0.39], [0.84, 0.39], [0.84, 1.55], [0.14, 1.55]], 29.1, M.amberLight, 0.7);
  slab(ctx, f, 0.28, 1.73, 0.44, 0.34, 29, 2, { top: M.ivoryLight, left: M.ivoryShade, right: M.ivoryShade, edge: M.edge });
  for (let row = 0; row < 3; row += 1)
    path(ctx, f, [[0.32, 1.78 + row * 0.08, 31.2], [0.68, 1.78 + row * 0.08, 31.2]], "rgba(24,59,73,0.54)", 0.6);
  faceRoundRect(ctx, f, 0.77, 0.64, 31, 7, 4, 2, M.terracotta, M.terracottaLight);
  oval(ctx, f, 0.77, 0.64, 2.2, 1.1, 33, M.ivoryLight);
  slab(ctx, f, 0.62, 2.34, 0.27, 0.38, 28, 18, { top: M.petrolMid, left: M.petrolDeep, right: M.petrol, edge: M.edge });
  faceY(ctx, f, 0.75, 2.33, 2.64, 34, 41, M.screen, M.cyan, 0.5);
  for (const y of [2.39, 2.49, 2.59]) path(ctx, f, [[0.68, y, 34], [0.83, y, 34]], "rgba(122,224,213,0.55)", 0.55);
  path(ctx, f, [[0.16, 2.90, 29], [0.42, 2.90, 29], [0.62, 2.84, 29]], "rgba(255,243,211,0.34)", 0.55);
  drawMonitor(ctx, f);
}

export function drawTournamentFurniture(ctx, entity) {
  const key = entity.key === "tournamentdesk" ? "desk" : entity.key;
  if (key === "desk") return drawDesk(ctx, entity);
  if (key === "table") return drawTournamentTable(ctx, entity);
  return null;
}
