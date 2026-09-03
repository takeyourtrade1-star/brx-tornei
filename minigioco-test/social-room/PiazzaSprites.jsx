import { mkSprite, isoBox, quadFill, shade, hexA, isoVec } from "../arcade-room/iso-draw.js";
import { mkCabinet } from "../arcade-room/arcade-cabinets";
import { P_PIAZZA as P } from "./piazza-config.js";

function drawStrikeScreen(ctx, sw) {
  const c = { x: (sw[0].x + sw[2].x) / 2, y: (sw[0].y + sw[2].y) / 2 };
  ctx.fillStyle = "#00ff9d";
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(Math.round(c.x) - 7 + i, Math.round(c.y) + 8 - i * 5, 14 - i * 2, 4);
  }
}

function drawDragonScreen(ctx, sw) {
  const c = { x: (sw[0].x + sw[2].x) / 2, y: (sw[0].y + sw[2].y) / 2 };
  ctx.fillStyle = "#39ff14";
  ctx.fillRect(Math.round(c.x) - 6, Math.round(c.y) + 4, 12, 8);
  ctx.fillRect(Math.round(c.x) - 4, Math.round(c.y) - 4, 8, 6);
  ctx.fillStyle = "#fff";
  ctx.fillRect(Math.round(c.x) - 1, Math.round(c.y) - 7, 2, 2);
}

function drawSpaceScreen(ctx, sw) {
  const c = { x: (sw[0].x + sw[2].x) / 2, y: (sw[0].y + sw[2].y) / 2 };
  ctx.fillStyle = "#b026ff";
  for (let x = -8; x <= 8; x += 8) {
    for (let y = -8; y <= 8; y += 8) {
      ctx.fillRect(Math.round(c.x) + x - 2, Math.round(c.y) + y - 2, 4, 4);
    }
  }
}

function mkChairSprite(ctx, tx, ty, backNorth) {
  const w = 0.42, d = 0.42;
  for (const [lx, ly] of [[0.03, 0.03], [w - 0.09, 0.03], [0.03, d - 0.09], [w - 0.09, d - 0.09]]) {
    isoBox(ctx, tx + lx, ty + ly, 0.06, 0.06, 9, P.woodD, { noEdge: true });
  }
  isoBox(ctx, tx, ty, w, d, 3, P.sofa, { z: 9, top: P.sofaL, left: shade(P.sofa, 0.9), right: shade(P.sofa, 0.75) });
  const by = backNorth ? ty : ty + d - 0.08;
  isoBox(ctx, tx, by, w, 0.08, 13, P.sofaD, { z: 12, top: P.sofa, noEdge: true });
}

function mkDuelTable(feltColor, feltL, feltD, iconText) {
  return mkSprite(2, 2, 74, (ctx) => {
    // Sedia dietro (nord)
    mkChairSprite(ctx, 0.8, -0.55, true);

    // Tavolo in legno massello
    isoBox(ctx, 0, 0, 2, 2, 24, P.woodD, {
      top: P.wood, left: shade(P.woodD, 0.9), right: shade(P.woodD, 0.7),
    });

    // Panno in feltro TCG da duello incassato
    isoBox(ctx, 0.08, 0.08, 1.84, 1.84, 2, feltColor, {
      z: 24, top: feltL, left: feltD, right: feltD, noEdge: true,
    });

    // Playmat centrale e carte
    const tc = isoVec(1, 1);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(iconText, tc.x, tc.y - 23);

    const drawCard = (tx, ty, col) => {
      const z = 26;
      const p = isoVec(tx, ty);
      const pts = [
        { x: p.x, y: p.y - z },
        { x: p.x + 7, y: p.y - 3.5 - z },
        { x: p.x + 7, y: p.y + 3.5 - z },
        { x: p.x, y: p.y + 7 - z },
      ];
      quadFill(ctx, pts, col, "rgba(0,0,0,0.35)", 1);
    };
    drawCard(0.45, 0.7, "#457b9d");
    drawCard(1.4, 1.3, "#e63946");
    drawCard(0.9, 1.4, "#f1faee");

    // Segnalini chip / dadi
    const chip = (tx, ty, col) => {
      const p = isoVec(tx, ty);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - 26, 3.5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    chip(1.4, 0.6, P.gold);
    chip(1.5, 0.7, P.neonBlue);

    // Sedia davanti (sud)
    mkChairSprite(ctx, 0.8, 2.15, false);
  });
}

function mkPlant() {
  return mkSprite(1, 1, 48, (ctx) => {
    isoBox(ctx, 0.25, 0.25, 0.5, 0.5, 18, "#b56a44", { top: "#d97746", left: "#985232", right: "#7c3e22" });
    const c = isoVec(0.5, 0.5);
    ctx.fillStyle = "#38b000";
    ctx.beginPath(); ctx.arc(c.x, c.y - 28, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#70e000";
    ctx.beginPath(); ctx.arc(c.x - 3, c.y - 31, 5, 0, Math.PI * 2); ctx.fill();
  });
}

function mkBench() {
  return mkSprite(1, 2, 36, (ctx) => {
    for (const [lx, ly] of [[0.1, 0.1], [0.8, 0.1], [0.1, 1.8], [0.8, 1.8]]) {
      isoBox(ctx, lx, ly, 0.1, 0.1, 8, P.metalD, { noEdge: true });
    }
    isoBox(ctx, 0.05, 0.05, 0.9, 1.9, 8, P.sofa, { z: 8, top: P.sofaL, left: P.sofaD, right: shade(P.sofa, 0.7) });
  });
}

export function buildPiazzaFurniture() {
  return {
    cabinet1: mkCabinet(P.neonBlue, "#04231f", "#00ff9d", "STRIKE", "👾", drawStrikeScreen),
    cabinet2: mkCabinet(P.neonGreen, "#041f12", "#39ff14", "DRAGON", "🐉", drawDragonScreen),
    cabinet3: mkCabinet(P.neonPurple, "#1f0420", "#b026ff", "SPACE", "🚀", drawSpaceScreen),
    table1: mkDuelTable(P.feltGreen, P.feltGreenL, P.feltGreenD, "🃏"),
    table2: mkDuelTable(P.feltBlue, P.feltBlueL, P.feltBlueD, "🎴"),
    plant: mkPlant(),
    bench: mkBench(),
  };
}
