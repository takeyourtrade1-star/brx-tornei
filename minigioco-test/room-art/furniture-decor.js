/* Decorazioni animate: ogni frame produce un canvas distinto per il loop. */

import { P } from "./room-config.js";
import { mkSprite, isoBox, isoVec, quadFill, shade } from "./room-primitives.js";

export function buildStool() {
  return mkSprite(1, 1, 26, (ctx) => {
    isoBox(ctx, 0.3, 0.3, 0.4, 0.4, 11, P.wood, { noEdge: true });
    isoBox(ctx, 0.26, 0.26, 0.48, 0.48, 4, P.red, { z: 11 });
  });
}

export function buildPlant(frame = 0) {
  const sway = [-1.5, 0, 1.5][Math.abs(frame) % 3];
  return mkSprite(1, 1, 66, (ctx) => {
    isoBox(ctx, 0.3, 0.3, 0.4, 0.4, 12, P.pot);
    isoBox(ctx, 0.26, 0.26, 0.48, 0.48, 3, shade(P.pot, 1.18), { z: 12, noEdge: true });
    const center = isoVec(0.5, 0.5);
    quadFill(
      ctx,
      [
        { x: center.x - 6, y: center.y - 15 },
        { x: center.x + 6, y: center.y - 15 },
        { x: center.x + 4, y: center.y - 12 },
        { x: center.x - 4, y: center.y - 12 },
      ],
      P.woodXD,
    );
    ctx.strokeStyle = P.leafD;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(center.x, center.y - 14);
    ctx.quadraticCurveTo(center.x + sway, center.y - 29, center.x + sway, center.y - 44);
    ctx.stroke();

    const leaves = [
      [-12, -38, -0.9, P.leafD, 0.35],
      [12, -40, 0.9, P.leaf, 0.32],
      [-10, -48, -0.45, P.leaf, 0.7],
      [10, -50, 0.45, P.leafD, 0.7],
      [0, -56, 0, P.leaf, 1],
      [-4, -30, -1.2, P.leafD, 0.1],
    ];
    for (const [x, y, rotation, color, weight] of leaves) {
      ctx.save();
      ctx.translate(center.x + x + sway * weight, center.y + y);
      ctx.rotate(rotation + sway * 0.025);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = shade(P.leafD, 0.8);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.lineTo(7, 0);
      ctx.stroke();
      ctx.restore();
    }
  });
}

export function buildLamp(meta) {
  return mkSprite(1, 1, 86, (ctx) => {
    const center = isoVec(0.5, 0.5);
    isoBox(ctx, 0.34, 0.34, 0.32, 0.32, 4, P.metalD, { noEdge: true });
    ctx.fillStyle = P.metalD;
    ctx.fillRect(Math.round(center.x) - 1, Math.round(center.y) - 64, 2, 60);
    quadFill(
      ctx,
      [
        { x: center.x - 10, y: center.y - 78 },
        { x: center.x + 10, y: center.y - 78 },
        { x: center.x + 14, y: center.y - 62 },
        { x: center.x - 14, y: center.y - 62 },
      ],
      P.gold,
    );
    quadFill(
      ctx,
      [
        { x: center.x - 13, y: center.y - 63 },
        { x: center.x + 13, y: center.y - 63 },
        { x: center.x + 14, y: center.y - 61 },
        { x: center.x - 14, y: center.y - 61 },
      ],
      "#fff0c0",
    );
    meta.lampGlow = { x: center.x, y: center.y - 62 };
  });
}

export function buildTurntable(frame = 0) {
  const angle = frame * Math.PI / 2 + 0.4;
  return mkSprite(1, 1, 46, (ctx) => {
    isoBox(ctx, 0.12, 0.12, 0.76, 0.76, 16, P.woodD, { top: P.wood });
    const center = isoVec(0.5, 0.5);
    ctx.fillStyle = P.ink;
    ctx.beginPath();
    ctx.ellipse(center.x, center.y - 17, 13, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = P.night;
    ctx.beginPath();
    ctx.ellipse(center.x, center.y - 18, 11, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(center.x, center.y - 18);
    ctx.rotate(angle);
    ctx.strokeStyle = "rgba(255,255,255,0.48)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(9, 0);
    ctx.stroke();
    ctx.fillStyle = P.gold;
    ctx.fillRect(-2, -1, 4, 2);
    ctx.restore();
    ctx.fillStyle = P.gold;
    ctx.fillRect(Math.round(center.x) - 13, Math.round(center.y) - 9, 2, 2);
    ctx.fillRect(Math.round(center.x) - 9, Math.round(center.y) - 7, 2, 2);
    const needleX = Math.round(center.x) + 12 + Math.round(Math.sin(angle) * 2);
    ctx.strokeStyle = P.metalL;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(needleX, Math.round(center.y) - 25);
    ctx.lineTo(Math.round(center.x) + 5, Math.round(center.y) - 19);
    ctx.stroke();
    ctx.fillStyle = P.metal;
    ctx.fillRect(needleX - 1, Math.round(center.y) - 28, 3, 5);
  });
}
