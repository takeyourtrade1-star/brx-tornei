/* Postazione PC e seduta: footprint e meta restano compatibili con il motore. */

import { P } from "./room-config.js";
import { mkSprite, isoBox, isoVec, quadFill, shade } from "./room-primitives.js";

function drawDrawerFront(ctx, sidePoint, start, end) {
  quadFill(
    ctx,
    [sidePoint(start, 4), sidePoint(end, 4), sidePoint(end, 16), sidePoint(start, 16)],
    shade(P.wood, 0.52),
  );
  const handle = sidePoint((start + end) / 2, 10);
  ctx.fillStyle = P.woodL;
  ctx.fillRect(Math.round(handle.x) - 2, Math.round(handle.y), 4, 2);
}

function drawKeyboard(ctx) {
  isoBox(ctx, 0.58, 1.3, 0.34, 0.62, 3, "#d8d4c8", { z: 20, noEdge: true });
  ctx.fillStyle = "#77756f";
  for (let row = 0; row < 4; row += 1) {
    for (let key = 0; key < 5; key += 1) {
      const point = isoVec(0.66 + key * 0.065, 1.42 + row * 0.13);
      ctx.fillRect(Math.round(point.x) - 1, Math.round(point.y) - 23, 3, 1);
    }
  }
  const space = isoVec(0.77, 1.86);
  ctx.fillStyle = "#aaa69a";
  ctx.fillRect(Math.round(space.x), Math.round(space.y) - 23, 9, 1);
}

