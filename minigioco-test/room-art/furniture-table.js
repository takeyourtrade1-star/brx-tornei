/* Tavolo TCG: playmat, deckbox, ventagli di carte e dadi leggibili. */

import { HTW, HTH, P } from "./room-config.js";
import { mkSprite, isoBox, isoVec, quadFill, shade } from "./room-primitives.js";

const ISO_ANGLE = Math.atan2(HTH, HTW);

function tableInset(inset, z) {
  return [
    { x: isoVec(inset, inset).x, y: isoVec(inset, inset).y - z },
    { x: isoVec(3 - inset, inset).x, y: isoVec(3 - inset, inset).y - z },
    { x: isoVec(3 - inset, 3 - inset).x, y: isoVec(3 - inset, 3 - inset).y - z },
    { x: isoVec(inset, 3 - inset).x, y: isoVec(inset, 3 - inset).y - z },
  ];
}

function drawStitches(ctx, points) {
  ctx.fillStyle = "rgba(219,235,179,0.82)";
  for (let edge = 0; edge < points.length; edge += 1) {
    const from = points[edge];
    const to = points[(edge + 1) % points.length];
    for (let step = 1; step < 7; step += 1) {
      const amount = step / 7;
      const x = from.x + (to.x - from.x) * amount;
      const y = from.y + (to.y - from.y) * amount;
      ctx.fillRect(Math.round(x), Math.round(y), 2, 1);
    }
  }
}

function drawAceMark(ctx) {
  const center = isoVec(1.5, 1.5);
  quadFill(
    ctx,
    [
      { x: center.x, y: center.y - 27 },
      { x: center.x + 12, y: center.y - 22 },
      { x: center.x, y: center.y - 17 },
      { x: center.x - 12, y: center.y - 22 },
    ],
    "rgba(242,185,75,0.2)",
    "rgba(242,185,75,0.72)",
    1,
  );
  ctx.save();
  ctx.translate(center.x, center.y - 22);
  ctx.rotate(ISO_ANGLE);
  ctx.scale(1, 0.78);
  ctx.fillStyle = P.gold;
  ctx.font = "bold 9px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("A", 0, 0);
  ctx.restore();
}

function drawPlaymat(ctx) {
  const outer = tableInset(0.14, 22);
  const inner = tableInset(0.23, 22);
  quadFill(ctx, outer, P.feltD, P.woodXD, 1);
  quadFill(ctx, inner, P.felt);
  quadFill(ctx, tableInset(0.29, 23), false, P.feltL, 1);
  drawStitches(ctx, tableInset(0.34, 23));
  drawAceMark(ctx);
}

function cardPoints(tx, ty, z, width = 0.36, depth = 0.26) {
  const a = isoVec(tx, ty);
  const b = isoVec(tx + width, ty);
  const c = isoVec(tx + width, ty + depth);
  const d = isoVec(tx, ty + depth);
  return [
    { x: a.x, y: a.y - z },
    { x: b.x, y: b.y - z },
    { x: c.x, y: c.y - z },
    { x: d.x, y: d.y - z },
  ];
}

function drawTableCard(ctx, tx, ty, kind, color, lift = 0) {
  const z = 23 + lift;
  const points = cardPoints(tx, ty, z);
  quadFill(
    ctx,
    [points[3], points[2], { x: points[2].x, y: points[2].y + 1.5 }, { x: points[3].x, y: points[3].y + 1.5 }],
    shade(color, 0.5),
  );
  quadFill(ctx, points, kind === "face" ? P.paper : color, P.ink, 0.7);
  const center = { x: (points[0].x + points[2].x) / 2, y: (points[0].y + points[2].y) / 2 };
  if (kind === "back") {
    quadFill(
      ctx,
      [
        { x: center.x, y: center.y - 3 },
        { x: center.x + 5, y: center.y },
        { x: center.x, y: center.y + 3 },
        { x: center.x - 5, y: center.y },
      ],
      "rgba(255,255,255,0.75)",
    );
    ctx.fillStyle = P.redD;
    ctx.fillRect(Math.round(center.x) - 1, Math.round(center.y) - 1, 2, 2);
  }
  if (kind === "face") {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(center.x) - 3, Math.round(center.y) - 2, 6, 4);
    ctx.fillStyle = P.gold;
    ctx.fillRect(Math.round(center.x) - 1, Math.round(center.y) - 1, 2, 1);
  }
}

