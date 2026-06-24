import { WW, WH, COLS, ROWS, HTW, HTH, OX, OY, WALL_H, wallL, wallR, quadFill, shade, hexA, mkCanvas, tileTop } from "./iso-draw.js";
import { P_ARCADE as P } from "./arcade-config.js";

/* Geometria della porta di ritorno (parete sinistra). Definita una volta sola e
   condivisa fra il disegno e l'hit-test (così il click è sempre allineato). */
export const ARCADE_DOOR = { c0: 3.9, c1: 5.8, hTop: 94, hBot: 2 };
export function arcadeDoorBounds() {
  const { c0, c1, hTop, hBot } = ARCADE_DOOR;
  const topL = wallL(c0, hTop), topR = wallL(c1, hTop);
  const botL = wallL(c0, hBot), botR = wallL(c1, hBot);
  const xs = [topL.x, topR.x, botL.x, botR.x], ys = [topL.y, topR.y, botL.y, botR.y];
  return {
    topL, topR, botL, botR,
    hit: { x: Math.min(...xs) - 2, y: Math.min(...ys) - 2, w: Math.max(...xs) - Math.min(...xs) + 4, h: Math.max(...ys) - Math.min(...ys) + 4 },
  };
}

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
  drawPoster(ctx, wallR(1.2, 78), P.neonGreen, "jump", 26, 32);
  drawPoster(ctx, wallR(10.5, 78), P.neonBlue, "cards", 24, 30);
  drawPoster(ctx, wallL(2.5, 78), P.neonPurple, "memory", 26, 32);
  drawPoster(ctx, wallR(7.5, 74), P.neonYellow, "alien", 20, 24);
  drawPoster(ctx, wallL(8.5, 70), P.neonPink, "dice", 22, 28);
  drawCable(ctx, [wallL(1.2, 90), wallL(2.8, 82), wallL(4.0, 86)], P.neonBlue);
  drawCable(ctx, [wallR(9.0, 88), wallR(10.2, 80), wallR(11.4, 86)], P.neonPink);
  const D = arcadeDoorBounds();
  drawDoorOnWall(ctx, D.topL, D.topR, D.botR, D.botL, P.neonBlue, "TORNEI");
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
/* Mini-poster pixel-art a tema (niente emoji): pannello scuro, cornice neon,
   motivo disegnato e una banda titolo in basso. */
function drawPoster(ctx, pos, color, kind, w = 20, h = 24) {
  ctx.save();
  const x = Math.round(pos.x - w / 2), y = Math.round(pos.y - h / 2);
  // pannello + sfondo sfumato
  const bg = ctx.createLinearGradient(0, y, 0, y + h);
  bg.addColorStop(0, shade(P.wall, 1.55)); bg.addColorStop(1, shade(P.wall, 0.85));
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
  // cornice neon + viti
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.strokeStyle = hexA(color, 0.25); ctx.lineWidth = 1; ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
  ctx.fillStyle = hexA(color, 0.8);
  for (const [vx, vy] of [[x + 3, y + 3], [x + w - 3, y + 3], [x + 3, y + h - 3], [x + w - 3, y + h - 3]]) ctx.fillRect(vx - 0.5, vy - 0.5, 1.5, 1.5);
  // area motivo
  const cx = x + w / 2, cy = y + h / 2 - 2, px = (a, b, c, d, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(a), Math.round(b), c, d); };
  if (kind === "jump") {
    // collinetta + eroe a punta che salta + moneta
    px(x + 3, y + h - 8, w - 6, 4, hexA(color, 0.5));
    px(cx - 3, cy - 1, 6, 7, "#ff7a4d"); px(cx - 3, cy - 3, 6, 2, "#b5263f");
    ctx.fillStyle = "#b5263f"; ctx.beginPath(); ctx.moveTo(cx - 4, cy - 3); ctx.lineTo(cx + 4, cy - 3); ctx.lineTo(cx + 1, cy - 9); ctx.closePath(); ctx.fill();
    px(cx + 6, cy - 4, 3, 3, P.neonYellow);
  } else if (kind === "cards") {
    // tris di carte a ventaglio
    const card = (dx, rot, col) => { ctx.save(); ctx.translate(cx + dx, cy + 2); ctx.rotate(rot); ctx.fillStyle = col; ctx.fillRect(-4, -7, 8, 12); ctx.strokeStyle = "rgba(0,0,0,.5)"; ctx.lineWidth = 1; ctx.strokeRect(-4, -7, 8, 12); ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillRect(-2, -5, 4, 2); ctx.restore(); };
    card(-5, -0.4, "#4a7fd6"); card(5, 0.4, "#d94f46"); card(0, 0, hexA(color, 0.95));
  } else if (kind === "memory") {
    // griglia 3x3 di tessere con due "accese"
    const on = [0, 4, 5, 7];
    for (let i = 0; i < 9; i++) { const gx = cx - 8 + (i % 3) * 6, gy = cy - 8 + Math.floor(i / 3) * 6; px(gx, gy, 5, 5, on.includes(i) ? color : "rgba(255,255,255,.18)"); }
  } else if (kind === "alien") {
    // invader pixel
    const A = color, rows = ["00100100", "01111110", "11011011", "11111111", "00100100", "01000010"];
    for (let r = 0; r < rows.length; r++) for (let cc = 0; cc < 8; cc++) if (rows[r][cc] === "1") px(cx - 8 + cc * 2, cy - 6 + r * 2, 2, 2, A);
  } else if (kind === "dice") {
    // dado con pip
    px(cx - 7, cy - 7, 14, 14, hexA(color, 0.22)); ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.strokeRect(Math.round(cx - 7) + 0.5, Math.round(cy - 7) + 0.5, 14, 14);
    for (const [dx, dy] of [[-4, -4], [4, -4], [0, 0], [-4, 4], [4, 4]]) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx + dx, cy + dy, 1.4, 0, Math.PI * 2); ctx.fill(); }
  }
  // banda titolo neon in basso
  ctx.fillStyle = hexA(color, 0.85); ctx.fillRect(x + 2, y + h - 5, w - 4, 3);
  ctx.restore();
}

