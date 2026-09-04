import { mkSprite, isoBox, quadFill, shade, hexA, isoVec } from "../arcade-room/iso-draw.js";
import { P_PIAZZA as P } from "./piazza-config.js";

function drawStrikeScreen(ctx, sw) {
  const c = { x: (sw[0].x + sw[2].x) / 2, y: (sw[0].y + sw[2].y) / 2 };
  ctx.fillStyle = P.neonGreen;
  for (let i = 0; i < 5; i++) ctx.fillRect(Math.round(c.x) - 7 + i, Math.round(c.y) + 8 - i * 5, 14 - i * 2, 4);
  ctx.fillStyle = P.paper; ctx.fillRect(Math.round(c.x) - 2, Math.round(c.y) - 15, 4, 3);
}

function drawDragonScreen(ctx, sw) {
  const c = { x: (sw[0].x + sw[2].x) / 2, y: (sw[0].y + sw[2].y) / 2 };
  ctx.fillStyle = P.neonGreen;
  ctx.fillRect(Math.round(c.x) - 7, Math.round(c.y) + 4, 14, 8);
  ctx.fillRect(Math.round(c.x) - 5, Math.round(c.y) - 5, 10, 7);
  ctx.fillRect(Math.round(c.x) - 2, Math.round(c.y) - 9, 4, 4);
  ctx.fillStyle = P.paper; ctx.fillRect(Math.round(c.x) - 5, Math.round(c.y) - 7, 2, 2);
  ctx.fillRect(Math.round(c.x) + 3, Math.round(c.y) - 7, 2, 2);
}

function drawSpaceScreen(ctx, sw) {
  const c = { x: (sw[0].x + sw[2].x) / 2, y: (sw[0].y + sw[2].y) / 2 };
  ctx.fillStyle = P.neonPurple;
  for (const [x, y, size] of [[-8, -7, 3], [7, -4, 2], [-4, 8, 2], [8, 8, 3]]) {
    ctx.fillRect(Math.round(c.x) + x, Math.round(c.y) + y, size, size);
  }
  ctx.fillStyle = P.paper; ctx.fillRect(Math.round(c.x) - 2, Math.round(c.y) - 2, 4, 4);
}

/* Variante locale del cabinato: stesso footprint dello sprite condiviso, ma
   marquee più compatto per mostrare il nome completo del minigioco. */
