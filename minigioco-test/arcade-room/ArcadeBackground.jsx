/* ============================================================================
   ArcadeBackground — buildArcadeBackground(): canvas WW×WH con pavimento neon,
   pareti scure, insegna "ARCADE" luminosa e poster. Atmosfera arcade notturna.
   Pattern di buildBackground di IsoRoomGame (stessa shape di output).
   ========================================================================== */

import {
  WW, WH, COLS, ROWS, HTW, HTH, OX, OY, WALL_H,
  wallL, wallR, quadFill, shade, hexA, mkCanvas, tileTop,
} from "./iso-draw.js";
import { P_ARCADE as P } from "./arcade-config.js";

export function buildArcadeBackground() {
  const cv = mkCanvas(WW, WH);
  const ctx = cv.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  /* — pareti — */
  quadFill(ctx, [wallL(0, WALL_H), wallL(ROWS, WALL_H), wallL(ROWS, 0), wallL(0, 0)], P.wallDark);
  quadFill(ctx, [wallR(0, WALL_H), wallR(COLS, WALL_H), wallR(COLS, 0), wallR(0, 0)], P.wall);

  /* gradienti verso l'angolo */
  const cg = ctx.createLinearGradient(OX, 0, OX + COLS * HTW, 0);
  cg.addColorStop(0, "rgba(255,42,109,0.10)"); cg.addColorStop(0.5, "rgba(0,0,0,0)");
  ctx.fillStyle = cg;
  quadFill(ctx, [wallR(0, WALL_H), wallR(COLS, WALL_H), wallR(COLS, 0), wallR(0, 0)], cg);

  /* giunzioni verticali dei pannelli (neon faint) */
  ctx.strokeStyle = "rgba(5,217,232,0.10)"; ctx.lineWidth = 1;
  for (let c = 2; c < ROWS; c += 2) {
    const a = wallL(c, 10), b = wallL(c, WALL_H - 6);
    ctx.beginPath(); ctx.moveTo(a.x + 0.5, a.y); ctx.lineTo(b.x + 0.5, b.y); ctx.stroke();
  }
  for (let c = 2; c < COLS; c += 2) {
    const a = wallR(c, 10), b = wallR(c, WALL_H - 6);
    ctx.beginPath(); ctx.moveTo(a.x + 0.5, a.y); ctx.lineTo(b.x + 0.5, b.y); ctx.stroke();
  }

  /* bordo superiore pareti */
  quadFill(ctx, [wallL(0, WALL_H + 5), wallL(ROWS, WALL_H + 5), wallL(ROWS, WALL_H), wallL(0, WALL_H)], P.wallTop);
  quadFill(ctx, [wallR(0, WALL_H + 5), wallR(COLS, WALL_H + 5), wallR(COLS, WALL_H), wallR(0, WALL_H)], P.wallTop);
  ctx.fillStyle = shade(P.wallDark, 0.8);
  ctx.fillRect(OX - 1, OY - WALL_H - 5, 2, WALL_H + 5);

  /* — pavimento neon (griglia isometrica con linee neon) — */
  for (let cx = 0; cx < COLS; cx++) {
    for (let cy = 0; cy < ROWS; cy++) {
      const tp = tileTop(cx, cy);
      const fill = (cx + cy) % 2 === 0 ? P.floorA : P.floorB;
      quadFill(ctx, [
        tp, { x: tp.x + HTW, y: tp.y + HTH },
        { x: tp.x, y: tp.y + 2 * HTH }, { x: tp.x - HTW, y: tp.y + HTH },
      ], fill);
    }
  }
  /* linee neon sul pavimento (rosa e ciano) */
  ctx.strokeStyle = hexA(P.neonPink, 0.22); ctx.lineWidth = 1;
  for (let cx = 0; cx <= COLS; cx++) {
    const a = tileTop(cx, 0), b = tileTop(cx, ROWS);
    ctx.beginPath(); ctx.moveTo(a.x, a.y + 2 * HTH * ROWS / ROWS); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  ctx.strokeStyle = hexA(P.neonBlue, 0.18);
  for (let cy = 0; cy <= ROWS; cy++) {
    const a = tileTop(0, cy), b = tileTop(COLS, cy);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }

  /* — insegna "ARCADE" sulla parete di fondo (neon rosa pulsante statico) — */
  drawNeonSign(ctx, wallR(4.5, 92), "ARCADE", P.neonPink);

  /* — poster sui muri (easter egg, decorazione) — */
  drawPoster(ctx, wallR(1.2, 78), P.neonBlue, "🍄");
  drawPoster(ctx, wallR(10.5, 78), P.neonGreen, "🃏");
  drawPoster(ctx, wallL(2.5, 78), P.neonPurple, "🧠");

  /* — porta di ritorno sulla parete sinistra (cx=0, cy=4-5) — */
  drawDoorOnWall(ctx, wallL(4.5, 86), wallL(4.5, 40), P.neonBlue, "TORNEI");

  return cv;
}

function drawNeonSign(ctx, pos, text, color) {
  ctx.save();
  ctx.font = "bold 22px 'Press Start 2P', 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  /* alone esterno */
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.fillStyle = hexA(color, 0.35);
  ctx.fillText(text, pos.x, pos.y);
  /* nucleo bianco */
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#fff";
  ctx.fillText(text, pos.x, pos.y);
  ctx.restore();
}

function drawPoster(ctx, pos, color, icon) {
  ctx.save();
  ctx.fillStyle = shade(P.wall, 1.3);
  ctx.fillRect(Math.round(pos.x - 10), Math.round(pos.y - 12), 20, 24);
  ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  ctx.strokeRect(Math.round(pos.x - 10), Math.round(pos.y - 12), 20, 24);
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(icon, pos.x, pos.y);
  ctx.restore();
}

function drawDoorOnWall(ctx, top, bottom, color, label) {
  ctx.save();
  ctx.fillStyle = shade(P.wallDark, 0.7);
  ctx.fillRect(Math.round(top.x - 10), Math.round(top.y), 20, Math.round(bottom.y - top.y));
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.strokeRect(Math.round(top.x - 10), Math.round(top.y), 20, Math.round(bottom.y - top.y));
  /* maniglia */
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(top.x + 4), Math.round((top.y + bottom.y) / 2 - 2), 3, 4);
  /* etichetta */
  ctx.font = "6px 'Press Start 2P', monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.fillText(label, top.x, bottom.y + 8);
  ctx.restore();
}
