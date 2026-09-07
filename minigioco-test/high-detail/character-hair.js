import { ellipse, gradient, line, polygon, roundRect } from "./primitives.js";
import { CHARACTER_COLORS as C, rgba } from "./character-style.js";

function tone(color, ghost, alpha = 1) {
  return ghost ? rgba(C.haze, alpha) : alpha === 1 ? color : rgba(color, alpha);
}

function hairGradient(ctx, center, hair, ghost) {
  if (ghost) return rgba(C.haze, 0.78);
  return gradient(ctx, center.x - 8, center.y - 9, center.x + 8, center.y + 2, [
    [0, hair.light], [0.44, hair.base], [1, hair.shadow],
  ]);
}

function drawBackLocks(ctx, center, hair, direction, ghost) {
  const base = tone(hair.base, ghost, 0.96);
  const shadow = tone(hair.shadow, ghost, 0.9);
  if (hair.cut === "long") {
    ellipse(ctx, center.x - 7, center.y + 3.5, 3.5, 8.2, shadow);
    ellipse(ctx, center.x + 7, center.y + 3.5, 3.5, 8.2, base);
  }
  if (hair.cut === "bob") {
    roundRect(ctx, center.x - 8.5, center.y - 0.6, 17, 9.6, 4.2, shadow);
  }
  if (hair.cut === "pony") {
    const x = center.x + direction.side * 7.8;
    ellipse(ctx, x, center.y + 1.8, 3.6, 6.8, base);
    ellipse(ctx, x - direction.side * 0.5, center.y - 3.5, 1.5, 1.2, tone(C.amber, ghost, 0.9));
  }
  if (hair.cut === "curls") {
    for (const dx of [-6.2, -2.5, 1.5, 5.4]) {
      ellipse(ctx, center.x + dx, center.y + 1.5, 2.7, 3.3, dx > 1 ? base : shadow);
    }
  }
}

/** Disegna la massa posteriore, oppure la testa vista da dietro. */
export function drawHairBack(ctx, center, hair, direction, ghost = false, fullBack = false) {
  drawBackLocks(ctx, center, hair, direction, ghost);
  if (fullBack) {
    ellipse(ctx, center.x, center.y, 8.7, 9.2, tone(hair.shadow, ghost, 0.92));
    ellipse(ctx, center.x, center.y - 3, 8.8, 6.8, hairGradient(ctx, center, hair, ghost));
    if (hair.cut === "curls") {
      for (const dx of [-6, -2.7, 1, 4.7, 7]) {
        ellipse(ctx, center.x + dx, center.y + 0.8, 2.4, 3.4, tone(hair.base, ghost, 0.95));
      }
    }
    line(ctx, [
      { x: center.x - 5.5, y: center.y - 5.4 },
      { x: center.x, y: center.y - 6.3 },
      { x: center.x + 5.2, y: center.y - 5.3 },
    ], tone(hair.light, ghost, 0.5), 0.9);
    return;
  }
  ellipse(ctx, center.x, center.y - 4.2, 8.8, 5.8, hairGradient(ctx, center, hair, ghost));
}

function drawSoftFringe(ctx, center, hair, direction, ghost) {
  const base = tone(hair.base, ghost, 0.98);
  const light = tone(hair.light, ghost, 0.76);
  if (hair.cut === "crop") {
    polygon(ctx, [
      { x: center.x - 8, y: center.y - 4.1 },
      { x: center.x - 3.2, y: center.y - 1.4 },
      { x: center.x + 1.5, y: center.y - 2.6 },
      { x: center.x + 6.8, y: center.y - 4.5 },
      { x: center.x + 4, y: center.y - 6.2 },
      { x: center.x - 4, y: center.y - 6.1 },
    ], base);
  }
  if (hair.cut === "buzz") {
    for (const dx of [-6.6, -3.7, -0.8, 2.2, 5.2]) {
      line(ctx, [
        { x: center.x + dx, y: center.y - 6.8 },
        { x: center.x + dx - 0.35, y: center.y - 5.5 },
      ], light, 0.65);
    }
  }
  if (hair.cut === "curls") {
    for (const [dx, dy] of [[-6.6, -5], [-3.7, -5.6], [-0.6, -5.9], [2.7, -5.4], [5.8, -4.8]]) {
      ellipse(ctx, center.x + dx, center.y + dy, 2.5, 2.35, base);
    }
    ellipse(ctx, center.x - direction.side * 1.2, center.y - 6.1, 1.25, 0.7, light);
  }
  if (hair.cut === "bob") {
    polygon(ctx, [
      { x: center.x - 8.2, y: center.y - 4.2 },
      { x: center.x - 3.4, y: center.y - 1.4 },
      { x: center.x + 1.5, y: center.y - 2.1 },
      { x: center.x + 7.2, y: center.y - 4.4 },
      { x: center.x + 4.8, y: center.y - 6.2 },
      { x: center.x - 4.8, y: center.y - 6.1 },
    ], base);
    line(ctx, [
      { x: center.x - 5.6, y: center.y - 6.1 },
      { x: center.x - 0.6, y: center.y - 6.8 },
      { x: center.x + 4.8, y: center.y - 5.8 },
    ], light, 0.9);
  }
  if (hair.cut === "pony") {
    polygon(ctx, [
      { x: center.x - 7.8, y: center.y - 4.3 },
      { x: center.x - 2.2, y: center.y - 1.5 },
      { x: center.x + 3.5, y: center.y - 3.1 },
      { x: center.x + 7.2, y: center.y - 5.1 },
      { x: center.x + 4.5, y: center.y - 6.4 },
      { x: center.x - 4.5, y: center.y - 6.1 },
    ], base);
    line(ctx, [
      { x: center.x - 5.5, y: center.y - 6.1 },
      { x: center.x - 0.3, y: center.y - 6.8 },
      { x: center.x + 4.8, y: center.y - 5.6 },
    ], light, 0.9);
  }
  if (hair.cut === "long") {
    polygon(ctx, [
      { x: center.x - 8, y: center.y - 4.5 },
      { x: center.x - 2.5, y: center.y - 1.6 },
      { x: center.x + 3.8, y: center.y - 3.2 },
      { x: center.x + 7.7, y: center.y - 5 },
      { x: center.x + 4.8, y: center.y - 6.4 },
      { x: center.x - 4.8, y: center.y - 6.1 },
    ], base);
    line(ctx, [
      { x: center.x - 5.8, y: center.y - 6.2 },
      { x: center.x - 0.4, y: center.y - 6.9 },
      { x: center.x + 5.2, y: center.y - 5.7 },
    ], light, 0.9);
  }
}

export function drawHairFront(ctx, center, hair, direction, ghost = false) {
  drawSoftFringe(ctx, center, hair, direction, ghost);
  if (hair.cut === "buzz") {
    line(ctx, [
      { x: center.x - 7.2, y: center.y - 2.1 },
      { x: center.x + 7.2, y: center.y - 2.1 },
    ], tone(hair.shadow, ghost, 0.5), 0.65);
  }
  line(ctx, [
    { x: center.x - 6.6, y: center.y - 7.1 },
    { x: center.x - 2.1, y: center.y - 7.8 },
  ], tone(hair.light, ghost, 0.48), 0.7);
}
