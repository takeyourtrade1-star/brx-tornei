import { ellipse, line } from "./primitives.js";
import { M, at, oval, path, poly } from "./furniture-helpers.js";
import {
  clipQuad, fillQuad, fract, motionAllowed, motionFrame, quadPoint, quadStrip,
  roomId, safeTime, screenLine, screenQuadX, screenQuadY,
} from "./motion-helpers.js";

const CABINET_SCREEN_BASES = ["#123D46", "#204A3D", "#3B2E4B"];

function cabinetIndex(key) {
  const match = String(key).match(/([123])$/);
  return match ? Number(match[1]) - 1 : 0;
}

function keySeed(key) {
  return Array.from(String(key)).reduce((sum, char) => sum + char.charCodeAt(0), 0) * 0.017;
}

function drawMonitorMotion(ctx, f, time, active, fx) {
  const quad = screenQuadY(f, 0.759, 1.22, 2.66, 37.2, 57.8);
  const intensity = active === false ? 0.62 : 1;
  const pulse = 0.5 + 0.5 * Math.sin(time * 1.35);
  const sweep = 0.08 + 0.76 * fract(time * 0.065);
  ctx.save();
  clipQuad(ctx, quad);
  fillQuad(ctx, quad, M.screen);
  fillQuad(ctx, quadStrip(quad, 0.05, 0.95, 0.78, 0.95), "rgba(90,216,213,0.16)");
  fillQuad(ctx, quadStrip(quad, 0.08, 0.28 + pulse * 0.18, 0.81, 0.86), "rgba(255,247,232,0.13)");
  for (const [v, color, width] of [[0.62, "rgba(90,216,213,0.58)", 0.56], [0.45, "rgba(215,138,106,0.52)", 0.48], [0.28, "rgba(240,202,115,0.50)", 0.44]]) {
    screenLine(ctx, quad, 0.18, v, 0.88, v, color, width);
    screenLine(ctx, quad, 0.18, v - 0.035, 0.56, v - 0.035, "rgba(255,247,232,0.24)", 0.36);
  }
  const marker = quadPoint(quad, 0.10, 0.62);
  ellipse(ctx, marker.x, marker.y, 1.35, 1.0, `rgba(255,240,187,${(0.34 + pulse * 0.25) * intensity})`);
  if (fx.reflections !== false) {
    ctx.globalAlpha = (0.11 + pulse * 0.05) * intensity;
    fillQuad(ctx, quadStrip(quad, sweep, Math.min(0.98, sweep + 0.11), 0.04, 0.96), M.ivoryLight);
    ctx.globalAlpha = 1;
  }
  const title = quadPoint(quad, 0.72, 0.865);
  ctx.save();
  ctx.translate(title.x, title.y);
  ctx.rotate(Math.atan2(quad[1].y - quad[0].y, quad[1].x - quad[0].x));
  ctx.fillStyle = "rgba(255,247,232,0.72)";
  ctx.font = "700 4px ui-sans-serif, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("TORNEI", 0, 0);
  ctx.restore();
  ctx.restore();
}

function drawCardGlint(ctx, f, card, time, phase, intensity = 1) {
  const u = 0.10 + 0.72 * fract(time * 0.19 + phase);
  const left = Math.max(0.04, u - 0.12);
  const right = Math.min(0.96, u + 0.02);
  ctx.globalAlpha = (0.18 + 0.10 * (0.5 + 0.5 * Math.sin(time * 2 + phase))) * intensity;
  const bottomLeft = Math.max(0.04, left - 0.16);
  const bottomRight = Math.min(0.96, right - 0.16);
  poly(ctx, f, [
    [card.x + card.w * left, card.y + card.d * 0.12, card.z],
    [card.x + card.w * right, card.y + card.d * 0.12, card.z],
    [card.x + card.w * bottomRight, card.y + card.d * 0.88, card.z],
    [card.x + card.w * bottomLeft, card.y + card.d * 0.88, card.z],
  ], M.ivoryLight);
  ctx.globalAlpha = 1;
}

