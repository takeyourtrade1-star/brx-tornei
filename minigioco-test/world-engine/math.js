/* Matematica condivisa. La geometria gia usata dal motore legacy resta la
 * fonte unica; qui aggiungiamo solo proiezione, fit e piccoli helper puri. */

import {
  COLS,
  ROWS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  CAMERA_MARGIN,
} from "./config.js";
import {
  clamp,
  easeInCubic,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  easeOutQuad,
  findPath,
  inGrid as legacyInGrid,
  lerp,
  shade,
  tileTop,
  tkey,
  worldToTile,
  hexA,
} from "../world-client/world-geometry.js";

export {
  clamp,
  easeInCubic,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  easeOutQuad,
  findPath,
  lerp,
  shade,
  tileTop,
  tkey,
  worldToTile,
  hexA,
};

export function inGrid(cx, cy, cols = COLS, rows = ROWS) {
  return Number.isInteger(cx) && Number.isInteger(cy)
    && cx >= 0 && cy >= 0 && cx < cols && cy < rows
    && legacyInGrid(cx, cy);
}

export function directionForStep(from, to) {
  const dx = to.cx - from.cx;
  const dy = to.cy - from.cy;
  if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) return dx > 0 ? "se" : "nw";
  if (dy !== 0) return dy > 0 ? "sw" : "ne";
  return null;
}

export function rectFromPoints(points) {
  if (!points.length) return { x: 0, y: 0, w: 0, h: 0 };
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

export function rectContains(point, rect) {
  return Boolean(rect)
    && point.x >= rect.x && point.x <= rect.x + rect.w
    && point.y >= rect.y && point.y <= rect.y + rect.h;
}

/* Il vecchio 1.1 causava crop sui wrapper bassi: il fit riserva margine al
 * nuovo HUD e non moltiplica la scala dopo aver verificato entrambi gli assi. */
export function fitWorldScale(width, height, margin = CAMERA_MARGIN) {
  const safeWidth = Number.isFinite(width) ? Math.max(1, width) : 1;
  const safeHeight = Number.isFinite(height) ? Math.max(1, height) : 1;
  const safeMargin = Number.isFinite(margin) ? Math.max(0, margin) : 0;
  const availableWidth = Math.max(1, safeWidth - safeMargin * 2);
  const availableHeight = Math.max(1, safeHeight - safeMargin * 2);
  return Math.max(0.3, Math.min(availableWidth / WORLD_WIDTH, availableHeight / WORLD_HEIGHT));
}

export function createProjector(view, camera) {
  const scale = () => Math.max(Number.EPSILON, view.scale * camera.z);
  return {
    project(wx, wy) {
      const s = scale();
      return { x: (wx - camera.x) * s + view.w / 2, y: (wy - camera.y) * s + view.h / 2 };
    },
    unproject(sx, sy) {
      const s = scale();
      return { x: (sx - view.w / 2) / s + camera.x, y: (sy - view.h / 2) / s + camera.y };
    },
  };
}
