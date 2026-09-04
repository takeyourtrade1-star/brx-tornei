/* Primitive Canvas 2D della Sala Tornei. Nessuna animazione viene costruita
 * qui: il risultato è un fondale statico, economico da riutilizzare. */

import {
  COLS, ROWS, HTW, HTH, WW, WH, OX, OY, WALL_H, P, TOUR_DOOR, SOCIAL_DOOR,
} from "./room-config.js";
import {
  mkCanvas, mkSprite, tileTop, isoVec, isoBox, quadFill, shade, hexA, wallL, wallR,
} from "../arcade-room/iso-draw.js";

export { mkCanvas, mkSprite, tileTop, isoVec, isoBox, quadFill, shade, hexA, wallL, wallR };

export function drawBackdrop(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, WH);
  g.addColorStop(0, P.bg1);
  g.addColorStop(1, P.bg0);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WW, WH);
}

export function drawWalls(ctx) {
  const left = [wallL(0, WALL_H), wallL(ROWS, WALL_H), wallL(ROWS, 0), wallL(0, 0)];
  const right = [wallR(0, WALL_H), wallR(COLS, WALL_H), wallR(COLS, 0), wallR(0, 0)];
  quadFill(ctx, left, P.wallDark);
  quadFill(ctx, right, P.wall);

  /* Gradiente morbido verso l'angolo: evita due piani piatti e il banding. */
  const cg = ctx.createLinearGradient(OX - 190, 0, OX + COLS * HTW, 0);
  cg.addColorStop(0, "rgba(35,36,58,0.22)");
  cg.addColorStop(0.48, "rgba(35,36,58,0.03)");
  cg.addColorStop(1, "rgba(255,244,205,0.06)");
  quadFill(ctx, right, cg);

  /* Pannelli verticali e sottili fasce orizzontali, come tavole dipinte. */
  ctx.strokeStyle = "rgba(40,40,60,0.13)";
  ctx.lineWidth = 1;
  for (let c = 2; c < ROWS; c += 2) {
    const a = wallL(c, 10), b = wallL(c, WALL_H - 6);
    ctx.beginPath(); ctx.moveTo(a.x + 0.5, a.y); ctx.lineTo(b.x + 0.5, b.y); ctx.stroke();
  }
  for (let c = 2; c < COLS; c += 2) {
    const a = wallR(c, 10), b = wallR(c, WALL_H - 6);
    ctx.beginPath(); ctx.moveTo(a.x + 0.5, a.y); ctx.lineTo(b.x + 0.5, b.y); ctx.stroke();
  }
  for (const hh of [34, 62, 90]) {
    ctx.strokeStyle = "rgba(255,255,255,0.055)";
    const la = wallL(0, hh), lb = wallL(ROWS, hh);
    const ra = wallR(0, hh), rb = wallR(COLS, hh);
    ctx.beginPath(); ctx.moveTo(la.x, la.y); ctx.lineTo(lb.x, lb.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ra.x, ra.y); ctx.lineTo(rb.x, rb.y); ctx.stroke();
  }

  quadFill(ctx, [wallL(0, WALL_H + 5), wallL(ROWS, WALL_H + 5), wallL(ROWS, WALL_H), wallL(0, WALL_H)], P.wallTop);
  quadFill(ctx, [wallR(0, WALL_H + 5), wallR(COLS, WALL_H + 5), wallR(COLS, WALL_H), wallR(0, WALL_H)], P.wallTop);
  ctx.fillStyle = shade(P.wallDark, 0.8);
  ctx.fillRect(OX - 1, OY - WALL_H - 5, 2, WALL_H + 5);
}

export function drawBaseboards(ctx) {
  quadFill(ctx, [wallL(0, 10), wallL(ROWS, 10), wallL(ROWS, 0), wallL(0, 0)], P.baseDark);
  quadFill(ctx, [wallR(0, 10), wallR(COLS, 10), wallR(COLS, 0), wallR(0, 0)], P.base);
  quadFill(ctx, [wallL(0, 10), wallL(ROWS, 10), wallL(ROWS, 8), wallL(0, 8)], shade(P.baseDark, 1.25));
  quadFill(ctx, [wallR(0, 10), wallR(COLS, 10), wallR(COLS, 8), wallR(0, 8)], shade(P.base, 1.25));
}

