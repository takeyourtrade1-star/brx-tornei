import { point, box, line, ellipse, glow, gradient } from './primitives';

const WOOD = { top: '#d4a471', left: '#9e6847', right: '#654b3a', edge: '#efc698' };

function leaf(ctx, x, y, angle, size, shade) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-size * .8, -size * .32, -size * .48, -size * .9, 0, -size);
  ctx.bezierCurveTo(size * .8, -size * .65, size * .65, -size * .25, 0, 0);
  ctx.fillStyle = gradient(ctx, -size / 2, -size, size / 2, 0, [[0, shade], [1, '#214e43']]);
  ctx.fill();
  line(ctx, [{ x: 0, y: 0 }, { x: 0, y: -size * .8 }], 'rgba(194,222,157,.4)', .5);
  ctx.restore();
}

function bush(ctx, x, y, width = 21) {
  for (let i = 0; i < 14; i++) {
    const a = i * 2.4;
    const spread = Math.sqrt(i / 14) * width;
    const lx = x + Math.cos(a) * spread;
    const ly = y + Math.sin(a) * spread * .4;
    line(ctx, [{ x, y: y + 14 }, { x: lx, y: ly - 7 }], '#3e6a4b', 1.2);
    leaf(ctx, lx, ly, Math.sin(a) * 1.4, 12 + i % 4 * 2, i % 3 ? '#75a477' : '#9eb782');
  }
}

function vine(ctx, x, y, length) {
  const steps = Math.floor(length / 5);
  const points = Array.from({ length: steps }, (_, i) => ({ x: x + Math.sin(i * .65) * 3, y: y + i * 5 }));
  line(ctx, points, '#4d754c', 1);
  points.forEach((p, i) => leaf(ctx, p.x, p.y, i % 2 ? -1 : 1, 7, i % 2 ? '#83a96d' : '#668c57'));
}

function hangingPlanter(ctx, column, includeFoliage = true) {
  const top = point(.07, column, 105);
  const pot = point(.07, column, 72);
  line(ctx, [top, { x: pot.x - 8, y: pot.y }, { x: pot.x + 8, y: pot.y }, top], '#d6bc85', .8);
  ellipse(ctx, pot.x, pot.y + 4, 8, 7, '#a85e43');
  ellipse(ctx, pot.x, pot.y, 9, 3.2, '#df9d73');
  if (includeFoliage) drawHangingFoliage(ctx, column);
}

function drawHangingFoliage(ctx, column) {
  const pot = point(.07, column, 72);
  bush(ctx, pot.x, pot.y - 3, 8);
  vine(ctx, pot.x + 6, pot.y + 1, 26);
}

function drawBoxFoliage(ctx, y) {
  const p = point(.18, y + .48, 44);
  bush(ctx, p.x, p.y, 15);
  for (let i = 0; i < 4; i++) {
    const x = p.x + (i - 1.5) * 7, yy = p.y - 6 + i % 2 * 3;
    ellipse(ctx, x, yy, 3, 2.5, i % 2 ? '#e6ab85' : '#e5c77d');
    ellipse(ctx, x, yy, .9, .9, '#fff0c1');
  }
}

function drawCornerFoliage(ctx) {
  const corner = point(.15, .4, 100);
  bush(ctx, corner.x, corner.y, 25);
  vine(ctx, corner.x + 13, corner.y + 7, 46);
}

/** Layer foliage precalcolabili; i bounds sono nel sistema pixel del diorama. */
export const TERRACE_FOLIAGE_ITEMS = Object.freeze([
  Object.freeze({ id: 'hanging-3', bounds: Object.freeze({ x: 205, y: 104, w: 76, h: 88 }), anchor: point(.07, 3, 72), phase: 0.4, amplitude: 1.0, tilt: 0.012 }),
  Object.freeze({ id: 'hanging-7', bounds: Object.freeze({ x: 68, y: 171, w: 76, h: 82 }), anchor: point(.07, 7.3, 72), phase: 2.1, amplitude: 1.1, tilt: 0.014 }),
  Object.freeze({ id: 'box-2', bounds: Object.freeze({ x: 220, y: 112, w: 86, h: 72 }), anchor: point(.18, 2.48, 44), phase: 0.9, amplitude: 0.7, tilt: 0.010 }),
  Object.freeze({ id: 'box-5', bounds: Object.freeze({ x: 114, y: 158, w: 86, h: 72 }), anchor: point(.18, 5.78, 44), phase: 2.7, amplitude: 0.7, tilt: 0.010 }),
  Object.freeze({ id: 'box-8', bounds: Object.freeze({ x: 4, y: 214, w: 86, h: 72 }), anchor: point(.18, 9.28, 44), phase: 4.5, amplitude: 0.7, tilt: 0.010 }),
  Object.freeze({ id: 'corner', bounds: Object.freeze({ x: 275, y: 24, w: 116, h: 122 }), anchor: point(.15, .4, 100), phase: 1.5, amplitude: 1.3, tilt: 0.016 }),
]);

/** Disegna un solo elemento foliage nel sistema di coordinate globale del canvas. */
export function drawFoliageItem(ctx, index) {
  if (!ctx || !TERRACE_FOLIAGE_ITEMS[index]) return null;
  const item = TERRACE_FOLIAGE_ITEMS[index];
  if (item.id === 'hanging-3') drawHangingFoliage(ctx, 3);
  if (item.id === 'hanging-7') drawHangingFoliage(ctx, 7.3);
  if (item.id === 'box-2') drawBoxFoliage(ctx, 2);
  if (item.id === 'box-5') drawBoxFoliage(ctx, 5.3);
  if (item.id === 'box-8') drawBoxFoliage(ctx, 8.8);
  if (item.id === 'corner') drawCornerFoliage(ctx);
  return true;
}

/** Verde e pergola sul parapetto: il centro della terrazza rimane percorribile. */
export function drawTerraceGarden(ctx, options = {}) {
  const omitFoliage = options?.omitFoliage === true;
  for (const y of [1.15, 8.8]) box(ctx, -.02, y, .16, .16, 23, 88, WOOD);
  box(ctx, -.04, 1.02, .26, 8.05, 108, 5, WOOD);
  for (let y = 1.3; y <= 9; y += .62) box(ctx, -.12, y, .76, .08, 111, 3, WOOD);
  const a = point(.3, 1.35, 102), b = point(.3, 8.55, 102);
  ctx.beginPath(); ctx.moveTo(a.x, a.y);
  ctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 + 24, b.x, b.y);
  ctx.strokeStyle = '#d1b17c'; ctx.lineWidth = .85; ctx.stroke();
  for (let i = 0; i <= 9; i++) {
    const t = i / 9;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t + 48 * t * (1 - t);
    line(ctx, [{ x, y }, { x, y: y + 4 }], '#9d8a66', .6);
    glow(ctx, x, y + 5, 10, 10, 'rgba(255,216,131,.26)');
    ellipse(ctx, x, y + 5, 1.7, 2.3, '#fff0bb');
  }
  for (const y of [3, 7.3]) hangingPlanter(ctx, y, !omitFoliage);
  for (const y of [2, 5.3, 8.8]) {
    box(ctx, -.02, y, .39, .95, 25, 10, { top: '#d9aa8b', left: '#a96c52', right: '#854c3f', edge: '#f2c19b' });
    if (!omitFoliage) drawBoxFoliage(ctx, y);
  }
  if (!omitFoliage) drawCornerFoliage(ctx);
}
