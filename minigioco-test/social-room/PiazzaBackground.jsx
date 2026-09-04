import {
  WW, WH, COLS, ROWS, HTW, HTH, OX, OY, WALL_H,
  wallL, wallR, quadFill, shade, hexA, mkCanvas, tileTop,
} from "../arcade-room/iso-draw.js";
import { P_PIAZZA as P } from "./piazza-config.js";

/* Vano sulla parete destra: la geometria è condivisa dal disegno e dall'hit-test. */
export const PIAZZA_DOOR = { c0: 8.8, c1: 10.4, hTop: 92, hBot: 2 };

export function piazzaDoorBounds() {
  const { c0, c1, hTop, hBot } = PIAZZA_DOOR;
  const topL = wallR(c0, hTop);
  const topR = wallR(c1, hTop);
  const botL = wallR(c0, hBot);
  const botR = wallR(c1, hBot);
  const xs = [topL.x, topR.x, botL.x, botR.x];
  const ys = [topL.y, topR.y, botL.y, botR.y];
  return {
    topL, topR, botL, botR,
    hit: {
      x: Math.min(...xs) - 4,
      y: Math.min(...ys) - 4,
      w: Math.max(...xs) - Math.min(...xs) + 8,
      h: Math.max(...ys) - Math.min(...ys) + 8,
    },
  };
}

export function buildPiazzaBackground(phase = {}) {
  const currentPhase = phase || {};
  const cv = mkCanvas(WW, WH);
  const ctx = cv.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = P.bg0;
  ctx.fillRect(0, 0, WW, WH);

  drawWalls(ctx);
  drawFloor(ctx);
  /* L'ambiente tinge soltanto le superfici; finestre, lampade e insegne restano leggibili. */
  if (currentPhase.amb) { ctx.fillStyle = currentPhase.amb; ctx.fillRect(0, 0, WW, WH); }

  const skyTop = currentPhase.skyTop || P.skyTop;
  const skyBot = currentPhase.skyBot || P.skyBot;
  drawWindow(ctx, 2.2, 4.8, skyTop, skyBot, currentPhase);
  drawWindow(ctx, 5.8, 8.4, skyTop, skyBot, currentPhase);
  drawWallDecor(ctx);
  drawSunbeams(ctx, Number.isFinite(currentPhase.beam) ? currentPhase.beam : 0.14);
  drawDoor(ctx);
  drawNeonSign(ctx);
  return cv;
}