export function drawFloor(ctx) {
  for (let cy = 0; cy < ROWS; cy += 1) {
    for (let cx = 0; cx < COLS; cx += 1) {
      const t = tileTop(cx, cy);
      const pts = [t, { x: t.x + HTW, y: t.y + HTH }, { x: t.x, y: t.y + HTH * 2 }, { x: t.x - HTW, y: t.y + HTH }];
      quadFill(ctx, pts, (cx + cy) % 2 ? P.floorB : P.floorA);
      ctx.strokeStyle = "rgba(120,105,80,0.30)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(t.x + HTW, t.y + HTH); ctx.lineTo(t.x, t.y + HTH * 2); ctx.lineTo(t.x - HTW, t.y + HTH);
      ctx.stroke();
    }
  }
  const bL = tileTop(0, ROWS), bB = tileTop(COLS, ROWS), bR = tileTop(COLS, 0);
  quadFill(ctx, [bL, bB, { x: bB.x, y: bB.y + 10 }, { x: bL.x, y: bL.y + 10 }], P.floorSide);
  quadFill(ctx, [bB, bR, { x: bR.x, y: bR.y + 10 }, { x: bB.x, y: bB.y + 10 }], shade(P.floorSide, 0.8));
  for (const [pa, pb, dx] of [[wallL(0, 0), wallL(ROWS, 0), 1], [wallR(0, 0), wallR(COLS, 0), -1]]) {
    quadFill(ctx, [pa, pb, { x: pb.x + 12 * dx, y: pb.y + 6 }, { x: pa.x + 12 * dx, y: pa.y + 6 }], "rgba(45,40,65,0.14)");
  }
}

export function drawRug(ctx) {
  const rugPts = (i) => [
    tileTop(2.6 + i, 4.6 + i), tileTop(6.4 - i, 4.6 + i),
    tileTop(6.4 - i, 7.4 - i), tileTop(2.6 + i, 7.4 - i),
  ];
  quadFill(ctx, rugPts(0).map((p) => ({ x: p.x, y: p.y + 3 })), "rgba(45,40,65,0.18)");
  quadFill(ctx, rugPts(0), P.rug);
  quadFill(ctx, rugPts(0.22), false, P.rugL, 2);
  quadFill(ctx, rugPts(0.42), false, P.rugD, 2);
  const rc = tileTop(4.5, 6);
  quadFill(ctx, [{ x: rc.x, y: rc.y - 10 }, { x: rc.x + 20, y: rc.y }, { x: rc.x, y: rc.y + 10 }, { x: rc.x - 20, y: rc.y }], P.rugL);
  quadFill(ctx, [{ x: rc.x, y: rc.y - 5 }, { x: rc.x + 10, y: rc.y }, { x: rc.x, y: rc.y + 5 }, { x: rc.x - 10, y: rc.y }], P.rugD);
}

export function drawWindowBeam(ctx, phase) {
  const beam = Number.isFinite(phase.beam) ? phase.beam : 0.2;
  const a = wallL(5.9, 0), b = wallL(7.5, 0);
  const len = { x: 4.6 * HTW, y: 4.6 * HTH };
  const pts = [a, b, { x: b.x + len.x, y: b.y + len.y }, { x: a.x + len.x, y: a.y + len.y }];
  const g = ctx.createLinearGradient((a.x + b.x) / 2, (a.y + b.y) / 2, (a.x + b.x) / 2 + len.x, (a.y + b.y) / 2 + len.y);
  g.addColorStop(0, `rgba(255,246,210,${beam.toFixed(3)})`);
  g.addColorStop(1, "rgba(255,246,210,0)");
  quadFill(ctx, pts, g);
  quadFill(ctx, [wallL(5.9, 24), wallL(7.5, 24), wallL(7.5, 10), wallL(5.9, 10)], `rgba(255,246,210,${(beam / 2).toFixed(3)})`);
}

export function wallFace(topA, topB, botB, botA, u, v) {
  const b = { x: botA.x + (botB.x - botA.x) * u, y: botA.y + (botB.y - botA.y) * u };
  const t = { x: topA.x + (topB.x - topA.x) * u, y: topA.y + (topB.y - topA.y) * u };
  return { x: b.x + (t.x - b.x) * v, y: b.y + (t.y - b.y) * v };
}

