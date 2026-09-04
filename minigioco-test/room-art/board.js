/* Bacheca TCG: sprite procedurale appeso alla parete di fondo. */
import { HTW, HTH, P } from "./room-config.js";
import { mkCanvas, quadFill, wallR } from "./room-primitives.js";

const PAD = 6;
const BOARD_LEFT = 3;
/* La porta Piazza inizia a c=5: questo margine vale anche per l'hit box. */
const BOARD_RIGHT = 4.7;
const BOARD_TOP = 98;
const BOARD_BOTTOM = 36;
const BOARD_WIDTH = Math.ceil((BOARD_RIGHT - BOARD_LEFT) * HTW) + PAD * 2;
const WALL_ANGLE = Math.atan2(HTH, HTW);

const boardPoint = (column, height) => ({
  x: (column - BOARD_LEFT) * HTW + PAD,
  y: (column - BOARD_LEFT) * HTH + (BOARD_TOP - height) + PAD,
});

const panel = (left, top, right, bottom) => [
  boardPoint(left, top), boardPoint(right, top),
  boardPoint(right, bottom), boardPoint(left, bottom),
];

const offset = (points, dx, dy) => points.map((point) => ({ x: point.x + dx, y: point.y + dy }));

function line(ctx, a, b, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(Math.round(a.x), Math.round(a.y));
  ctx.lineTo(Math.round(b.x), Math.round(b.y));
  ctx.stroke();
}

function planeText(ctx, point, value, color, size = 4) {
  ctx.save();
  ctx.translate(Math.round(point.x), Math.round(point.y));
  ctx.rotate(WALL_ANGLE);
  ctx.scale(1, 0.78);
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px 'Courier New', monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(value, 0, 0);
  ctx.restore();
}

function pushPin(ctx, point, color, radius = 2.1) {
  const x = Math.round(point.x);
  const y = Math.round(point.y);
  ctx.fillStyle = "rgba(40,25,20,0.42)";
  ctx.fillRect(x - 1, y + 2, 3, 2);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.fillRect(x - 1, y - 2, 1, 1);
}

function paperGeometry(column, top, width, height) {
  const quad = panel(column, top, column + width, top - height);
  return {
    quad,
    left: boardPoint(column, top - height / 2),
    right: boardPoint(column + width, top - height / 2),
    center: boardPoint(column + width / 2, top - height / 2),
    pin: boardPoint(column + width / 2, top - 1.2),
  };
}

function sheet(ctx, spec) {
  const { column, top, width, height, color, pin, label } = spec;
  const geometry = paperGeometry(column, top, width, height);
  quadFill(ctx, offset(geometry.quad, 3, 3), "rgba(47,29,24,0.34)");
  quadFill(ctx, geometry.quad, color, P.woodD, 0.8);

  // Angolo piegato e fibra della carta: piccoli dettagli restano leggibili a 1x.
  const fold = [
    boardPoint(column + width - 0.13, top), boardPoint(column + width, top),
    boardPoint(column + width, top - 3.2), boardPoint(column + width - 0.13, top - 3.2),
  ];
  quadFill(ctx, fold, "rgba(255,255,255,0.5)");
  line(ctx, boardPoint(column + 0.08, top - 4.8), boardPoint(column + width - 0.08, top - 4.8), "rgba(111,86,63,0.35)");
  if (height > 12) {
    line(ctx, boardPoint(column + 0.08, top - 8.7), boardPoint(column + width - 0.08, top - 8.7), "rgba(111,86,63,0.28)");
  }
  if (label) planeText(ctx, boardPoint(column + width / 2, top - height * 0.68), label, P.woodXD, height > 13 ? 4 : 3.5);
  pushPin(ctx, geometry.pin, pin);
  return geometry;
}

function drawThread(ctx, from, to, color) {
  const start = { x: from.right.x - 1, y: from.right.y };
  const end = { x: to.left.x + 1, y: to.left.y };
  const bend = { x: (start.x + end.x) / 2, y: Math.max(start.y, end.y) + 4 };
  ctx.strokeStyle = "rgba(68,31,28,0.34)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y + 1);
  ctx.quadraticCurveTo(bend.x, bend.y + 1, end.x, end.y + 1);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.quadraticCurveTo(bend.x, bend.y, end.x, end.y);
  ctx.stroke();
}

function drawTrophy(ctx, point, scale = 1) {
  const x = Math.round(point.x);
  const y = Math.round(point.y);
  const w = Math.max(1, Math.round(8 * scale));
  const h = Math.max(1, Math.round(5 * scale));
  ctx.fillStyle = P.goldD;
  ctx.fillRect(x - w / 2 - 2, y - h + 1, 2, h);
  ctx.fillRect(x + w / 2, y - h + 1, 2, h);
  ctx.fillStyle = P.gold;
  ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.fillRect(x - Math.max(1, Math.round(2 * scale)), y, Math.max(1, Math.round(4 * scale)), Math.max(1, Math.round(2 * scale)));
  ctx.fillRect(x - Math.max(1, Math.round(5 * scale)), y + Math.max(2, Math.round(2 * scale)), Math.max(1, Math.round(10 * scale)), Math.max(1, Math.round(2 * scale)));
  ctx.fillStyle = "rgba(255,249,188,0.86)";
  ctx.fillRect(x - Math.max(1, Math.round(2 * scale)), y - h + 1, Math.max(1, Math.round(2 * scale)), 1);
}

