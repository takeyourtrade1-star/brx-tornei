/**
 * Primitive geometriche e di disegno isometrico per Sala Piazza.
 * Mantiene la stessa metrica e convenzione di coordinate del resto del videogioco.
 */

export const HTW = 32;
export const HTH = 16;
export const COLS = 12;
export const ROWS = 10;
export const WW = 736;
export const WH = 560;
export const OX = 336;
export const OY = 150;
export const WALL_H = 112;

export interface IsoPoint {
  readonly x: number;
  readonly y: number;
}

export interface IsoSprite {
  readonly cv: HTMLCanvasElement;
  readonly ax: number;
  readonly ay: number;
}

export const tileTop = (cx: number, cy: number): IsoPoint => ({
  x: (cx - cy) * HTW + OX,
  y: (cx + cy) * HTH + OY,
});

export const isoVec = (tx: number, ty: number): IsoPoint => ({
  x: (tx - ty) * HTW,
  y: (tx + ty) * HTH,
});

export const wallL = (c: number, hh: number): IsoPoint => ({
  x: -c * HTW + OX,
  y: c * HTH - hh + OY,
});

export const wallR = (c: number, hh: number): IsoPoint => ({
  x: c * HTW + OX,
  y: c * HTH - hh + OY,
});

export function mkCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

export function shade(hex: string, factor: number): string {
  const cleanHex = hex.startsWith("#") ? hex.slice(1) : hex;
  const n = parseInt(cleanHex, 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const boost = factor > 1 ? 12 : 0;
  r = Math.max(0, Math.min(255, Math.round(r * factor + boost)));
  g = Math.max(0, Math.min(255, Math.round(g * factor + boost)));
  b = Math.max(0, Math.min(255, Math.round(b * factor + boost)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function hexA(hex: string, alpha: number): string {
  const cleanHex = hex.startsWith("#") ? hex.slice(1) : hex;
  const n = parseInt(cleanHex, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function quadFill(
  ctx: CanvasRenderingContext2D,
  pts: readonly IsoPoint[],
  fill?: string | CanvasGradient | false,
  stroke?: string | false,
  lw = 1,
): void {
  if (pts.length < 3) return;
  ctx.beginPath();
  const first = pts[0];
  if (!first) return;
  ctx.moveTo(Math.round(first.x), Math.round(first.y));
  for (let i = 1; i < pts.length; i++) {
    const pt = pts[i];
    if (pt) ctx.lineTo(Math.round(pt.x), Math.round(pt.y));
  }
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

export interface IsoBoxOptions {
  readonly z?: number;
  readonly top?: string;
  readonly left?: string;
  readonly right?: string;
  readonly edge?: string;
  readonly noEdge?: boolean;
}

export function isoBox(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  w: number,
  d: number,
  h: number,
  baseColor: string,
  opts: IsoBoxOptions = {},
): {
  T: IsoPoint;
  R: IsoPoint;
  B: IsoPoint;
  L: IsoPoint;
  up: (p: IsoPoint) => IsoPoint;
} {
  const baseVec = isoVec(tx, ty);
  const z = opts.z ?? 0;
  const oy = baseVec.y - z;
  const T = { x: baseVec.x, y: oy };
  const R = { x: baseVec.x + isoVec(w, 0).x, y: oy + isoVec(w, 0).y };
  const B = { x: baseVec.x + isoVec(w, d).x, y: oy + isoVec(w, d).y };
  const L = { x: baseVec.x + isoVec(0, d).x, y: oy + isoVec(0, d).y };
  const up = (p: IsoPoint): IsoPoint => ({ x: p.x, y: p.y - h });

  quadFill(ctx, [L, B, up(B), up(L)], opts.left || shade(baseColor, 0.88));
  quadFill(ctx, [B, R, up(R), up(B)], opts.right || shade(baseColor, 0.64));
  quadFill(ctx, [up(T), up(R), up(B), up(L)], opts.top || shade(baseColor, 1.16));

  if (!opts.noEdge) {
    ctx.strokeStyle = opts.edge || "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.round(L.x), Math.round(L.y - h));
    ctx.lineTo(Math.round(B.x), Math.round(B.y - h));
    ctx.lineTo(Math.round(R.x), Math.round(R.y - h));
    ctx.stroke();
  }

  return { T, R, B, L, up };
}

export function mkSprite(
  wT: number,
  dT: number,
  up: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): IsoSprite {
  const pad = 6;
  const cv = mkCanvas(
    Math.ceil((wT + dT) * HTW) + pad * 2,
    Math.ceil((wT + dT) * HTH) + up + pad * 2,
  );
  const ctx = cv.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    const ax = Math.ceil(dT * HTW) + pad;
    const ay = up + pad;
    ctx.save();
    ctx.translate(ax, ay);
    draw(ctx);
    ctx.restore();
    return { cv, ax, ay };
  }
  return { cv, ax: 0, ay: 0 };
}
