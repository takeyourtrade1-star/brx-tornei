/* Contenuto del monitor: disegno opzionale, piccolo e deterministico. Il
 * chiamante decide la scena; non viene avviato alcun timer né precomputata una
 * sequenza di frame, così reduced-motion e qualità bassa restano economiche. */

import { P } from "./room-config.js";
import { quadFill } from "./room-primitives.js";

export function screenPoint(screenQuad, u, v) {
  const topX = screenQuad[0].x + (screenQuad[1].x - screenQuad[0].x) * u;
  const topY = screenQuad[0].y + (screenQuad[1].y - screenQuad[0].y) * u;
  const bottomX = screenQuad[3].x + (screenQuad[2].x - screenQuad[3].x) * u;
  const bottomY = screenQuad[3].y + (screenQuad[2].y - screenQuad[3].y) * u;
  return { x: topX + (bottomX - topX) * v, y: topY + (bottomY - topY) * v };
}

export function screenSubQuad(screenQuad, u1, v1, u2, v2) {
  return [screenPoint(screenQuad, u1, v1), screenPoint(screenQuad, u2, v1), screenPoint(screenQuad, u2, v2), screenPoint(screenQuad, u1, v2)];
}

function drawDashboard(ctx, screenQuad) {
  ctx.globalAlpha = 0.42;
  quadFill(ctx, screenSubQuad(screenQuad, 0.06, 0.08, 0.94, 0.24), P.white);
  ctx.globalAlpha = 0.36;
  quadFill(ctx, screenSubQuad(screenQuad, 0.1, 0.38, 0.58, 0.48), P.white);
  quadFill(ctx, screenSubQuad(screenQuad, 0.1, 0.58, 0.72, 0.68), P.white);
  ctx.globalAlpha = 0.72;
  quadFill(ctx, screenSubQuad(screenQuad, 0.76, 0.56, 0.84, 0.7), P.gold);
}

function drawGraph(ctx, screenQuad) {
  ctx.globalAlpha = 0.6; ctx.strokeStyle = P.paper; ctx.lineWidth = 1;
  const points = [[0.08, 0.78], [0.3, 0.62], [0.5, 0.66], [0.7, 0.4], [0.9, 0.22]];
  ctx.beginPath();
  points.forEach(([u, v], index) => { const p = screenPoint(screenQuad, u, v); if (index) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
  ctx.stroke();
  const last = screenPoint(screenQuad, 0.9, 0.22); ctx.fillStyle = P.white; ctx.fillRect(Math.round(last.x) - 1, Math.round(last.y) - 1, 3, 3);
  ctx.globalAlpha = 0.28; quadFill(ctx, screenSubQuad(screenQuad, 0.06, 0.06, 0.5, 0.16), P.white);
}

function drawCards(ctx, screenQuad) {
  ctx.globalAlpha = 0.8;
  for (const [u, v, color] of [[0.18, 0.34, P.red], [0.44, 0.26, P.gold], [0.68, 0.46, P.screen]]) {
    quadFill(ctx, screenSubQuad(screenQuad, u, v, u + 0.15, v + 0.22), color);
    ctx.globalAlpha = 0.48; quadFill(ctx, screenSubQuad(screenQuad, u + 0.025, v + 0.04, u + 0.125, v + 0.08), P.white); ctx.globalAlpha = 0.8;
  }
}

export function drawMonitorScene(ctx, screenQuad, options = {}) {
  if (!screenQuad || screenQuad.length < 4) return;
  const opts = options || {};
  const scene = Math.max(0, Math.floor(Number(opts.scene) || 0)) % 3;
  const flicker = opts.flicker === true;
  const gradient = ctx.createLinearGradient(0, screenQuad[0].y, 0, screenQuad[2].y);
  gradient.addColorStop(0, P.screenD); gradient.addColorStop(1, P.glow);
  ctx.save();
  quadFill(ctx, screenQuad, gradient);
  if (scene === 0) drawDashboard(ctx, screenQuad);
  else if (scene === 1) drawGraph(ctx, screenQuad);
  else drawCards(ctx, screenQuad);
  if (flicker) { ctx.globalAlpha = 0.16; quadFill(ctx, screenQuad, P.white); }
  ctx.restore();
}

export const drawMonitorScreen = drawMonitorScene;
