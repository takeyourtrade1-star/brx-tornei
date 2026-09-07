import { ellipse, gradient, glow, line, polygon, roundRect } from "./primitives.js";
import { createCharacterMotion } from "./character-motion.js";
import { CHARACTER_COLORS as C, rgba } from "./character-style.js";

const LATERAL_PX = 64;
const DEPTH_PX = 32;

/** Compatibilità per gli animali che stanno migrando al proprio asse. */
export function at(anchor, direction, lateral = 0, depth = 0, z = 0) {
  return { x: anchor.x + direction.side * lateral * LATERAL_PX, y: anchor.y + depth * DEPTH_PX - z };
}

/** Punto in pixel del personaggio: x è relativo al suo lato destro e z sale. */
export function pixelAt(anchor, direction, lateral = 0, z = 0) {
  return { x: anchor.x + direction.side * lateral, y: anchor.y - z };
}

export function groundPoint(anchor) {
  return { x: anchor.x, y: anchor.y };
}

export function poseMetrics(time = 0, walking = false, seated = false, reducedMotion = false, motionTime = time) {
  const motion = createCharacterMotion(time, { walking, seated, reducedMotion, motionTime });
  return {
    ...motion,
    torsoBase: 13,
    torsoTop: seated ? 28 : 29,
    headZ: seated ? 36 : 37,
  };
}

function tone(color, ghost, alpha = 1) {
  return ghost ? rgba(C.haze, alpha) : alpha === 1 ? color : rgba(color, alpha);
}

export function drawCharacterShadow(ctx, anchor, ghost = false) {
  const ground = groundPoint(anchor);
  glow(ctx, ground.x, ground.y + 2, 15, 4.6, tone(C.denimShadow, ghost, 0.12));
  ellipse(ctx, ground.x, ground.y + 1.7, 9.4, 2.7, tone(C.denimShadow, ghost, 0.18));
}

function drawShoe(ctx, anchor, direction, lateral, lift, ghost) {
  const foot = pixelAt(anchor, direction, lateral, 1.1 + lift);
  const sole = tone(C.sole, ghost, 0.92);
  const shoe = tone(C.denim, ghost, 0.96);
  roundRect(ctx, foot.x - 4.2, foot.y - 1.9, 8.3, 3.8, 1.7, sole);
  ellipse(ctx, pixelAt(anchor, direction, lateral + 0.75, 1.45 + lift).x, foot.y - 0.65, 3.45, 1.45, shoe);
  line(ctx, [
    { x: foot.x - 3.1, y: foot.y + 1.05 },
    { x: foot.x + 3.3, y: foot.y + 1.05 },
  ], tone(C.ivoryLight, ghost, 0.72), 0.7);
  line(ctx, [
    { x: foot.x - 1.4, y: foot.y - 1.5 },
    { x: foot.x + 0.9, y: foot.y - 1.5 },
  ], tone(C.ivoryLight, ghost, 0.46), 0.65);
}

function drawStandingLeg(ctx, anchor, direction, lateral, stride, lift, ghost) {
  const hip = pixelAt(anchor, direction, lateral, 13 + lift);
  const ankle = pixelAt(anchor, direction, lateral + stride, 3.3 + lift);
  line(ctx, [hip, ankle], tone(C.denimShadow, ghost, 0.96), 4.7);
  line(ctx, [
    pixelAt(anchor, direction, lateral - 0.7, 12 + lift),
    pixelAt(anchor, direction, lateral + stride - 0.4, 5.1 + lift),
  ], tone(C.denimLight, ghost, 0.32), 0.8);
  drawShoe(ctx, anchor, direction, lateral + stride, lift, ghost);
}

function drawSeatedLeg(ctx, anchor, direction, lateral, ghost) {
  const hip = pixelAt(anchor, direction, lateral, 13);
  const knee = pixelAt(anchor, direction, lateral * 1.9, 7.2);
  const foot = pixelAt(anchor, direction, lateral * 2.1, 1.2);
  line(ctx, [hip, knee, foot], tone(C.denimShadow, ghost, 0.96), 4.8);
  line(ctx, [hip, knee], tone(C.denimLight, ghost, 0.25), 0.8);
  drawShoe(ctx, anchor, direction, lateral * 2.1, 0, ghost);
}

function drawLegs(ctx, anchor, direction, metrics, seated, ghost) {
  if (seated) {
    drawSeatedLeg(ctx, anchor, direction, -2.6, ghost);
    drawSeatedLeg(ctx, anchor, direction, 2.6, ghost);
    return;
  }
  drawStandingLeg(ctx, anchor, direction, -2.7, metrics.leftStride, metrics.leftLift, ghost);
  drawStandingLeg(ctx, anchor, direction, 2.7, metrics.rightStride, metrics.rightLift, ghost);
}