function drawCardFan(ctx, tx, ty, color, count) {
  for (let index = 0; index < count; index += 1) {
    const amount = index / Math.max(1, count - 1);
    drawTableCard(
      ctx,
      tx + amount * 0.38,
      ty + amount * 0.03,
      index === count - 1 ? "back" : "edge_back",
      color,
      index * 0.9,
    );
  }
}

function drawDeckBox(ctx, tx, ty, color, label) {
  isoBox(ctx, tx, ty, 0.5, 0.58, 7, color, {
    z: 23,
    top: shade(color, 1.22),
    left: shade(color, 0.92),
    right: shade(color, 0.7),
  });
  const center = isoVec(tx + 0.25, ty + 0.29);
  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.fillRect(Math.round(center.x) - 5, Math.round(center.y) - 31, 10, 2);
  ctx.save();
  ctx.translate(center.x, center.y - 29);
  ctx.rotate(ISO_ANGLE);
  ctx.scale(1, 0.78);
  ctx.fillStyle = P.paper;
  ctx.font = "bold 5px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 0, 0);
  ctx.restore();
}

function drawDie(ctx, tx, ty, color, pipCount) {
  isoBox(ctx, tx, ty, 0.32, 0.32, 6, color, {
    z: 23,
    top: P.paper,
    left: shade(color, 0.86),
    right: shade(color, 0.66),
  });
  const center = isoVec(tx + 0.16, ty + 0.16);
  const patterns = {
    1: [[0, 0]],
    2: [[-2, -1], [2, 1]],
    3: [[-2, -1], [0, 0], [2, 1]],
    4: [[-2, -1], [2, -1], [-2, 1], [2, 1]],
    5: [[-2, -1], [2, -1], [0, 0], [-2, 1], [2, 1]],
    6: [[-2, -2], [2, -2], [-2, 0], [2, 0], [-2, 2], [2, 2]],
  };
  ctx.fillStyle = color;
  for (const [dx, dy] of patterns[pipCount] || patterns[1]) {
    ctx.fillRect(Math.round(center.x + dx), Math.round(center.y - 30 + dy), 2, 2);
  }
}

function drawCounters(ctx) {
  for (const [tx, ty, color] of [[0.72, 2.46, P.gold], [0.89, 2.5, P.screenD], [2.42, 1.03, P.red]]) {
    isoBox(ctx, tx, ty, 0.12, 0.12, 3, color, { z: 23, noEdge: true });
  }
}

export function buildTable() {
  return mkSprite(3, 3, 72, (ctx) => {
    isoBox(ctx, 0, 0, 3, 3, 22, P.wood, { top: P.woodL });
    drawPlaymat(ctx);

    drawDeckBox(ctx, 0.42, 0.48, P.red, "A");
    drawDeckBox(ctx, 2.04, 0.5, "#4a7fd6", "B");
    drawCardFan(ctx, 0.88, 0.78, P.red, 5);
    drawCardFan(ctx, 1.05, 2.03, "#4a7fd6", 4);

    drawTableCard(ctx, 1.42, 1.13, "face", P.red, 0.8);
    drawTableCard(ctx, 1.76, 1.28, "face", "#9a6ad6", 1.2);
    drawTableCard(ctx, 1.92, 1.72, "back", P.red, 0.4);
    drawTableCard(ctx, 2.18, 2.0, "face", P.gold, 0.8);
    drawDie(ctx, 0.68, 1.74, P.red, 5);
    drawDie(ctx, 2.27, 1.4, P.gold, 3);
    drawCounters(ctx);
  });
}
