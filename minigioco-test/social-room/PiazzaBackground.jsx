import {
  WW, WH, COLS, ROWS, HTW, HTH, OX, OY, WALL_H,
  wallL, wallR, quadFill, shade, mkCanvas, tileTop,
} from "../arcade-room/iso-draw.js";
import { P_PIAZZA as P } from "./piazza-config.js";

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

export function buildPiazzaBackground(phase) {
  const cv = mkCanvas(WW, WH);
  const ctx = cv.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  // Parete sinistra e parete posteriore
  quadFill(ctx, [wallL(0, WALL_H), wallL(ROWS, WALL_H), wallL(ROWS, 0), wallL(0, 0)], P.wallDark);
  quadFill(ctx, [wallR(0, WALL_H), wallR(COLS, WALL_H), wallR(COLS, 0), wallR(0, 0)], P.wall);

  // Bordo superiore e colonna d'angolo
  quadFill(ctx, [wallL(0, WALL_H + 5), wallL(ROWS, WALL_H + 5), wallL(ROWS, WALL_H), wallL(0, WALL_H)], P.wallTop);
  quadFill(ctx, [wallR(0, WALL_H + 5), wallR(COLS, WALL_H + 5), wallR(COLS, WALL_H), wallR(0, WALL_H)], P.wallTop);
  ctx.fillStyle = shade(P.wallDark, 0.75);
  ctx.fillRect(OX - 1, OY - WALL_H - 5, 2, WALL_H + 5);

  // Pavimento a scacchiera con passatoia centrale
  drawFloor(ctx);

  // Grandi finestre panoramiche con vista all'esterno
  const skyTop = (phase && phase.skyTop) || P.skyTop;
  const skyBot = (phase && phase.skyBot) || P.skyBot;
  drawWindow(ctx, 2.2, 4.8, true, skyTop, skyBot);
  drawWindow(ctx, 5.8, 8.4, false, skyTop, skyBot);

  // Fascio di luce naturale sul pavimento
  drawSunbeams(ctx);

  // Porta di uscita verso Sala Tornei
  drawDoor(ctx);

  // Insegna retro "SALA PIAZZA" sulla parete
  drawNeonSign(ctx);

  return cv;
}

function drawFloor(ctx) {
  for (let cx = 0; cx < COLS; cx++) {
    for (let cy = 0; cy < ROWS; cy++) {
      const tp = tileTop(cx, cy);
      const isCarpet = cx >= 4 && cx <= 6 && cy >= 2 && cy <= 8;
      const even = (cx + cy) % 2 === 0;
      const col = isCarpet ? (even ? P.carpet : P.carpetL) : (even ? P.floorA : P.floorB);
      const diamond = [
        tp,
        { x: tp.x + HTW, y: tp.y + HTH },
        { x: tp.x, y: tp.y + 2 * HTH },
        { x: tp.x - HTW, y: tp.y + HTH },
      ];
      quadFill(ctx, diamond, col);
      ctx.strokeStyle = isCarpet ? "rgba(255,215,0,0.18)" : P.floorLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tp.x + HTW, tp.y + HTH);
      ctx.lineTo(tp.x, tp.y + 2 * HTH);
      ctx.lineTo(tp.x - HTW, tp.y + HTH);
      ctx.stroke();
    }
  }
  // Bordo 3D del pavimento
  const bL = tileTop(0, ROWS), bB = tileTop(COLS, ROWS), bR = tileTop(COLS, 0);
  quadFill(ctx, [bL, bB, { x: bB.x, y: bB.y + 12 }, { x: bL.x, y: bL.y + 12 }], P.floorSide);
  quadFill(ctx, [bB, bR, { x: bR.x, y: bR.y + 12 }, { x: bB.x, y: bB.y + 12 }], shade(P.floorSide, 0.8));
}

