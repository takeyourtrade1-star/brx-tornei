import { WW, WH, COLS, ROWS, HTW, HTH, OX, OY, WALL_H, wallL, wallR, quadFill, shade, hexA, mkCanvas, tileTop } from "./iso-draw.js";
import { P_ARCADE as P } from "./arcade-config.js";

export function buildArcadeBackground() {
  const cv = mkCanvas(WW, WH);
  const ctx = cv.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  quadFill(ctx, [wallL(0, WALL_H), wallL(ROWS, WALL_H), wallL(ROWS, 0), wallL(0, 0)], P.wallDark);
  quadFill(ctx, [wallR(0, WALL_H), wallR(COLS, WALL_H), wallR(COLS, 0), wallR(0, 0)], P.wall);
  drawWallTiles(ctx, wallR, 0.5, COLS - 0.5, 12, WALL_H - 6);
  const cg = ctx.createLinearGradient(OX, 0, OX + COLS * HTW, 0);
  cg.addColorStop(0, "rgba(255,42,109,0.10)"); cg.addColorStop(0.5, "rgba(0,0,0,0)");
  ctx.fillStyle = cg;
  quadFill(ctx, [wallR(0, WALL_H), wallR(COLS, WALL_H), wallR(COLS, 0), wallR(0, 0)], cg);
  ctx.strokeStyle = "rgba(5,217,232,0.10)"; ctx.lineWidth = 1;
  for (let c = 2; c < ROWS; c += 2) { const a = wallL(c, 10), b = wallL(c, WALL_H - 6); ctx.beginPath(); ctx.moveTo(a.x + 0.5, a.y); ctx.lineTo(b.x + 0.5, b.y); ctx.stroke(); }
  for (let c = 2; c < COLS; c += 2) { const a = wallR(c, 10), b = wallR(c, WALL_H - 6); ctx.beginPath(); ctx.moveTo(a.x + 0.5, a.y); ctx.lineTo(b.x + 0.5, b.y); ctx.stroke(); }
  quadFill(ctx, [wallL(0, WALL_H + 5), wallL(ROWS, WALL_H + 5), wallL(ROWS, WALL_H), wallL(0, WALL_H)], P.wallTop);
  quadFill(ctx, [wallR(0, WALL_H + 5), wallR(COLS, WALL_H + 5), wallR(COLS, WALL_H), wallR(0, WALL_H)], P.wallTop);
  ctx.fillStyle = shade(P.wallDark, 0.8); ctx.fillRect(OX - 1, OY - WALL_H - 5, 2, WALL_H + 5);
  ctx.strokeStyle = hexA(P.neonPink, 0.55); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(wallL(0, WALL_H + 2).x, wallL(0, WALL_H + 2).y); ctx.lineTo(wallL(ROWS, WALL_H + 2).x, wallL(ROWS, WALL_H + 2).y); ctx.stroke();
  ctx.strokeStyle = hexA(P.neonBlue, 0.45);
  ctx.beginPath(); ctx.moveTo(wallR(0, WALL_H + 2).x, wallR(0, WALL_H + 2).y); ctx.lineTo(wallR(COLS, WALL_H + 2).x, wallR(COLS, WALL_H + 2).y); ctx.stroke();
  for (let cx = 0; cx < COLS; cx++) for (let cy = 0; cy < ROWS; cy++) {
    const tp = tileTop(cx, cy); const even = (cx + cy) % 2 === 0;
    quadFill(ctx, [tp, { x: tp.x + HTW, y: tp.y + HTH }, { x: tp.x, y: tp.y + 2 * HTH }, { x: tp.x - HTW, y: tp.y + HTH }], even ? P.floorA : P.floorB);
    ctx.strokeStyle = even ? hexA(P.neonPink, 0.08) : hexA(P.neonBlue, 0.06); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tp.x + HTW, tp.y + HTH); ctx.lineTo(tp.x, tp.y + 2 * HTH); ctx.lineTo(tp.x - HTW, tp.y + HTH); ctx.stroke();
  }
  ctx.strokeStyle = hexA(P.neonPink, 0.28); ctx.lineWidth = 1.5;
  for (let cx = 0; cx <= COLS; cx++) { const a = tileTop(cx, 0), b = tileTop(cx, ROWS); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
  ctx.strokeStyle = hexA(P.neonBlue, 0.22);
  for (let cy = 0; cy <= ROWS; cy++) { const a = tileTop(0, cy), b = tileTop(COLS, cy); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
  drawFloorGlow(ctx);
  drawNeonSign(ctx, wallR(4.5, 92), "ARCADE", P.neonPink);
  drawPoster(ctx, wallR(1.2, 78), P.neonBlue, "🍄", 24, 30);
  drawPoster(ctx, wallR(10.5, 78), P.neonGreen, "🃏", 22, 28);
  drawPoster(ctx, wallL(2.5, 78), P.neonPurple, "🧠", 24, 30);
  drawPoster(ctx, wallR(7.5, 74), P.neonYellow, "👾", 18, 22);
  drawPoster(ctx, wallL(8.5, 70), P.neonPink, "🎰", 20, 26);
  drawCable(ctx, [wallL(1.2, 90), wallL(2.8, 82), wallL(4.0, 86)], P.neonBlue);
  drawCable(ctx, [wallR(9.0, 88), wallR(10.2, 80), wallR(11.4, 86)], P.neonPink);
  const dTopL = wallL(4.2, 88), dTopR = wallL(5.8, 88);
  const dBotL = wallL(4.2, 30), dBotR = wallL(5.8, 30);
  drawDoorOnWall(ctx, dTopL, dTopR, dBotR, dBotL, P.neonBlue, "TORNEI");
  const bL = tileTop(0, ROWS), bB = tileTop(COLS, ROWS), bR = tileTop(COLS, 0);
  quadFill(ctx, [bL, bB, { x: bB.x, y: bB.y + 10 }, { x: bL.x, y: bL.y + 10 }], P.floorSide);
  quadFill(ctx, [bB, bR, { x: bR.x, y: bR.y + 10 }, { x: bB.x, y: bB.y + 10 }], shade(P.floorSide, 0.8));
  return cv;
}

function drawWallTiles(ctx, wp, startC, endC, hTop, hBot) {
  const cols = Math.round((endC - startC) / 0.7);
  for (let i = 0; i < cols; i++) {
    const c0 = startC + i * 0.7; const c1 = Math.min(c0 + 0.65, endC); const even = i % 2 === 0;
    const col = even ? hexA(P.neonBlue, 0.06) : hexA(P.neonPink, 0.05);
    quadFill(ctx, [wp(c0, hBot - 2), wp(c1, hBot - 2), wp(c1, hTop), wp(c0, hTop)], col);
    ctx.strokeStyle = hexA("#ffffff", 0.04); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(wp(c1, hBot - 2).x, wp(c1, hBot - 2).y); ctx.lineTo(wp(c1, hTop).x, wp(c1, hTop).y); ctx.stroke();
  }
}
function drawFloorGlow(ctx) {
  const center = tileTop(COLS / 2, ROWS / 2);
  const rg = ctx.createRadialGradient(center.x, center.y + HTH, 10, center.x, center.y + HTH, 220);
  rg.addColorStop(0, hexA(P.neonPink, 0.10)); rg.addColorStop(0.5, hexA(P.neonBlue, 0.05)); rg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(center.x, center.y + HTH, 240, 80, 0, 0, Math.PI * 2); ctx.fill();
}
function drawNeonSign(ctx, pos, text, color) {
  ctx.save();
  ctx.font = "bold 22px 'Press Start 2P', 'Courier New', monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const m = ctx.measureText(text); const pad = 12;
  ctx.fillStyle = shade(P.cabinet, 0.6); ctx.fillRect(pos.x - m.width / 2 - pad, pos.y - 18 - pad * 0.6, m.width + pad * 2, 36 + pad * 1.2);
  ctx.strokeStyle = shade(P.cabinet, 1.2); ctx.lineWidth = 2; ctx.strokeRect(pos.x - m.width / 2 - pad, pos.y - 18 - pad * 0.6, m.width + pad * 2, 36 + pad * 1.2);
  ctx.shadowColor = color; ctx.shadowBlur = 20; ctx.fillStyle = hexA(color, 0.35); ctx.fillText(text, pos.x, pos.y);
  ctx.shadowBlur = 10; ctx.fillStyle = "#fff"; ctx.fillText(text, pos.x, pos.y);
  ctx.restore();
}
function drawPoster(ctx, pos, color, icon, w = 20, h = 24) {
  ctx.save();
  ctx.fillStyle = shade(P.wall, 1.3); ctx.fillRect(Math.round(pos.x - w / 2), Math.round(pos.y - h / 2), w, h);
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.strokeRect(Math.round(pos.x - w / 2), Math.round(pos.y - h / 2), w, h);
  ctx.font = Math.round(h * 0.58) + "px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(icon, pos.x, pos.y);
  ctx.fillStyle = color; ctx.fillRect(Math.round(pos.x - w / 2 + 3), Math.round(pos.y - h / 2 + 3), 2, 2); ctx.fillRect(Math.round(pos.x + w / 2 - 5), Math.round(pos.y - h / 2 + 3), 2, 2);
  ctx.restore();
}

/* Porta di ritorno sulla parete sinistra: stipite illuminato, anta con due
   pannelli incassati, maniglia e targhetta. Legge chiaramente come una porta. */
function drawDoorOnWall(ctx, topA, topB, botB, botA, color, label) {
  const face = (u, v) => {
    const b = { x: botA.x + (botB.x - botA.x) * u, y: botA.y + (botB.y - botA.y) * u };
    const t = { x: topA.x + (topB.x - topA.x) * u, y: topA.y + (topB.y - topA.y) * u };
    return { x: b.x + (t.x - b.x) * v, y: b.y + (t.y - b.y) * v };
  };
  /* stipite */
  quadFill(ctx, [topA, topB, botB, botA], shade(P.cabinet, 0.75));
  quadFill(ctx, [topA, topB, botB, botA], false, color, 2);
  /* anta */
  const leaf = [face(0.12, 0.97), face(0.88, 0.97), face(0.88, 0.05), face(0.12, 0.05)];
  quadFill(ctx, leaf, P.cabinet);
  quadFill(ctx, leaf, false, hexA(color, 0.6), 1);
  /* pannelli incassati */
  const panel = (v0, v1) => {
    const o = [face(0.22, v1), face(0.78, v1), face(0.78, v0), face(0.22, v0)];
    quadFill(ctx, o, shade(P.cabinet, 0.6));
    quadFill(ctx, o, false, shade(P.cabinet, 1.35), 1);
    const inn = [face(0.3, v1 - 0.02), face(0.7, v1 - 0.02), face(0.7, v0 + 0.02), face(0.3, v0 + 0.02)];
    quadFill(ctx, inn, shade(P.cabinet, 0.95));
  };
  panel(0.1, 0.46); panel(0.54, 0.9);
  /* maniglia */
  const h = face(0.78, 0.5);
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(h.x, h.y, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.fillRect(Math.round(h.x) - 1, Math.round(h.y) - 2, 1.5, 1.5);
  /* filo di luce sotto la porta */
  const s0 = face(0.14, 0.04), s1 = face(0.86, 0.04);
  ctx.strokeStyle = hexA(color, 0.7); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(s1.x, s1.y); ctx.stroke();
  /* targhetta */
  ctx.save();
  ctx.font = "6px 'Press Start 2P', monospace"; ctx.textAlign = "center"; ctx.fillStyle = color;
  ctx.fillText(label, (botA.x + botB.x) / 2, botA.y + 11);
  ctx.restore();
}

function drawCable(ctx, pts, color) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.strokeStyle = hexA(color, 0.35); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) { const cp = { x: (pts[i - 1].x + pts[i].x) / 2, y: pts[i - 1].y + 6 }; ctx.quadraticCurveTo(cp.x, cp.y, pts[i].x, pts[i].y); }
  ctx.stroke(); ctx.restore();
}
