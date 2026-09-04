import { P, HTW, HTH, COLS, ROWS, OX, OY } from "../room-art/room-config";
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t) => t * t * t;
export const easeOutBack = (t) => Math.max(0, 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2));

/** tile (anche frazionario) -> px mondo del vertice alto del diamante */
export const tileTop = (cx, cy) => ({ x: (cx - cy) * HTW + OX, y: (cx + cy) * HTH + OY });
/** px mondo -> tile intero */
export const worldToTile = (wx, wy) => {
  const lx = wx - OX, ly = wy - OY;
  return { cx: Math.floor((lx / HTW + ly / HTH) / 2), cy: Math.floor((ly / HTH - lx / HTW) / 2) };
};
export const inGrid = (cx, cy) => cx >= 0 && cy >= 0 && cx < COLS && cy < ROWS;
export const tkey = (cx, cy) => cx + "," + cy;

/** scurisce/schiarisce un colore hex */
export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = clamp(Math.round(r * f + (f > 1 ? 12 : 0)), 0, 255);
  g = clamp(Math.round(g * f + (f > 1 ? 12 : 0)), 0, 255);
  b = clamp(Math.round(b * f + (f > 1 ? 12 : 0)), 0, 255);
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

/** hex -> rgba con alpha */
export function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
}

/** A* 4-direzioni sulla griglia */
export function findPath(start, goal, blocked) {
  if (!inGrid(goal.cx, goal.cy) || blocked.has(tkey(goal.cx, goal.cy))) return null;
  if (start.cx === goal.cx && start.cy === goal.cy) return [];
  const open = [{ x: start.cx, y: start.cy, g: 0, f: 0, p: null }];
  const best = new Map([[tkey(start.cx, start.cy), 0]]);
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const n = open.splice(bi, 1)[0];
    if (n.x === goal.cx && n.y === goal.cy) {
      const out = [];
      for (let c = n; c; c = c.p) out.unshift({ cx: c.x, cy: c.y });
      out.shift(); // rimuovi tile di partenza
      return out;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = n.x + dx, ny = n.y + dy;
      if (!inGrid(nx, ny) || blocked.has(tkey(nx, ny))) continue;
      const g = n.g + 1, k = tkey(nx, ny);
      if (best.has(k) && best.get(k) <= g) continue;
      best.set(k, g);
      open.push({ x: nx, y: ny, g, f: g + Math.abs(nx - goal.cx) + Math.abs(ny - goal.cy), p: n });
    }
  }
  return null;
}

/** ordinamento in profondità per footprint rettangolari (assi separatori) */
export function cmpDepth(a, b) {
  if (a.maxX < b.minX) return -1;
  if (b.maxX < a.minX) return 1;
  if (a.maxY < b.minY) return -1;
  if (b.maxY < a.minY) return 1;
  return a.maxX + a.maxY - (b.maxX + b.maxY);
}

export function mkCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
}

/* ====================== 4. SPRITE FACTORY (pixel-art) ================== */

export const isoVec = (tx, ty) => ({ x: (tx - ty) * HTW, y: (tx + ty) * HTH });

export function quadFill(ctx, pts, fill, stroke, lw) {
  ctx.beginPath();
  ctx.moveTo(Math.round(pts[0].x), Math.round(pts[0].y));
  for (let i = 1; i < pts.length; i++) ctx.lineTo(Math.round(pts[i].x), Math.round(pts[i].y));
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}

/** cuboide isometrico: origine = vertice alto del tile (0,0) locale */
export function isoBox(ctx, tx, ty, w, d, h, c, opts = {}) {
  const o = isoVec(tx, ty);
  const z = opts.z || 0;             // sollevamento (es. oggetti appoggiati su un piano)
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

/** crea sprite con anchor sul vertice alto del suo tile minimo */
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

/** contorno scuro 1px attorno allo sprite (stile pixel-art) */
export function outlined(sp, color = P.outline) {
  const { cv } = sp;
  const sil = mkCanvas(cv.width, cv.height);
  const sc = sil.getContext("2d");
  sc.drawImage(cv, 0, 0);
  sc.globalCompositeOperation = "source-in";
  sc.fillStyle = color;
  sc.fillRect(0, 0, sil.width, sil.height);
  const out = mkCanvas(cv.width + 2, cv.height + 2);
  const oc = out.getContext("2d");
  for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) oc.drawImage(sil, dx, dy);
  oc.drawImage(cv, 1, 1);
  return { cv: out, ax: sp.ax + 1, ay: sp.ay + 1 };
}

/** silhouette gialla per il glow di prossimità */
export function makeSil(sp, color = "#ffd76e") {
  const sil = mkCanvas(sp.cv.width, sp.cv.height);
  const sc = sil.getContext("2d");
  sc.drawImage(sp.cv, 0, 0);
  sc.globalCompositeOperation = "source-in";
  sc.fillStyle = color;
  sc.fillRect(0, 0, sil.width, sil.height);
  return sil;
}

/* punti sulle pareti:
   wallL → parete sinistra (parametro = riga cy)
   wallR → parete di fondo (parametro = colonna cx)
   wallFar → parete destra (parametro = riga cy, bordo cx=COLS) */
export const wallL = (c, hh) => ({ x: -c * HTW + OX, y: c * HTH - hh + OY });
export const wallR = (c, hh) => ({ x: c * HTW + OX, y: c * HTH - hh + OY });
export const wallFar = (row, hh) => {
  const b = tileTop(COLS, row);
  return { x: b.x + HTW, y: b.y - hh };
};

/* Porta Arcade — incassata nella parete di fondo (parete vera, illuminata),
   nell'angolo destro dove prima c'era un poster decorativo. Posizione sensata:
   accanto al citofono, lontana da bacheca e tavolo. */
