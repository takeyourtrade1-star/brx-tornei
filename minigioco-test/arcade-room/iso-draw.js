/* ============================================================================
   iso-draw — primitive di disegno isometrico per gli sprite e lo sfondo della
   Sala Arcade. Copia autocontenuta delle utility di IsoRoomGame (che non le
   esporta): stesso formato di output ({ cv, ax, ay }) così il motore può
   consumare gli sprite con outlined()/makeSil() senza differenze.
   ========================================================================== */

export const HTW = 32, HTH = 16;
export const COLS = 12, ROWS = 10;
export const WW = 736, WH = 560;
export const OX = 336, OY = 150;
export const WALL_H = 112;

export const tileTop = (cx, cy) => ({ x: (cx - cy) * HTW + OX, y: (cx + cy) * HTH + OY });
export const isoVec = (tx, ty) => ({ x: (tx - ty) * HTW, y: (tx + ty) * HTH });

export const wallL = (c, hh) => ({ x: -c * HTW + OX, y: c * HTH - hh + OY });
export const wallR = (c, hh) => ({ x: c * HTW + OX, y: c * HTH - hh + OY });

export function mkCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
}

export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.max(0, Math.min(255, Math.round(r * f + (f > 1 ? 12 : 0))));
  g = Math.max(0, Math.min(255, Math.round(g * f + (f > 1 ? 12 : 0))));
  b = Math.max(0, Math.min(255, Math.round(b * f + (f > 1 ? 12 : 0))));
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

export function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
}

export function quadFill(ctx, pts, fill, stroke, lw) {
  ctx.beginPath();
  ctx.moveTo(Math.round(pts[0].x), Math.round(pts[0].y));
  for (let i = 1; i < pts.length; i++) ctx.lineTo(Math.round(pts[i].x), Math.round(pts[i].y));
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}

export function isoBox(ctx, tx, ty, w, d, h, c, opts = {}) {
  const o = isoVec(tx, ty);
  const z = opts.z || 0;
  o.y -= z;
  const T = { x: o.x, y: o.y };
  const R = { x: o.x + isoVec(w, 0).x, y: o.y + isoVec(w, 0).y };
  const B = { x: o.x + isoVec(w, d).x, y: o.y + isoVec(w, d).y };
  const L = { x: o.x + isoVec(0, d).x, y: o.y + isoVec(0, d).y };
  const up = (p) => ({ x: p.x, y: p.y - h });
  quadFill(ctx, [L, B, up(B), up(L)], opts.left || shade(c, 0.88));
  quadFill(ctx, [B, R, up(R), up(B)], opts.right || shade(c, 0.64));
  quadFill(ctx, [up(T), up(R), up(B), up(L)], opts.top || shade(c, 1.16));
  if (!opts.noEdge) {
    ctx.strokeStyle = opts.edge || "rgba(255,255,255,0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.round(L.x), Math.round(L.y - h));
    ctx.lineTo(Math.round(B.x), Math.round(B.y - h));
    ctx.lineTo(Math.round(R.x), Math.round(R.y - h));
    ctx.stroke();
  }
  return { T, R, B, L, up };
}

export function mkSprite(wT, dT, up, draw) {
  const pad = 6;
  const cv = mkCanvas(Math.ceil((wT + dT) * HTW) + pad * 2, Math.ceil((wT + dT) * HTH) + up + pad * 2);
  const ctx = cv.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const ax = Math.ceil(dT * HTW) + pad, ay = up + pad;
  ctx.save();
  ctx.translate(ax, ay);
  draw(ctx);
  ctx.restore();
  return { cv, ax, ay };
}