function drawDieGlint(ctx, f, die, time, phase, intensity = 1) {
  const pulse = 0.5 + 0.5 * Math.sin(time * 2.1 + phase);
  ctx.globalAlpha = (0.14 + pulse * 0.12) * intensity;
  oval(ctx, f, die.x + 0.11, die.y + 0.11, 2.0, 1.05, die.z + 5.35, M.ivoryLight);
  path(ctx, f, [[die.x + 0.05, die.y + 0.16, die.z + 5.4], [die.x + 0.17, die.y + 0.05, die.z + 5.4]], M.white, 0.5);
  ctx.globalAlpha = 1;
}

function drawTournamentTableMotion(ctx, f, time, active, fx) {
  if (fx.holo === false) return null;
  const intensity = active === false ? 0.64 : 1;
  const cards = [
    { x: 0.56, y: 0.58, w: 0.27, d: 0.37, z: 23.68, phase: 0.1 },
    { x: 0.70, y: 0.71, w: 0.27, d: 0.37, z: 23.82, phase: 0.8 },
    { x: 1.74, y: 2.00, w: 0.27, d: 0.37, z: 23.78, phase: 1.5 },
    { x: 1.88, y: 2.13, w: 0.27, d: 0.37, z: 23.92, phase: 2.1 },
    { x: 1.25, y: 1.05, w: 0.25, d: 0.35, z: 23.84, phase: 2.8 },
    { x: 1.51, y: 1.36, w: 0.25, d: 0.35, z: 23.94, phase: 3.5 },
  ];
  for (const card of cards) drawCardGlint(ctx, f, card, time, card.phase, intensity);
  drawDieGlint(ctx, f, { x: 0.86, y: 1.72, z: 23.0 }, time, 0.4, intensity);
  drawDieGlint(ctx, f, { x: 2.13, y: 1.70, z: 23.0 }, time, 1.3, intensity);
}

function drawDuelTableMotion(ctx, f, time, active, fx) {
  if (fx.holo === false) return null;
  const intensity = active === false ? 0.60 : 1;
  const cards = [
    { x: 0.40, y: 0.44, w: 0.26, d: 0.40, z: 20.85, phase: 0.2 },
    { x: 0.66, y: 0.72, w: 0.26, d: 0.40, z: 21.05, phase: 1.0 },
    { x: 1.22, y: 1.16, w: 0.26, d: 0.40, z: 20.95, phase: 1.8 },
    { x: 1.44, y: 1.42, w: 0.26, d: 0.40, z: 21.15, phase: 2.6 },
  ];
  for (const card of cards) drawCardGlint(ctx, f, card, time, card.phase, intensity);
  drawDieGlint(ctx, f, { x: 0.99, y: 0.53, z: 20.4 }, time, 0.5, intensity);
  drawDieGlint(ctx, f, { x: 1.07, y: 1.35, z: 20.4 }, time, 1.4, intensity);
}

function ellipseArc(ctx, center, rx, ry, start, sweep, color, width) {
  const points = [];
  for (let i = 0; i <= 7; i += 1) {
    const angle = start + sweep * i / 7;
    points.push({ x: center.x + Math.cos(angle) * rx, y: center.y + Math.sin(angle) * ry });
  }
  line(ctx, points, color, width);
}

function drawTurntableMotion(ctx, f, time) {
  const center = at(f, 0.5, 0.5, 11);
  const pulse = 0.5 + 0.5 * Math.sin(time * 1.65 + 0.4);
  ellipseArc(ctx, center, 14, 5.7, time * 1.15, 1.18, "rgba(255,247,232,0.52)", 0.8);
  ellipseArc(ctx, center, 9, 3.4, time * 1.15 + Math.PI, 0.72, "rgba(90,216,213,0.36)", 0.55);
  ctx.globalAlpha = 0.34 + pulse * 0.28;
  oval(ctx, f, 0.53, 0.45, 2.5, 1.25, 23, M.amberLight);
  ctx.globalAlpha = 1;
}

function drawStackScreen(ctx, quad, time, seed) {
  for (let i = 0; i < 3; i += 1) {
    fillQuad(ctx, quadStrip(quad, 0.39 + i * 0.025, 0.61 - i * 0.025, 0.17 + i * 0.11, 0.25 + i * 0.11), i % 2 ? "rgba(240,202,115,0.82)" : "rgba(90,216,213,0.82)");
    screenLine(ctx, quad, 0.39 + i * 0.025, 0.24 + i * 0.11, 0.61 - i * 0.025, 0.24 + i * 0.11, "rgba(255,247,232,0.64)", 0.45);
  }
  const falling = 0.28 + 0.50 * fract(time * 0.36 + seed);
  const x = 0.18 + 0.58 * (0.5 + 0.5 * Math.sin(time * 0.9 + seed));
  fillQuad(ctx, quadStrip(quad, x, Math.min(0.88, x + 0.18), falling, Math.min(0.96, falling + 0.11)), "rgba(215,138,106,0.90)");
}

