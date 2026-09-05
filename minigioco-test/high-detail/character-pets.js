import { ellipse, gradient, glow, line, polygon } from "./primitives.js";
import { at, groundPoint } from "./character-body.js";
import { petStyle, rgba, CHARACTER_COLORS as C } from "./character-style.js";

function petAt(anchor, lateral = 0, depth = 0, z = 0) {
  return at(anchor, { side: 1 }, lateral, depth, z);
}

function petShadow(ctx, anchor, style) {
  const ground = groundPoint(anchor);
  glow(ctx, ground.x, ground.y + 1.5, 13, 4.2, rgba(style.shadow, 0.12));
  ellipse(ctx, ground.x, ground.y + 1.5, 8.5, 2.5, rgba(style.shadow, 0.2));
}

function drawPetLegs(ctx, anchor, walking, phase, style) {
  const swing = walking ? phase * 0.018 : 0;
  for (const [lateral, offset] of [[-0.075, swing], [0.075, -swing]]) {
    const top = petAt(anchor, lateral, 0.01, 7);
    const foot = petAt(anchor, lateral + offset, 0.015, 1.8);
    line(ctx, [top, foot], style.shadow, 2.3);
    ellipse(ctx, foot.x, foot.y + 0.5, 2.1, 1.15, style.body);
  }
}

function drawCat(ctx, anchor, phase, walking, style) {
  const body = petAt(anchor, -0.01, 0, 7.5);
  const head = petAt(anchor, 0.105, -0.015, 11.4);
  const tailBase = petAt(anchor, -0.1, 0.035, 8.2);
  line(ctx, [tailBase, petAt(anchor, -0.18, 0.02, 11), petAt(anchor, -0.2, -0.015, 14)], style.body, 2.5);
  ellipse(ctx, body.x, body.y, 7.2, 4.1, gradient(ctx, body.x - 6, body.y - 4, body.x + 6, body.y + 4, [
    [0, style.light], [0.65, style.body], [1, style.shadow],
  ]));
  ellipse(ctx, body.x - 2.7, body.y - 1.6, 2.1, 1.1, rgba(style.light, 0.5));
  drawPetLegs(ctx, anchor, walking, phase, style);
  ellipse(ctx, head.x, head.y, 5.3, 4.7, style.body);
  polygon(ctx, [
    { x: head.x - 4.5, y: head.y - 2.5 }, { x: head.x - 3.6, y: head.y - 7.2 },
    { x: head.x - 0.9, y: head.y - 3.9 },
  ], style.shadow);
  polygon(ctx, [
    { x: head.x + 1.4, y: head.y - 3.9 }, { x: head.x + 4.1, y: head.y - 7.1 },
    { x: head.x + 4.7, y: head.y - 1.9 },
  ], style.body);
  ellipse(ctx, head.x - 1.8, head.y - 0.6, 0.75, 1.05, style.eye);
  ellipse(ctx, head.x + 1.9, head.y - 0.6, 0.75, 1.05, style.eye);
  ellipse(ctx, head.x + 0.3, head.y + 1.5, 0.7, 0.55, style.nose);
  line(ctx, [{ x: head.x + 0.3, y: head.y + 2 }, { x: head.x - 1.2, y: head.y + 2.8 }], rgba(C.ivoryLight, 0.68), 0.55);
  line(ctx, [{ x: head.x + 0.3, y: head.y + 2 }, { x: head.x + 1.8, y: head.y + 2.6 }], rgba(C.ivoryLight, 0.68), 0.55);
  line(ctx, [{ x: head.x - 2, y: head.y + 1.4 }, { x: head.x - 5.5, y: head.y + 0.8 }], rgba(style.light, 0.8), 0.55);
  line(ctx, [{ x: head.x - 1.8, y: head.y + 2.4 }, { x: head.x - 5.2, y: head.y + 2.8 }], rgba(style.light, 0.8), 0.55);
}

function drawDog(ctx, anchor, phase, walking, style) {
  const body = petAt(anchor, -0.01, 0, 7.4);
  const head = petAt(anchor, 0.105, -0.015, 11.1);
  const tailBase = petAt(anchor, -0.1, 0.035, 8.4);
  line(ctx, [tailBase, petAt(anchor, -0.17, 0.01, 10.7), petAt(anchor, -0.19, -0.01, 12.5)], style.body, 2.8);
  ellipse(ctx, body.x, body.y, 7.6, 4.3, gradient(ctx, body.x - 7, body.y - 4, body.x + 6, body.y + 4, [
    [0, style.light], [0.58, style.body], [1, style.shadow],
  ]));
  ellipse(ctx, body.x - 2.8, body.y - 1.7, 2.3, 1.2, rgba(style.light, 0.5));
  drawPetLegs(ctx, anchor, walking, phase, style);
  ellipse(ctx, head.x, head.y, 5.6, 4.8, style.light);
  ellipse(ctx, head.x + 2.4, head.y + 0.6, 3, 3.4, style.body);
  ellipse(ctx, head.x - 4.2, head.y - 1.4, 2.4, 4.1, style.shadow);
  ellipse(ctx, head.x + 4.1, head.y - 1.2, 2.3, 4, style.shadow);
  ellipse(ctx, head.x + 1.4, head.y - 0.8, 0.7, 0.9, style.eye);
  ellipse(ctx, head.x + 3.7, head.y - 0.5, 0.65, 0.85, style.eye);
  ellipse(ctx, head.x + 2.9, head.y + 1.7, 1.1, 0.8, style.nose);
  line(ctx, [{ x: head.x + 2.9, y: head.y + 2.3 }, { x: head.x + 2.9, y: head.y + 3.2 }], rgba(C.ivoryLight, 0.62), 0.65);
}

export function drawDetailedPet(ctx, { x, y, type = "cat", time = 0, walking = false } = {}) {
  if (!ctx || !Number.isFinite(x) || !Number.isFinite(y)) return;
  const style = petStyle(type);
  const safeTime = Number.isFinite(time) ? time : 0;
  const phase = walking ? Math.sin(safeTime * 8.2) : 0;
  const ground = groundPoint({ x, y });
  petShadow(ctx, { x, y }, style);
  if (walking) {
    glow(ctx, ground.x, ground.y - 8, 10, 5, rgba(style.light, 0.05));
  }
  if (type === "dog") drawDog(ctx, { x, y }, phase, walking, style);
  else drawCat(ctx, { x, y }, phase, walking, style);
}
