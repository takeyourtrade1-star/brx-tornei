/** Primitive vettoriali del diorama: unità mondo, senza arrotondamento ai pixel. */
export const point = (x, y, z = 0) => ({ x: 336 + (x - y) * 32, y: 150 + (x + y) * 16 - z });

export function polygon(ctx, points, fill, stroke, width = 1) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

export function line(ctx, points, color, width = 1) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

export function plane(ctx, x, y, w, d, z, fill, stroke) {
  polygon(ctx, [point(x, y, z), point(x + w, y, z), point(x + w, y + d, z), point(x, y + d, z)], fill, stroke);
}

export function box(ctx, x, y, w, d, z, height, colors) {
  const top = z + height;
  polygon(ctx, [point(x, y + d, z), point(x + w, y + d, z), point(x + w, y + d, top), point(x, y + d, top)], colors.left);
  polygon(ctx, [point(x + w, y + d, z), point(x + w, y, z), point(x + w, y, top), point(x + w, y + d, top)], colors.right);
  plane(ctx, x, y, w, d, top, colors.top);
  if (colors.edge) line(ctx, [point(x, y + d, top), point(x + w, y + d, top), point(x + w, y, top)], colors.edge, .6);
}

export function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(.01, rx), Math.max(.01, ry), 0, 0, Math.PI * 2);
  ctx.fillStyle = fill; ctx.fill();
}

export function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = .7; ctx.stroke(); }
}

export function gradient(ctx, x0, y0, x1, y1, stops) {
  const result = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [offset, color] of stops) result.addColorStop(offset, color);
  return result;
}

export function glow(ctx, x, y, rx, ry, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(rx, ry);
  const fill = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  fill.addColorStop(0, color); fill.addColorStop(1, 'rgba(0,0,0,0)');
  ellipse(ctx, 0, 0, 1, 1, fill);
  ctx.restore();
}