function drawWalls(ctx) {
  const left = ctx.createLinearGradient(OX - ROWS * HTW, 0, OX, 0);
  left.addColorStop(0, shade(P.wallDark, 0.86)); left.addColorStop(1, P.wallDark);
  const right = ctx.createLinearGradient(OX, 0, OX + COLS * HTW, 0);
  right.addColorStop(0, P.wall); right.addColorStop(1, shade(P.wall, 0.82));
  quadFill(ctx, [wallL(0, WALL_H), wallL(ROWS, WALL_H), wallL(ROWS, 0), wallL(0, 0)], left);
  quadFill(ctx, [wallR(0, WALL_H), wallR(COLS, WALL_H), wallR(COLS, 0), wallR(0, 0)], right);
  drawWallPanels(ctx, wallL, ROWS);
  drawWallPanels(ctx, wallR, COLS);
  quadFill(ctx, [wallL(0, WALL_H + 5), wallL(ROWS, WALL_H + 5), wallL(ROWS, WALL_H), wallL(0, WALL_H)], P.wallTop);
  quadFill(ctx, [wallR(0, WALL_H + 5), wallR(COLS, WALL_H + 5), wallR(COLS, WALL_H), wallR(0, WALL_H)], P.wallTop);
  ctx.fillStyle = shade(P.wallDark, 0.75);
  ctx.fillRect(OX - 1, OY - WALL_H - 5, 2, WALL_H + 5);
  ctx.strokeStyle = hexA(P.wallTrim, 0.28); ctx.lineWidth = 1.5;
  for (const wp of [wallL, wallR]) {
    const a = wp(0, WALL_H + 2), b = wp(wp === wallL ? ROWS : COLS, WALL_H + 2);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
}

function drawWallPanels(ctx, wp, endC) {
  ctx.strokeStyle = hexA(P.wallTrim, 0.13); ctx.lineWidth = 1;
  for (let c = 1; c < endC; c++) {
    const a = wp(c, 9), b = wp(c, WALL_H - 7);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  for (let c = 0.35, i = 0; c < endC - 0.15; c += 1.2, i++) {
    const c1 = Math.min(c + 1.05, endC - 0.08);
    quadFill(ctx, [wp(c, 16), wp(c1, 16), wp(c1, WALL_H - 9), wp(c, WALL_H - 9)],
      hexA(i % 2 ? P.wallPanelDark : P.wallPanel, 0.08));
  }
}

function drawFloor(ctx) {
  for (let cx = 0; cx < COLS; cx++) for (let cy = 0; cy < ROWS; cy++) {
    const tp = tileTop(cx, cy);
    const isPath = (cx >= 8 && cy <= 4) || (cy === 3 && cx >= 4 && cx <= 10);
    const isLounge = cx >= 4 && cx <= 6 && cy >= 4 && cy <= 7;
    const even = (cx + cy) % 2 === 0;
    const col = isPath
      ? (even ? P.floorPathA : P.floorPathB)
      : isLounge ? (even ? P.carpet : P.carpetL) : (even ? P.floorA : P.floorB);
    const diamond = [tp, { x: tp.x + HTW, y: tp.y + HTH },
      { x: tp.x, y: tp.y + 2 * HTH }, { x: tp.x - HTW, y: tp.y + HTH }];
    quadFill(ctx, diamond, col);
    ctx.strokeStyle = isPath ? hexA(P.gold, 0.18) : isLounge ? hexA(P.carpetD, 0.42) : P.floorLine;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tp.x + HTW, tp.y + HTH); ctx.lineTo(tp.x, tp.y + 2 * HTH);
    ctx.lineTo(tp.x - HTW, tp.y + HTH); ctx.stroke();
  }
  /* Un intarsio sul corridoio centrale: superficie decorativa, non un ostacolo. */
  const m = tileTop(5, 4.25); const mx = m.x; const my = m.y + HTH;
  ctx.strokeStyle = hexA(P.gold, 0.48); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(mx, my - 15); ctx.lineTo(mx + 24, my); ctx.lineTo(mx, my + 15);
  ctx.lineTo(mx - 24, my); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = hexA(P.feltGreen, 0.72);
  ctx.beginPath(); ctx.moveTo(mx, my - 6); ctx.lineTo(mx + 10, my); ctx.lineTo(mx, my + 6); ctx.lineTo(mx - 10, my); ctx.closePath(); ctx.fill();
  ctx.fillStyle = P.paper; ctx.fillRect(Math.round(mx - 2), Math.round(my - 2), 4, 4);

  const bL = tileTop(0, ROWS), bB = tileTop(COLS, ROWS), bR = tileTop(COLS, 0);
  quadFill(ctx, [bL, bB, { x: bB.x, y: bB.y + 12 }, { x: bL.x, y: bL.y + 12 }], P.floorSide);
  quadFill(ctx, [bB, bR, { x: bR.x, y: bR.y + 12 }, { x: bB.x, y: bB.y + 12 }], shade(P.floorSide, 0.8));
}

function drawWindow(ctx, c0, c1, skyTop, skyBot, phase) {
  const frame = [wallL(c0, 92), wallL(c1, 92), wallL(c1, 28), wallL(c0, 28)];
  quadFill(ctx, frame, P.woodD, P.woodXD, 2);
  const glass = [wallL(c0 + 0.12, 88), wallL(c1 - 0.12, 88), wallL(c1 - 0.12, 32), wallL(c0 + 0.12, 32)];
  const sg = ctx.createLinearGradient(0, glass[0].y, 0, glass[2].y);
  sg.addColorStop(0, skyTop); sg.addColorStop(1, skyBot); quadFill(ctx, glass, sg);
  ctx.save();
  ctx.beginPath(); glass.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.clip();
  const mid = (c0 + c1) / 2; const horizon = wallL(mid, 46);
  ctx.fillStyle = hexA(P.wallDark, 0.38); ctx.fillRect(0, horizon.y, WW, WH - horizon.y);
  for (let i = 0; i < 7; i++) {
    const x = Math.round(wallL(c0 + 0.15 + i * 0.42, 46).x);
    const h = 6 + (i % 3) * 4;
    ctx.fillStyle = i % 2 ? hexA(P.leafD, 0.64) : hexA(P.stoneD, 0.55);
    ctx.fillRect(x, Math.round(horizon.y - h), 8 + (i % 2) * 4, h);
  }
  if (phase.celestial === "moon") {
    const moon = wallL(c0 + 0.68, 70);
    ctx.fillStyle = P.paper; ctx.fillRect(Math.round(moon.x), Math.round(moon.y), 8, 8);
    ctx.fillStyle = skyTop; ctx.fillRect(Math.round(moon.x + 5), Math.round(moon.y - 1), 5, 6);
    if (phase.stars) {
      ctx.fillStyle = hexA(P.paper, 0.88);
      for (const [sc, sh] of [[c0 + 0.2, 78], [c0 + 0.72, 58], [c1 - 0.28, 70], [c1 - 0.12, 48]]) {
        const star = wallL(sc, sh); ctx.fillRect(Math.round(star.x), Math.round(star.y), 2, 2);
      }
    }
  } else {
    const sun = wallL(c0 + 0.78, 70);
    ctx.fillStyle = phase.celestial === "sun" ? P.sun : P.lantern; ctx.fillRect(Math.round(sun.x), Math.round(sun.y), 9, 9);
    const cloud = wallL(c0 + 1.35, 58);
    ctx.fillStyle = hexA(P.paper, 0.82); ctx.fillRect(Math.round(cloud.x), Math.round(cloud.y), 24, 6);
    ctx.fillRect(Math.round(cloud.x + 5), Math.round(cloud.y - 4), 14, 5);
  }
  ctx.restore();
  const midC = (c0 + c1) / 2;
  quadFill(ctx, [wallL(midC - 0.08, 88), wallL(midC + 0.08, 88), wallL(midC + 0.08, 32), wallL(midC - 0.08, 32)], P.wood);
  quadFill(ctx, [wallL(c0 + 0.1, 60), wallL(c1 - 0.1, 60), wallL(c1 - 0.1, 56), wallL(c0 + 0.1, 56)], P.wood);
  quadFill(ctx, [wallL(c0 - 0.08, 28), wallL(c1 + 0.08, 28), wallL(c1 + 0.08, 23), wallL(c0 - 0.08, 23)], P.woodL);
}

function drawWallDecor(ctx) {
  drawWallLantern(ctx, wallL, 1.15, 57);
  drawWallLantern(ctx, wallL, 9.2, 57);
  drawWallLantern(ctx, wallR, 1.15, 56);
  drawWallLantern(ctx, wallR, 7.55, 54);
  drawBunting(ctx, wallL, 8.7, 88, 9.75, 82);
  drawBunting(ctx, wallR, 1.8, 90, 3.35, 82);
}

function drawWallLantern(ctx, wp, c, h) {
  const p = wp(c, h);
  const glow = ctx.createRadialGradient(p.x, p.y + 5, 2, p.x, p.y + 5, 24);
  glow.addColorStop(0, hexA(P.lanternGlow, 0.24)); glow.addColorStop(1, hexA(P.lanternGlow, 0));
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(p.x, p.y + 5, 24, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = P.metalD; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x, p.y - 7); ctx.lineTo(p.x, p.y + 1); ctx.stroke();
  ctx.fillStyle = P.lanternD; ctx.fillRect(Math.round(p.x - 6), Math.round(p.y), 12, 11);
  ctx.fillStyle = P.lantern; ctx.fillRect(Math.round(p.x - 3), Math.round(p.y + 2), 6, 6);
  ctx.fillStyle = P.paper; ctx.fillRect(Math.round(p.x - 1), Math.round(p.y + 3), 2, 3);
}

function drawBunting(ctx, wp, c0, h0, c1, h1) {
  const a = wp(c0, h0), b = wp(c1, h1);
  ctx.strokeStyle = hexA(P.gold, 0.45); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  for (let i = 1; i < 5; i++) {
    const u = i / 5; const x = a.x + (b.x - a.x) * u; const y = a.y + (b.y - a.y) * u;
    ctx.fillStyle = i % 2 ? P.neonBlue : P.lanternD;
    ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 7); ctx.closePath(); ctx.fill();
  }
}