function drawArm(ctx, anchor, direction, style, metrics, far, ghost) {
  const side = far ? -1 : 1;
  const swing = metrics.armSwing * (far ? -0.45 : 0.45);
  const shoulder = pixelAt(anchor, direction, side * 5.6 + swing * 0.2, 25.7 + metrics.lift);
  const elbow = pixelAt(anchor, direction, side * 7.05 + swing, 20.4 + metrics.lift);
  const hand = pixelAt(anchor, direction, side * 8.45 + swing * 0.55, 15.5 + metrics.lift + (far ? swing : -swing) * 0.35);
  const skin = far || direction.back ? C.skinShadow : C.skin;
  const skinLight = far || direction.back ? C.skin : C.skinLight;
  const sleeve = far ? style.outfit.shadow : style.outfit.base;
  const cuffZ = style.outfit.kind === "jersey" ? 21.6 : 17.2;
  const cuff = pixelAt(anchor, direction, side * 7.05 + swing * 0.72, cuffZ + metrics.lift);

  if (style.outfit.kind === "tank") {
    line(ctx, [shoulder, elbow, hand], tone(skin, ghost, 0.98), 4.25);
    line(ctx, [shoulder, elbow], tone(skinLight, ghost, 0.34), 0.75);
  } else {
    line(ctx, [shoulder, cuff], tone(sleeve, ghost, 0.98), 5.05);
    line(ctx, [cuff, hand], tone(skin, ghost, 0.98), 3.75);
    line(ctx, [
      pixelAt(anchor, direction, side * 6.75 + swing * 0.62, cuffZ + metrics.lift),
      pixelAt(anchor, direction, side * 7.35 + swing * 0.82, cuffZ + metrics.lift),
    ], tone(style.outfit.light, ghost, 0.58), 0.9);
  }
  ellipse(ctx, hand.x, hand.y, 2.05, 2.25, tone(skinLight, ghost, 0.98));
  ellipse(ctx, hand.x - direction.side * 0.45, hand.y - 0.55, 0.65, 0.6, tone(C.ivoryLight, ghost, 0.18));
}

function drawTorso(ctx, anchor, direction, style, metrics, ghost) {
  const bottom = metrics.torsoBase + metrics.lift;
  const top = metrics.torsoTop + metrics.lift;
  const body = [
    pixelAt(anchor, direction, -6.8, bottom),
    pixelAt(anchor, direction, 6.8, bottom),
    pixelAt(anchor, direction, 7, top - 2.2),
    pixelAt(anchor, direction, 4.8, top),
    pixelAt(anchor, direction, -4.8, top),
    pixelAt(anchor, direction, -7, top - 2.2),
  ];
  const fill = ghost ? tone(C.haze, true, 0.72) : gradient(ctx, body[4].x, body[4].y, body[0].x, body[0].y, [
    [0, style.outfit.light], [0.52, style.outfit.base], [1, style.outfit.shadow],
  ]);
  polygon(ctx, body, fill);
  polygon(ctx, [body[1], body[2], body[3], body[4]], tone(style.outfit.shadow, ghost, 0.32));
  line(ctx, [body[0], body[1]], tone(C.ivoryLight, ghost, 0.25), 0.75);
  return { top, bottom };
}

function drawCollar(ctx, anchor, direction, style, top, ghost) {
  const light = tone(style.outfit.light, ghost, 0.95);
  const shadow = tone(style.outfit.shadow, ghost, 0.95);
  polygon(ctx, [
    pixelAt(anchor, direction, -4.3, top - 0.1),
    pixelAt(anchor, direction, -0.45, top - 0.2),
    pixelAt(anchor, direction, 0, top - 2.1),
    pixelAt(anchor, direction, -2.4, top - 1.2),
  ], light);
  polygon(ctx, [
    pixelAt(anchor, direction, 4.3, top - 0.1),
    pixelAt(anchor, direction, 0.45, top - 0.2),
    pixelAt(anchor, direction, 0, top - 2.1),
    pixelAt(anchor, direction, 2.4, top - 1.2),
  ], shadow);
}