function drawMouse(ctx) {
  const mouse = isoVec(1.02, 1.62);
  ctx.fillStyle = P.metalD;
  ctx.beginPath();
  ctx.ellipse(mouse.x, mouse.y - 24, 3.4, 2.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = P.screen;
  ctx.fillRect(Math.round(mouse.x) - 1, Math.round(mouse.y) - 26, 1, 1);
  ctx.strokeStyle = P.metalD;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(mouse.x + 2, mouse.y - 24);
  ctx.quadraticCurveTo(mouse.x + 9, mouse.y - 17, isoVec(0.38, 2.25).x, isoVec(0.38, 2.25).y - 21);
  ctx.stroke();
}

function drawComputerCase(ctx) {
  isoBox(ctx, 0.16, 2.42, 0.3, 0.46, 22, P.metalD, { top: P.metal });
  const caseBack = isoVec(0.46, 2.88);
  const caseRight = isoVec(0.46, 2.42);
  const center = { x: (caseBack.x + caseRight.x) / 2, y: (caseBack.y + caseRight.y) / 2 };
  ctx.fillStyle = P.screen;
  ctx.fillRect(Math.round(center.x) - 3, Math.round(center.y) - 36, 2, 2);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(Math.round(center.x) - 4, Math.round(center.y) - 31, 7, 1);
  ctx.fillRect(Math.round(center.x) - 4, Math.round(center.y) - 28, 7, 1);
  ctx.fillStyle = P.red;
  ctx.fillRect(Math.round(center.x) + 3, Math.round(center.y) - 35, 2, 2);
}

function monitorPoint(right, back, s, height) {
  return {
    x: right.x + s * (back.x - right.x),
    y: right.y + s * (back.y - right.y) - height,
  };
}

function drawMonitor(ctx, meta) {
  isoBox(ctx, 0.2, 1.5, 0.28, 0.3, 2, P.metalD, { z: 20, noEdge: true });
  isoBox(ctx, 0.28, 1.57, 0.1, 0.14, 8, P.metalD, { z: 22, noEdge: true });
  isoBox(ctx, 0.14, 1.16, 0.14, 0.98, 24, P.metalD, { z: 30, top: P.metalL });
  const monitorRight = isoVec(0.28, 1.16);
  const monitorBack = isoVec(0.28, 2.14);
  const screenPoint = (s, height) => monitorPoint(monitorRight, monitorBack, s, height);
  meta.screenQuad = [
    screenPoint(0.08, 51), screenPoint(0.92, 51),
    screenPoint(0.92, 33), screenPoint(0.08, 33),
  ];
  quadFill(ctx, meta.screenQuad, P.screenOff, P.ink, 1);
  quadFill(
    ctx,
    [screenPoint(0.05, 53), screenPoint(0.95, 53), screenPoint(0.95, 31), screenPoint(0.05, 31)],
    false,
    "rgba(255,255,255,0.22)",
    1,
  );

  /* La webcam deve stare sul bordo superiore del monitor, non alla base. */
  const webcam = screenPoint(0.5, 55);
  meta.webcam = { x: webcam.x, y: webcam.y };
  ctx.fillStyle = P.night;
  ctx.fillRect(Math.round(webcam.x) - 2, Math.round(webcam.y) - 3, 4, 2);
  ctx.fillStyle = P.screen;
  ctx.fillRect(Math.round(webcam.x), Math.round(webcam.y) - 3, 1, 1);
}

export function buildDesk(meta) {
  return mkSprite(1, 3, 66, (ctx) => {
    isoBox(ctx, 0, 0, 1, 3, 20, P.wood, { top: P.woodL });
    const right = isoVec(1, 0);
    const back = isoVec(1, 3);
    const sidePoint = (s, height) => ({
      x: right.x + s * (back.x - right.x),
      y: right.y + s * (back.y - right.y) - height,
    });
    drawDrawerFront(ctx, sidePoint, 0.12, 0.44);
    drawDrawerFront(ctx, sidePoint, 0.56, 0.88);
    drawMonitor(ctx, meta);
    drawKeyboard(ctx);
    drawMouse(ctx);
    drawComputerCase(ctx);

    /* Tazza e piccolo hub USB danno scala alla postazione senza cambiare il footprint. */
    isoBox(ctx, 0.62, 0.5, 0.15, 0.15, 5, P.red, { z: 20, noEdge: true });
    ctx.fillStyle = P.paperY;
    ctx.fillRect(Math.round(isoVec(0.7, 0.57).x), Math.round(isoVec(0.7, 0.57).y) - 26, 2, 1);
  });
}

export function buildCamera(meta, toward) {
  return mkSprite(1, 1, 52, (ctx) => {
    const top = { x: isoVec(0.5, 0.5).x, y: isoVec(0.5, 0.5).y - 26 };
    ctx.strokeStyle = P.metalD;
    ctx.lineWidth = 2;
    for (const [fx, fy] of [[0.14, 0.22], [0.86, 0.34], [0.42, 0.92]]) {
      const foot = isoVec(fx, fy);
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(foot.x, foot.y);
      ctx.stroke();
    }
    ctx.fillStyle = P.metal;
    ctx.fillRect(Math.round(top.x) - 2, Math.round(top.y) - 4, 4, 5);
    isoBox(ctx, 0.3, 0.3, 0.4, 0.4, 11, P.metalD, { z: 30 });
    const frontLeft = isoVec(0.3, 0.7);
    const frontBack = isoVec(0.7, 0.7);
    const front = {
      x: (frontLeft.x + frontBack.x) / 2,
      y: (frontLeft.y + frontBack.y) / 2 - 35,
    };
    if (toward === "sw") {
      ctx.fillStyle = P.ink;
      ctx.fillRect(Math.round(front.x) - 6, Math.round(front.y) - 1, 4, 4);
      ctx.fillStyle = P.night;
      ctx.beginPath();
      ctx.arc(front.x - 1, front.y + 1, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = P.screenD;
      ctx.fillRect(Math.round(front.x) - 2, Math.round(front.y) - 1, 2, 2);
      meta.camLedA = { x: Math.round(frontBack.x) - 2, y: Math.round(frontBack.y) - 39 };
    } else {
      ctx.fillStyle = P.night;
      ctx.fillRect(Math.round(front.x) - 4, Math.round(front.y) - 2, 8, 6);
      ctx.fillStyle = P.screenD;
      ctx.fillRect(Math.round(front.x) - 3, Math.round(front.y) - 1, 6, 4);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillRect(Math.round(front.x) - 3, Math.round(front.y) - 1, 2, 1);
      const topBar = isoVec(0.7, 0.3);
      ctx.fillStyle = P.ink;
      ctx.fillRect(Math.round(topBar.x) - 1, Math.round(topBar.y) - 40, 5, 3);
      meta.camLedB = { x: Math.round(front.x) + 4, y: Math.round(front.y) - 5 };
    }
  });
}

export function buildChair() {
  return mkSprite(1, 1, 46, (ctx) => {
    const center = isoVec(0.5, 0.5);
    ctx.strokeStyle = P.metalD;
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i += 1) {
      const angle = Math.PI * 2 * i / 5 + 0.5;
      ctx.beginPath();
      ctx.moveTo(center.x, center.y - 2);
      ctx.lineTo(center.x + Math.cos(angle) * 13, center.y - 2 + Math.sin(angle) * 6.5);
      ctx.stroke();
    }
    isoBox(ctx, 0.44, 0.44, 0.12, 0.12, 10, P.metalD, { z: 2, noEdge: true });
    isoBox(ctx, 0.18, 0.18, 0.64, 0.64, 6, "#3f4a6e", { z: 12 });
    isoBox(ctx, 0.68, 0.2, 0.12, 0.6, 24, "#46527a", { z: 16 });
  });
}