function drawJumpScreen(ctx, quad, time, seed) {
  const jump = Math.abs(Math.sin(time * 2.25 + seed));
  fillQuad(ctx, quadStrip(quad, 0.18, 0.82, 0.16, 0.21), "rgba(90,216,213,0.58)");
  const playerV = 0.24 + jump * 0.34;
  fillQuad(ctx, quadStrip(quad, 0.42, 0.57, playerV, Math.min(0.78, playerV + 0.17)), "rgba(126,221,111,0.92)");
  fillQuad(ctx, quadStrip(quad, 0.67, 0.84, 0.22, 0.35), "rgba(215,138,106,0.86)");
  const coin = quadPoint(quad, 0.72, 0.66 + jump * 0.12);
  ellipse(ctx, coin.x, coin.y, 2.0, 1.35, "rgba(240,202,115,0.90)");
}

function drawMemoryScreen(ctx, quad, time, seed) {
  const reveal = 0.5 + 0.5 * Math.sin(time * 1.1 + seed);
  const cells = [0, 1, 2, 3, 4, 5];
  for (const index of cells) {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const open = index === 1 || index === 4 ? reveal : 0.15;
    const x0 = 0.18 + col * 0.22;
    const v0 = 0.26 + row * 0.25;
    fillQuad(ctx, quadStrip(quad, x0, x0 + 0.17, v0, v0 + 0.19), open > 0.58 ? "rgba(240,202,115,0.82)" : "rgba(105,82,115,0.78)");
    if (open > 0.58) screenLine(ctx, quad, x0 + 0.05, v0 + 0.09, x0 + 0.12, v0 + 0.09, "rgba(255,247,232,0.74)", 0.7);
  }
}

function drawCabinetMotion(ctx, f, key, time, fx) {
  const index = cabinetIndex(key);
  const quad = screenQuadX(f, 0.55, 1.45, 0.16, 35, 58);
  const seed = keySeed(key);
  ctx.save();
  clipQuad(ctx, quad);
  fillQuad(ctx, quad, CABINET_SCREEN_BASES[index]);
  if (index === 0) drawStackScreen(ctx, quad, time, seed);
  if (index === 1) drawJumpScreen(ctx, quad, time, seed);
  if (index === 2) drawMemoryScreen(ctx, quad, time, seed);
  if (fx.reflections !== false) {
    const sweep = 0.08 + 0.78 * fract(time * 0.08 + seed);
    ctx.globalAlpha = 0.07 + 0.025 * Math.sin(time * 1.2 + seed);
    fillQuad(ctx, quadStrip(quad, sweep, Math.min(0.98, sweep + 0.09), 0.04, 0.96), M.ivoryLight);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function isCabinet(key) {
  const normalized = String(key).toLowerCase();
  return normalized.startsWith("cabinet") || normalized.startsWith("arcadecabinet")
    || normalized.startsWith("piazzacabinet") || normalized.startsWith("allroomcabinet");
}

export function drawFurnitureMotion(ctx, room, entity, time = 0, options = {}) {
  const { reducedMotion = false, fx, active } = options || {};
  if (!ctx || !motionAllowed(reducedMotion, fx)) return null;
  const frame = motionFrame(entity);
  if (!frame) return null;
  const key = String(entity.key || "");
  const id = roomId(room);
  const safe = safeTime(time);
  if (key === "desk" || key === "tournamentdesk") return drawMonitorMotion(ctx, frame, safe, active, fx);
  if (key === "turn") return active === false ? null : drawTurntableMotion(ctx, frame, safe);
  if (key === "table") return drawTournamentTableMotion(ctx, frame, safe, active, fx);
  if (key === "table1" || key === "table2" || key === "kakeTable") return drawDuelTableMotion(ctx, frame, safe, active, fx);
  if (isCabinet(key) && (id.includes("arcade") || id.includes("piazza"))) return drawCabinetMotion(ctx, frame, key, safe, fx);
  return null;
}