function drawOutfitDetails(ctx, anchor, direction, style, metrics, ghost) {
  const top = metrics.torsoTop + metrics.lift;
  const bottom = metrics.torsoBase + metrics.lift;
  const p = (x, z) => pixelAt(anchor, direction, x, z + metrics.lift);
  const seam = tone(style.outfit.shadow, ghost, 0.78);
  const accent = tone(style.outfit.accent, ghost, 0.9);
  if (direction.back) {
    if (style.outfit.kind === "hoodie") ellipse(ctx, p(0, top - 0.5).x, p(0, top - 0.5).y, 5.3, 2.2, seam);
    if (style.outfit.kind === "jacket") line(ctx, [p(0, top - 1), p(0, bottom + 1)], seam, 0.9);
    if (style.outfit.kind === "jersey") line(ctx, [p(-5.1, 23.5), p(5.1, 23.5)], tone(style.outfit.stripe, ghost, 0.75), 2);
    return;
  }
  drawCollar(ctx, anchor, direction, style, top, ghost);
  if (style.outfit.kind === "tank") {
    line(ctx, [p(-3.9, top - 0.2), p(-3.1, 25.8)], tone(style.outfit.light, ghost, 0.78), 1.35);
    line(ctx, [p(3.9, top - 0.2), p(3.1, 25.8)], tone(style.outfit.shadow, ghost, 0.78), 1.35);
    const pendant = p(0, 23.2);
    line(ctx, [p(-1.2, 26.6), pendant, p(1.2, 26.6)], accent, 0.65);
    ellipse(ctx, pendant.x, pendant.y, 1.35, 1.35, accent);
  }
  if (style.outfit.kind === "hoodie") {
    ellipse(ctx, p(0, top - 0.4).x, p(0, top - 0.4).y, 5.1, 2.1, tone(style.outfit.shadow, ghost, 0.72));
    line(ctx, [p(-1.1, top - 1.3), p(-0.75, 24.8)], accent, 0.7);
    line(ctx, [p(1.1, top - 1.3), p(0.75, 24.8)], accent, 0.7);
    const pocket = p(0, 19.2);
    roundRect(ctx, pocket.x - 4.1, pocket.y - 1.2, 8.2, 2.8, 1.3, tone(style.outfit.shadow, ghost, 0.4));
    line(ctx, [p(-3.5, 18.9), p(3.5, 18.9)], tone(style.outfit.light, ghost, 0.3), 0.7);
  }
  if (style.outfit.kind === "jacket") {
    polygon(ctx, [p(-3.7, top - 0.2), p(-0.45, top - 3.8), p(-1.3, 23.1), p(-4.2, 26.2)], tone(style.outfit.inner, ghost, 0.92));
    polygon(ctx, [p(3.7, top - 0.2), p(0.45, top - 3.8), p(1.3, 23.1), p(4.2, 26.2)], tone(style.outfit.inner, ghost, 0.7));
    line(ctx, [p(0, top - 2), p(0, bottom + 1)], seam, 0.8);
    ellipse(ctx, p(0, 24.8).x, p(0, 24.8).y, 0.75, 0.75, accent);
    ellipse(ctx, p(0, 19.8).x, p(0, 19.8).y, 0.7, 0.7, accent);
  }
  if (style.outfit.kind === "shirt") {
    polygon(ctx, [p(-3.2, top - 0.2), p(-0.45, top - 3.3), p(-2.2, top - 4.9)], tone(style.outfit.light, ghost, 0.98));
    polygon(ctx, [p(3.2, top - 0.2), p(0.45, top - 3.3), p(2.2, top - 4.9)], tone(style.outfit.shadow, ghost, 0.7));
    line(ctx, [p(0, top - 3.1), p(0, bottom + 1)], seam, 0.7);
    for (const z of [25, 21, 17.5]) ellipse(ctx, p(0, z).x, p(0, z).y, 0.52, 0.52, accent);
  }
  if (style.outfit.kind === "jersey") {
    line(ctx, [p(-5.3, 25.3), p(5.3, 25.3)], tone(style.outfit.stripe, ghost, 0.88), 2.3);
    line(ctx, [p(-3.2, top - 0.4), p(-1.1, top - 3.1)], seam, 1);
    line(ctx, [p(3.2, top - 0.4), p(1.1, top - 3.1)], accent, 1);
    polygon(ctx, [p(-1.1, 22.8), p(1.1, 22.8), p(0.8, 21.2), p(0, 20.6), p(-0.8, 21.2)], accent);
  }
}

export function drawCharacterBody(ctx, anchor, style, direction, metrics, seated = false, ghost = false) {
  drawLegs(ctx, anchor, direction, metrics, seated, ghost);
  drawArm(ctx, anchor, direction, style, metrics, true, ghost);
  drawTorso(ctx, anchor, direction, style, metrics, ghost);
  drawOutfitDetails(ctx, anchor, direction, style, metrics, ghost);
  drawArm(ctx, anchor, direction, style, metrics, false, ghost);
}