function drawFrame(ctx) {
  const outer = panel(BOARD_LEFT, BOARD_TOP, BOARD_RIGHT, BOARD_BOTTOM);
  const cork = panel(3.13, 92, 4.57, 42);
  quadFill(ctx, offset(outer, 3, 4), "rgba(33,22,25,0.36)");
  quadFill(ctx, outer, P.woodXD, P.outline, 1.5);
  quadFill(ctx, panel(3.02, 98, 4.68, 94), P.woodL);
  quadFill(ctx, panel(3.02, 94, 3.15, 36), P.wood);
  quadFill(ctx, panel(4.55, 94, 4.68, 36), P.woodD);
  quadFill(ctx, panel(3.12, 40, 4.58, 36), P.woodD);
  quadFill(ctx, offset(cork, 2, 2), "rgba(49,29,20,0.28)");
  const corkGradient = ctx.createLinearGradient(5, 12, 90, 108);
  corkGradient.addColorStop(0, P.cork);
  corkGradient.addColorStop(1, P.corkD);
  quadFill(ctx, cork, corkGradient, P.woodD, 1);

  for (let i = 0; i < 96; i += 1) {
    const column = 3.2 + ((i * 37) % 100) / 100 * 2.18;
    const height = 44 + ((i * 53) % 100) / 100 * 44;
    const point = boardPoint(column, height);
    ctx.fillStyle = i % 5 === 0 ? "rgba(255,233,189,0.32)" : "rgba(112,72,38,0.26)";
    ctx.fillRect(Math.round(point.x), Math.round(point.y), i % 7 === 0 ? 2 : 1, 1);
  }

  // Quattro chiodi da cornice: rendono il materiale e la profondità immediati.
  pushPin(ctx, boardPoint(3.17, 91), P.goldD, 1.5);
  pushPin(ctx, boardPoint(4.57, 91), P.goldD, 1.5);
  pushPin(ctx, boardPoint(3.17, 43), P.goldD, 1.5);
  pushPin(ctx, boardPoint(4.57, 43), P.goldD, 1.5);
  quadFill(ctx, panel(3.34, 96.5, 4.38, 94.2), P.woodXD, "rgba(255,220,145,0.5)", 0.7);
  planeText(ctx, boardPoint(3.86, 95.35), "TORNEI", "#ffe5a4", 4);
}

function drawBracket(ctx) {
  const slots = [
    { column: 3.18, top: 89, width: 0.42, height: 10, color: P.paper, pin: P.red, label: "A1" },
    { column: 3.18, top: 77, width: 0.42, height: 10, color: P.paperY, pin: P.screenD, label: "A2" },
    { column: 3.18, top: 65, width: 0.42, height: 10, color: P.paper, pin: P.leaf, label: "B1" },
    { column: 3.18, top: 53, width: 0.42, height: 10, color: P.paperP, pin: P.gold, label: "B2" },
    { column: 3.78, top: 83, width: 0.48, height: 12, color: P.paper, pin: P.red, label: "SF1" },
    { column: 3.78, top: 65, width: 0.48, height: 12, color: P.paperY, pin: P.screenD, label: "SF2" },
    { column: 4.3, top: 75, width: 0.32, height: 17, color: P.paperY, pin: P.gold, label: "FIN" },
  ];
  const geometry = slots.map(({ column, top, width, height }) => paperGeometry(column, top, width, height));
  [[0, 4], [1, 4], [2, 5], [3, 5], [4, 6], [5, 6]].forEach(([from, to]) => drawThread(ctx, geometry[from], geometry[to], P.red));
  slots.forEach((spec) => sheet(ctx, spec));
  drawTrophy(ctx, boardPoint(4.48, 66), 0.72);
  planeText(ctx, boardPoint(4.48, 83), "LIVE", P.red, 3.5);
}

function drawNotices(ctx) {
  [
    { column: 3.16, top: 89, width: 0.48, height: 19, color: P.paper, pin: P.red, label: "NEWS" },
    { column: 3.72, top: 90, width: 0.55, height: 22, color: P.paperY, pin: P.screenD, label: "EVENTI" },
    { column: 4.32, top: 88, width: 0.3, height: 18, color: P.paperP, pin: P.gold, label: "TCG" },
    { column: 3.2, top: 61, width: 0.56, height: 21, color: P.paperY, pin: P.leaf, label: "DECK" },
    { column: 4.27, top: 62, width: 0.3, height: 19, color: P.paper, pin: P.screenD, label: "BO3" },
    { column: 3.82, top: 65, width: 0.56, height: 28, color: P.paper, pin: P.red, label: "OPEN" },
  ].forEach((spec) => sheet(ctx, spec));
  drawTrophy(ctx, boardPoint(4.38, 51), 0.78);
}

/** Costruisce la bacheca; l'anchor resta identico a quello usato dall'hit-test del motore. */
export function buildBoard(bracket = false) {
  const cv = mkCanvas(BOARD_WIDTH, 116);
  const ctx = cv.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  drawFrame(ctx);
  if (bracket) drawBracket(ctx);
  else drawNotices(ctx);
  const base = wallR(BOARD_LEFT, BOARD_TOP);
  return { cv, wx: base.x - PAD, wy: base.y - PAD };
}