function drawSunbeams(ctx, amount) {
  const p1 = wallL(2.2, 30), p2 = wallL(8.4, 30), p3 = tileTop(6.5, 8.5), p4 = tileTop(1.5, 8.5);
  const beam = ctx.createLinearGradient(p1.x, p1.y, p3.x, p3.y);
  beam.addColorStop(0, hexA(P.lanternGlow, Math.min(0.2, amount)));
  beam.addColorStop(0.52, hexA(P.lanternGlow, Math.min(0.09, amount * 0.5)));
  beam.addColorStop(1, hexA(P.lanternGlow, 0)); quadFill(ctx, [p1, p2, p3, p4], beam);
}

function drawDoor(ctx) {
  const d = piazzaDoorBounds();
  const face = (u, v) => {
    const bot = { x: d.botL.x + (d.botR.x - d.botL.x) * u, y: d.botL.y + (d.botR.y - d.botL.y) * u };
    const top = { x: d.topL.x + (d.topR.x - d.topL.x) * u, y: d.topL.y + (d.topR.y - d.topL.y) * u };
    return { x: bot.x + (top.x - bot.x) * v, y: bot.y + (top.y - bot.y) * v };
  };
  quadFill(ctx, [d.topL, d.topR, d.botR, d.botL], P.woodD, P.woodXD, 2);
  const leaf = [face(0.07, 0.95), face(0.93, 0.95), face(0.93, 0.05), face(0.07, 0.05)];
  const doorG = ctx.createLinearGradient(d.topL.x, d.topL.y, d.botL.x, d.botL.y);
  doorG.addColorStop(0, P.woodL); doorG.addColorStop(1, shade(P.wood, 0.78));
  quadFill(ctx, leaf, doorG, P.woodD, 1);
  for (const [v0, v1] of [[0.1, 0.44], [0.54, 0.88]]) {
    const panel = [face(0.19, v1), face(0.81, v1), face(0.81, v0), face(0.19, v0)];
    quadFill(ctx, panel, shade(P.wood, 0.72), P.woodL, 1);
  }
  const knob = face(0.64, 0.5);
  ctx.fillStyle = P.metalD; ctx.fillRect(Math.round(knob.x - 1), Math.round(knob.y - 5), 3, 10);
  ctx.fillStyle = P.gold; ctx.beginPath(); ctx.arc(knob.x, knob.y, 2.5, 0, Math.PI * 2); ctx.fill();
  const plaque = face(0.5, 0.67);
  ctx.save(); ctx.translate(plaque.x, plaque.y); ctx.rotate(Math.atan2(HTH, HTW));
  ctx.fillStyle = hexA(P.ink, 0.94); ctx.fillRect(-23, -6, 46, 12);
  ctx.strokeStyle = P.gold; ctx.lineWidth = 1; ctx.strokeRect(-23, -6, 46, 12);
  ctx.fillStyle = P.paper; ctx.font = "bold 5px 'Press Start 2P', monospace";
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("TORNEI", 0, 0); ctx.restore();
}

function drawNeonSign(ctx) {
  const pos = wallR(4.5, 96);
  ctx.save(); ctx.translate(pos.x, pos.y); ctx.rotate(Math.atan2(HTH, HTW));
  ctx.fillStyle = hexA(P.ink, 0.92); ctx.fillRect(-64, -14, 128, 28);
  ctx.strokeStyle = P.neonBlue; ctx.lineWidth = 1.5; ctx.strokeRect(-64, -14, 128, 28);
  ctx.shadowColor = P.neonBlue; ctx.shadowBlur = 8; ctx.fillStyle = P.paper;
  ctx.font = "bold 8px 'Press Start 2P', monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("PIAZZA", 0, -3); ctx.shadowBlur = 0; ctx.font = "bold 4px 'Press Start 2P', monospace";
  ctx.fillStyle = P.gold; ctx.fillText("SOCIAL CLUB", 0, 7); ctx.restore();
}