export function drawWoodDoor(ctx, topA, topB, botB, botA, label = null) {
  const face = (u, v) => wallFace(topA, topB, botB, botA, u, v);
  const rot = Math.atan2(HTH, HTW);
  quadFill(ctx, [topA, topB, botB, botA], shade(P.woodD, 0.95));
  quadFill(ctx, [face(0.03, 0.99), face(0.97, 0.99), face(0.97, 0.02), face(0.03, 0.02)], shade(P.woodD, 1.18));
  quadFill(ctx, [topA, topB, botB, botA], false, P.woodXD, 2);
  const leaf = [face(0.1, 0.95), face(0.9, 0.95), face(0.9, 0.05), face(0.1, 0.05)];
  const topMid = face(0.5, 0.95), botMid = face(0.5, 0.05);
  const g = ctx.createLinearGradient(topMid.x, topMid.y, botMid.x, botMid.y);
  g.addColorStop(0, shade(P.wood, 1.08)); g.addColorStop(1, shade(P.wood, 0.82));
  quadFill(ctx, leaf, g); quadFill(ctx, leaf, false, P.woodD, 1);
  for (const [v0, v1] of [[0.1, 0.45], [0.52, 0.87]]) {
    const panel = [face(0.2, v1), face(0.8, v1), face(0.8, v0), face(0.2, v0)];
    quadFill(ctx, panel, shade(P.wood, 0.7));
    quadFill(ctx, panel, false, shade(P.woodL, 0.95), 1);
    quadFill(ctx, [face(0.27, v1 - 0.02), face(0.73, v1 - 0.02), face(0.73, v0 + 0.02), face(0.27, v0 + 0.02)], shade(P.wood, 0.92));
  }
  ctx.strokeStyle = shade(P.woodD, 0.85); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(topMid.x, topMid.y); ctx.lineTo(botMid.x, botMid.y); ctx.stroke();
  const handle = face(0.62, 0.5);
  ctx.fillStyle = P.metalD; ctx.fillRect(Math.round(handle.x) - 1, Math.round(handle.y) - 5, 3, 10);
  ctx.fillStyle = P.gold; ctx.beginPath(); ctx.arc(handle.x, handle.y, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillRect(Math.round(handle.x) - 1, Math.round(handle.y) - 1, 1, 1);
  if (label) {
    const mid = face(0.44, 0.72);
    ctx.save(); ctx.translate(mid.x, mid.y); ctx.rotate(rot);
    ctx.font = "5px 'Press Start 2P', monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = P.woodXD; ctx.fillText(label, 0, 0); ctx.restore();
  }
}

export function doorBounds(door) {
  const topA = wallR(door.c0, door.hTop), topB = wallR(door.c1, door.hTop);
  const botA = wallR(door.c0, door.hBot), botB = wallR(door.c1, door.hBot);
  const xs = [topA.x, topB.x, botA.x, botB.x];
  const ys = [topA.y, topB.y, botA.y, botB.y];
  return {
    topA, topB, botA, botB,
    hit: { x: Math.min(...xs) - 2, y: Math.min(...ys) - 2, w: Math.max(...xs) - Math.min(...xs) + 4, h: Math.max(...ys) - Math.min(...ys) + 4 },
  };
}

function drawDoorSign(ctx, door, label, color) {
  const pos = wallR((door.c0 + door.c1) / 2, door.hTop + 8);
  ctx.save(); ctx.translate(pos.x, pos.y); ctx.rotate(Math.atan2(HTH, HTW));
  ctx.fillStyle = P.night; ctx.fillRect(-25, -6, 50, 11);
  ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.strokeRect(-25, -6, 50, 11);
  ctx.fillStyle = P.paper; ctx.font = "bold 5px 'Press Start 2P', monospace";
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(label, 0, -0.5); ctx.restore();
}

export function drawRoomDoors(ctx) {
  const tour = doorBounds(TOUR_DOOR);
  const social = doorBounds(SOCIAL_DOOR);
  drawWoodDoor(ctx, tour.topA, tour.topB, tour.botB, tour.botA);
  drawDoorSign(ctx, TOUR_DOOR, "ARCADE", P.screenD);
  drawWoodDoor(ctx, social.topA, social.topB, social.botB, social.botA, "PIAZZA");
  drawDoorSign(ctx, SOCIAL_DOOR, "PIAZZA", P.gold);
}
