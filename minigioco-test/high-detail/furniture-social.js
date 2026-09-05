import { M, slab, top, path, oval, poly, edgeLoop } from "./furniture-helpers.js";
import { drawDuelTable } from "./furniture-tables.js";
import { drawPlant } from "./furniture-seating.js";

function drawBench(ctx, f) {
  oval(ctx, f, 0.5, 1, 25, 19, 0, M.shadow);
  for (const [x, y] of [[0.16, 0.24], [0.72, 0.24], [0.16, 1.66], [0.72, 1.66]])
    path(ctx, f, [[x, y, 0], [x, y, 8]], M.brass, 1.6);
  slab(ctx, f, 0.06, 0.22, 0.88, 1.58, 8, 5, { top: M.walnutLight, left: M.walnutDeep, right: M.walnut, edge: M.edge });
  top(ctx, f, 0.12, 0.30, 0.76, 1.42, 13.2, M.walnut, M.amber);
  slab(ctx, f, 0.10, 0.18, 0.80, 0.12, 12, 15, { top: M.petrol, left: M.petrolDeep, right: M.petrol, edge: M.edge });
  edgeLoop(ctx, f, [[0.14, 0.17], [0.86, 0.17], [0.86, 0.31], [0.14, 0.31]], 27.2, M.petrolLight, 0.7);
  for (const y of [0.55, 0.92, 1.29]) path(ctx, f, [[0.17, y, 13.7], [0.83, y, 13.7]], "rgba(255,245,215,0.28)", 0.55);
  poly(ctx, f, [[0.28, 0.37, 14], [0.50, 0.30, 14], [0.72, 0.37, 14], [0.50, 0.45, 14]], "rgba(240,202,115,0.22)");
}

export function drawPiazzaFurniture(ctx, entity) {
  if (entity.key === "table1") return drawDuelTable(ctx, entity, M.green, "#1F604F");
  if (entity.key === "table2") return drawDuelTable(ctx, entity, M.cyan, "#1D526B");
  if (entity.key === "plant") return drawPlant(ctx, entity);
  if (entity.key === "bench") return drawBench(ctx, entity);
  return null;
}
