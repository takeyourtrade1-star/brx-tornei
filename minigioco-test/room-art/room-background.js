/* Fondale statico della Sala Tornei. Il motore può conservarlo e ricostruirlo
 * solo quando cambiano fase del giorno, statistiche o poster dinamici. */

import { WW, WH, P, dayPhase, resolvePhase } from "./room-config.js";
import { mkCanvas, drawBackdrop, drawWalls, drawBaseboards, drawFloor, drawRug, drawWindowBeam, drawRoomDoors } from "./room-primitives.js";
import { drawWallArt, drawIntercom } from "./room-wall-art.js";
import { tourDoorBounds, socialDoorBounds } from "./doors.js";

export function buildBackground(phase = dayPhase(), stats = null, posters = null) {
  const cv = mkCanvas(WW, WH);
  const ctx = cv.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const current = resolvePhase(phase);

  drawBackdrop(ctx);
  drawWalls(ctx);
  drawWallArt(ctx, current, stats, posters);
  drawBaseboards(ctx);
  drawFloor(ctx);
  drawRug(ctx);
  drawWindowBeam(ctx, current);
  drawIntercom(ctx);
  drawRoomDoors(ctx);
  return cv;
}

/* Bounds condivisi con il click sulle due porte, senza ricreare coordinate. */
export { tourDoorBounds, socialDoorBounds };
export { P };