/* Porta di ritorno verso la Sala Tornei: stessa anta in legno chiusa della porta
   d'ingresso (architrave, due pannelli, maniglia), più un'insegna neon "TORNEI"
   sopra — coerente con l'insegna ARCADE. Le due porte sono "uniformate". */
function drawDoorOnWall(ctx, topA, topB, botB, botA, color, label) {
  const face = (u, v) => {
    const b = { x: botA.x + (botB.x - botA.x) * u, y: botA.y + (botB.y - botA.y) * u };
    const t = { x: topA.x + (topB.x - topA.x) * u, y: topA.y + (topB.y - topA.y) * u };
    return { x: b.x + (t.x - b.x) * v, y: b.y + (t.y - b.y) * v };
  };
  /* architrave / stipite in legno */
  quadFill(ctx, [topA, topB, botB, botA], shade(P.woodD, 0.95));
  quadFill(ctx, [face(0.03, 0.99), face(0.97, 0.99), face(0.97, 0.02), face(0.03, 0.02)], shade(P.woodD, 1.18));
  quadFill(ctx, [topA, topB, botB, botA], false, "#161009", 2);
  /* anta in legno piena (chiusa) */
  const leaf = [face(0.1, 0.95), face(0.9, 0.95), face(0.9, 0.05), face(0.1, 0.05)];
  const lt = face(0.5, 0.95), lb = face(0.5, 0.05);
  const lg = ctx.createLinearGradient(lt.x, lt.y, lb.x, lb.y);
  lg.addColorStop(0, shade(P.wood, 1.08)); lg.addColorStop(1, shade(P.wood, 0.82));
  quadFill(ctx, leaf, lg);
  quadFill(ctx, leaf, false, P.woodD, 1);
  const panel = (v0, v1) => {
    const o = [face(0.2, v1), face(0.8, v1), face(0.8, v0), face(0.2, v0)];
    quadFill(ctx, o, shade(P.wood, 0.7));
    quadFill(ctx, o, false, shade(P.woodL, 0.95), 1);
    quadFill(ctx, [face(0.27, v1 - 0.02), face(0.73, v1 - 0.02), face(0.73, v0 + 0.02), face(0.27, v0 + 0.02)], shade(P.wood, 0.92));
  };
  panel(0.1, 0.45); panel(0.52, 0.87);
  /* linea di mezzeria */
  const m0 = face(0.5, 0.95), m1 = face(0.5, 0.05);
  ctx.strokeStyle = shade(P.woodD, 0.85); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(m0.x, m0.y); ctx.lineTo(m1.x, m1.y); ctx.stroke();
  /* maniglia (piastra + pomello dorato) */
  const h = face(0.62, 0.5);
  ctx.fillStyle = P.metalD; ctx.fillRect(Math.round(h.x) - 1, Math.round(h.y) - 5, 3, 10);
  ctx.fillStyle = P.gold; ctx.beginPath(); ctx.arc(h.x, h.y, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillRect(Math.round(h.x) - 1, Math.round(h.y) - 1, 1, 1);
  /* insegna neon "TORNEI" sopra la porta (coerente con l'insegna ARCADE) */
  ctx.save();
  const sgx = (topA.x + topB.x) / 2, sgy = (topA.y + topB.y) / 2 - 10;
  ctx.fillStyle = "#15101f"; ctx.fillRect(Math.round(sgx) - 27, Math.round(sgy) - 6, 54, 11);
  ctx.strokeStyle = hexA(color, 0.9); ctx.lineWidth = 1.2; ctx.strokeRect(Math.round(sgx) - 27, Math.round(sgy) - 6, 54, 11);
  ctx.shadowColor = color; ctx.shadowBlur = 6;
  ctx.fillStyle = "#dff3ff"; ctx.font = "bold 5px 'Press Start 2P', monospace";
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(label, sgx, sgy - 0.5);
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