function mkPiazzaCabinet(accent, screenBg, screenGlow, name, drawScreen) {
  return mkSprite(2, 1, 104, (ctx) => {
    const X0 = 0.5, Y0 = 0.2, W = 1, D = 0.6;
    const front = (u, hh) => {
      const p = isoVec(X0 + u * W, Y0 + D);
      return { x: p.x, y: p.y - hh };
    };
    isoBox(ctx, X0 - 0.06, Y0 - 0.02, W + 0.12, D + 0.06, 8, P.cabinetD, { top: shade(P.cabinet, 0.85), noEdge: true });
    isoBox(ctx, X0, Y0, W, D, 74, P.cabinet, {
      top: P.cabinetL, left: shade(P.cabinet, 0.96), right: shade(P.cabinet, 0.66),
    });
    ctx.strokeStyle = hexA(accent, 0.86); ctx.lineWidth = 2;
    for (const u of [0.04, 0.96]) {
      const a = front(u, 6), b = front(u, 74);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    const bezel = [front(0.12, 66), front(0.88, 66), front(0.88, 32), front(0.12, 32)];
    quadFill(ctx, bezel, P.ink);
    const sw = [front(0.18, 62), front(0.82, 62), front(0.82, 36), front(0.18, 36)];
    quadFill(ctx, sw, screenBg); drawScreen(ctx, sw);
    quadFill(ctx, sw, false, screenGlow, 1);
    ctx.strokeStyle = hexA(P.ink, 0.24); ctx.lineWidth = 1;
    for (let h = 36; h < 62; h += 3) {
      const a = front(0.18, h), b = front(0.82, h);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    quadFill(ctx, bezel, false, hexA(accent, 0.54), 1);
    const deck = isoBox(ctx, X0 + 0.02, Y0 + D - 0.04, W - 0.04, 0.3, 6, shade(P.cabinet, 1.1), { z: 22, top: P.cabinetL });
    const dc = { x: (deck.up(deck.T).x + deck.up(deck.B).x) / 2, y: (deck.up(deck.T).y + deck.up(deck.B).y) / 2 };
    ctx.fillStyle = P.ink; ctx.beginPath(); ctx.ellipse(dc.x - 8, dc.y + 2, 4, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = P.metalL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(dc.x - 8, dc.y + 1); ctx.lineTo(dc.x - 8, dc.y - 5); ctx.stroke();
    ctx.fillStyle = P.red; ctx.beginPath(); ctx.arc(dc.x - 8, dc.y - 6, 2.4, 0, Math.PI * 2); ctx.fill();
    for (const [dx, col] of [[2, accent], [8, P.neonYellow], [13, P.neonPink]]) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(dc.x + dx, dc.y + 1, 2.4, 1.6, 0, 0, Math.PI * 2); ctx.fill();
    }
    const coin = front(0.5, 16);
    ctx.fillStyle = P.metal; ctx.fillRect(Math.round(coin.x - 6), Math.round(coin.y - 6), 12, 9);
    ctx.fillStyle = P.neonYellow; ctx.fillRect(Math.round(coin.x - 3), Math.round(coin.y - 3), 6, 1.5);
    isoBox(ctx, X0 - 0.04, Y0 + 0.04, W + 0.08, D - 0.08, 15, shade(accent, 0.5), {
      z: 74, top: shade(accent, 1.2), left: accent, right: shade(accent, 0.7), noEdge: true,
    });
    const mc = front(0.5, 84);
    ctx.save(); ctx.shadowColor = accent; ctx.shadowBlur = 6; ctx.fillStyle = P.ink;
    ctx.font = "bold 4px 'Press Start 2P', monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(name, mc.x, mc.y + 1); ctx.restore();
  });
}

function mkChairSprite(ctx, tx, ty, backNorth) {
  const w = 0.42, d = 0.42;
  for (const [lx, ly] of [[0.03, 0.03], [w - 0.09, 0.03], [0.03, d - 0.09], [w - 0.09, d - 0.09]]) {
    isoBox(ctx, tx + lx, ty + ly, 0.06, 0.06, 9, P.woodD, { noEdge: true });
  }
  isoBox(ctx, tx, ty, w, d, 3, P.sofa, { z: 9, top: P.sofaL, left: shade(P.sofa, 0.9), right: shade(P.sofa, 0.75) });
  const by = backNorth ? ty : ty + d - 0.08;
  isoBox(ctx, tx, by, w, 0.08, 13, P.sofaD, { z: 12, top: P.sofa, noEdge: true });
  const seam = isoVec(tx + w / 2, by + 0.04);
  ctx.fillStyle = hexA(P.paper, 0.25); ctx.fillRect(Math.round(seam.x - 3), Math.round(seam.y - 20), 6, 1);
}

function topQuad(x0, y0, x1, y1, z) {
  return [isoVec(x0, y0), isoVec(x1, y0), isoVec(x1, y1), isoVec(x0, y1)]
    .map((p) => ({ x: p.x, y: p.y - z }));
}

function drawCard(ctx, tx, ty, col, accent) {
  const pts = topQuad(tx, ty, tx + 0.28, ty + 0.42, 27);
  quadFill(ctx, pts, col, hexA(P.ink, 0.55), 1);
  const p = isoVec(tx + 0.14, ty + 0.21);
  ctx.fillStyle = accent; ctx.fillRect(Math.round(p.x - 2), Math.round(p.y - 28), 4, 2);
}

function drawChip(ctx, tx, ty, col) {
  const p = isoVec(tx, ty);
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(p.x, p.y - 28, 4, 2.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = P.paper; ctx.fillRect(Math.round(p.x - 1), Math.round(p.y - 29), 2, 1);
}

/* Tavolo 2x2: l'inserto, le due zone giocatore, le carte e le sedie rendono
   immediatamente leggibile la funzione di duello senza cambiare il footprint. */
function mkDuelTable(feltColor, feltL, feltD, iconText, accent) {
  return mkSprite(2, 2, 82, (ctx) => {
    mkChairSprite(ctx, 0.8, -0.55, true);
    isoBox(ctx, 0, 0, 2, 2, 24, P.woodD, {
      top: P.wood, left: shade(P.woodD, 0.9), right: shade(P.woodD, 0.7),
    });
    isoBox(ctx, 0.08, 0.08, 1.84, 1.84, 2, feltColor, {
      z: 24, top: feltL, left: feltD, right: feltD, noEdge: true,
    });
    quadFill(ctx, topQuad(0.13, 0.13, 1.87, 1.87, 26), false, hexA(accent, 0.82), 1);
    quadFill(ctx, topQuad(0.18, 0.2, 0.82, 0.78, 27), hexA(P.paper, 0.08), hexA(P.paper, 0.28), 1);
    quadFill(ctx, topQuad(1.18, 1.22, 1.82, 1.8, 27), hexA(P.paper, 0.08), hexA(P.paper, 0.28), 1);
    const dividerA = isoVec(1, 0.26), dividerB = isoVec(1, 1.74);
    ctx.strokeStyle = hexA(P.paper, 0.5); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(dividerA.x, dividerA.y - 27); ctx.lineTo(dividerB.x, dividerB.y - 27); ctx.stroke();
    drawCard(ctx, 0.38, 0.42, P.neonBlue, accent);
    drawCard(ctx, 0.66, 0.72, P.paper, feltD);
    drawCard(ctx, 1.22, 1.28, P.neonPink, accent);
    drawCard(ctx, 1.48, 1.5, P.paperSoft, feltD);
    drawChip(ctx, 0.98, 0.66, P.gold);
    drawChip(ctx, 1.12, 0.78, P.neonBlue);
    drawChip(ctx, 1.04, 1.36, P.neonGreen);
    const mark = isoVec(1, 1);
    ctx.fillStyle = hexA(accent, 0.75); ctx.beginPath(); ctx.moveTo(mark.x, mark.y - 31); ctx.lineTo(mark.x + 7, mark.y - 26);
    ctx.lineTo(mark.x, mark.y - 21); ctx.lineTo(mark.x - 7, mark.y - 26); ctx.closePath(); ctx.fill();
    ctx.fillStyle = P.paper; ctx.font = "bold 8px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(iconText, mark.x, mark.y - 26);
    const badge = isoVec(1, 2);
    ctx.fillStyle = hexA(P.ink, 0.9); ctx.fillRect(Math.round(badge.x - 20), Math.round(badge.y - 17), 40, 9);
    ctx.strokeStyle = accent; ctx.lineWidth = 1; ctx.strokeRect(Math.round(badge.x - 20), Math.round(badge.y - 17), 40, 9);
    ctx.fillStyle = P.paper; ctx.font = "bold 4px 'Press Start 2P', monospace"; ctx.fillText("TCG DUEL", badge.x, badge.y - 13);
    mkChairSprite(ctx, 0.8, 2.15, false);
  });
}

function mkPlant() {
  return mkSprite(1, 1, 58, (ctx) => {
    isoBox(ctx, 0.23, 0.23, 0.54, 0.54, 18, P.pot, { top: P.woodL, left: P.potD, right: shade(P.potD, 0.82) });
    const c = isoVec(0.5, 0.5);
    ctx.fillStyle = P.leafD;
    ctx.fillRect(Math.round(c.x - 12), Math.round(c.y - 39), 8, 12);
    ctx.fillRect(Math.round(c.x + 4), Math.round(c.y - 36), 9, 13);
    ctx.fillRect(Math.round(c.x - 4), Math.round(c.y - 48), 9, 14);
    ctx.fillStyle = P.leaf;
    ctx.fillRect(Math.round(c.x - 8), Math.round(c.y - 45), 10, 12);
    ctx.fillRect(Math.round(c.x + 1), Math.round(c.y - 40), 11, 11);
    ctx.fillRect(Math.round(c.x - 5), Math.round(c.y - 53), 8, 10);
    ctx.fillStyle = P.leafL;
    ctx.fillRect(Math.round(c.x - 3), Math.round(c.y - 50), 4, 5);
    ctx.fillRect(Math.round(c.x + 6), Math.round(c.y - 42), 4, 5);
  });
}

function mkBench() {
  return mkSprite(1, 2, 48, (ctx) => {
    for (const [lx, ly] of [[0.1, 0.18], [0.8, 0.18], [0.1, 1.72], [0.8, 1.72]]) {
      isoBox(ctx, lx, ly, 0.1, 0.1, 8, P.metalD, { noEdge: true });
    }
    isoBox(ctx, 0.05, 0.32, 0.9, 1.34, 6, P.woodD, { z: 8, top: P.woodL, left: P.wood, right: shade(P.woodD, 0.75) });
    isoBox(ctx, 0.08, 0.16, 0.84, 0.12, 15, P.sofaD, { z: 6, top: P.sofa, left: shade(P.sofaD, 0.86), noEdge: true });
    for (const ty of [0.55, 0.96, 1.37]) {
      const a = isoVec(0.1, ty), b = isoVec(0.9, ty);
      ctx.strokeStyle = hexA(P.paper, 0.28); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(a.x, a.y - 15); ctx.lineTo(b.x, b.y - 15); ctx.stroke();
    }
    ctx.fillStyle = P.gold; ctx.fillRect(-2, 16, 4, 2);
  });
}

/* Chiavi e shape restituiti restano quelli consumati da IsoRoomGame. */
export function buildPiazzaFurniture() {
  return {
    cabinet1: mkPiazzaCabinet(P.neonBlue, P.screenA, P.neonGreen, "STACK ATTACK", drawStrikeScreen),
    cabinet2: mkPiazzaCabinet(P.neonGreen, P.screenB, P.neonGreen, "TCG JUMP", drawDragonScreen),
    cabinet3: mkPiazzaCabinet(P.neonPurple, P.screenC, P.neonPurple, "CARD MEMORY", drawSpaceScreen),
    table1: mkDuelTable(P.feltGreen, P.feltGreenL, P.feltGreenD, "A", P.neonGreen),
    table2: mkDuelTable(P.feltBlue, P.feltBlueL, P.feltBlueD, "B", P.neonBlue),
    plant: mkPlant(),
    bench: mkBench(),
  };
}