function drawWindow(ctx, c0, c1, hasSun, skyTop, skyBot) {
  const frame = [wallL(c0, 92), wallL(c1, 92), wallL(c1, 28), wallL(c0, 28)];
  quadFill(ctx, frame, P.woodD, P.woodXD, 2);

  const glass = [wallL(c0 + 0.12, 88), wallL(c1 - 0.12, 88), wallL(c1 - 0.12, 32), wallL(c0 + 0.12, 32)];
  const sg = ctx.createLinearGradient(0, glass[0].y, 0, glass[2].y);
  sg.addColorStop(0, skyTop);
  sg.addColorStop(1, skyBot);
  quadFill(ctx, glass, sg);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(glass[0].x, glass[0].y);
  ctx.lineTo(glass[1].x, glass[1].y);
  ctx.lineTo(glass[2].x, glass[2].y);
  ctx.lineTo(glass[3].x, glass[3].y);
  ctx.closePath();
  ctx.clip();

  if (hasSun) {
    const sunPt = wallL(c0 + 0.8, 70);
    ctx.fillStyle = P.sun;
    ctx.beginPath(); ctx.arc(sunPt.x, sunPt.y, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath(); ctx.arc(sunPt.x - 2, sunPt.y - 2, 4, 0, Math.PI * 2); ctx.fill();
  } else {
    const cl = wallL(c0 + 0.5, 66);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(cl.x, cl.y, 24, 7);
    ctx.fillRect(cl.x + 4, cl.y - 4, 16, 5);
  }
  ctx.restore();

  // Traversine
  const midC = (c0 + c1) / 2;
  quadFill(ctx, [wallL(midC - 0.08, 88), wallL(midC + 0.08, 88), wallL(midC + 0.08, 32), wallL(midC - 0.08, 32)], P.wood);
  quadFill(ctx, [wallL(c0 + 0.1, 60), wallL(c1 - 0.1, 60), wallL(c1 - 0.1, 56), wallL(c0 + 0.1, 56)], P.wood);

  // Davanzale in legno chiaro
  quadFill(ctx, [wallL(c0 - 0.08, 28), wallL(c1 + 0.08, 28), wallL(c1 + 0.08, 23), wallL(c0 - 0.08, 23)], P.woodL);
}

function drawSunbeams(ctx) {
  const p1 = wallL(2.2, 30);
  const p2 = wallL(8.4, 30);
  const p3 = tileTop(6.5, 8.5);
  const p4 = tileTop(1.5, 8.5);
  const beam = ctx.createLinearGradient(p1.x, p1.y, p3.x, p3.y);
  beam.addColorStop(0, "rgba(255,245,190,0.22)");
  beam.addColorStop(0.5, "rgba(255,235,170,0.10)");
  beam.addColorStop(1, "rgba(255,235,170,0.0)");
  quadFill(ctx, [p1, p2, p3, p4], beam);
}

function drawDoor(ctx) {
  const d = piazzaDoorBounds();
  quadFill(ctx, [d.topL, d.topR, d.botR, d.botL], shade(P.woodD, 0.95), P.woodXD, 2);
  const pad = 3;
  const leaf = [
    { x: d.topL.x + pad, y: d.topL.y + pad },
    { x: d.topR.x - pad, y: d.topR.y + pad },
    { x: d.botR.x - pad, y: d.botR.y - pad },
    { x: d.botL.x + pad, y: d.botL.y - pad },
  ];
  quadFill(ctx, leaf, P.wood, P.woodD, 1);

  const midX = (d.topL.x + d.topR.x) / 2;
  const midY = (d.topL.y + d.topR.y) / 2 + 14;
  ctx.save();
  ctx.translate(midX, midY);
  ctx.rotate(Math.atan2(HTH, HTW));
  ctx.fillStyle = "#1b1828";
  ctx.fillRect(-22, -6, 44, 12);
  ctx.strokeStyle = P.gold;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-22, -6, 44, 12);
  ctx.fillStyle = P.gold;
  ctx.font = "bold 5px 'Press Start 2P', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("TORNEI", 0, 0);
  ctx.restore();
}

function drawNeonSign(ctx) {
  const pos = wallR(4.5, 96);
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(Math.atan2(HTH, HTW));
  ctx.fillStyle = "rgba(16,20,36,0.92)";
  ctx.fillRect(-62, -11, 124, 22);
  ctx.strokeStyle = "#05d9e8";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-62, -11, 124, 22);
  ctx.shadowColor = "#05d9e8";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 8px 'Press Start 2P', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SALA PIAZZA", 0, 0);
  ctx.restore();
}
