import { ellipse, gradient, glow, line, polygon, roundRect } from "./primitives.js";
import { CHARACTER_COLORS as C, rgba } from "./character-style.js";

const LATERAL_PX = 64;
const DEPTH_PX = 32;

/** x/y sono già pixel del mondo: qui si aggiungono gli offset del toy. */
export function at(anchor, direction, lateral = 0, depth = 0, z = 0) {
  return { x: anchor.x + direction.side * lateral * LATERAL_PX, y: anchor.y + depth * DEPTH_PX - z };
}

export function groundPoint(anchor) {
  return { x: anchor.x, y: anchor.y };
}

export function poseMetrics(time = 0, walking = false, seated = false) {
  const phase = walking ? Math.sin(time * 7.4) : 0;
  return {
    phase,
    lift: seated ? 0 : walking ? Math.abs(phase) * 1.15 : Math.sin(time * 1.8) * 0.28,
    torsoBase: seated ? 10 : 14,
    torsoTop: seated ? 27 : 32,
    headZ: seated ? 34 : 37,
  };
}

export function drawCharacterShadow(ctx, anchor, ghost = false) {
  const ground = groundPoint(anchor);
  glow(ctx, ground.x, ground.y + 2, 18, 6, rgba(ghost ? C.haze : C.denimShadow, ghost ? 0.15 : 0.12));
  ellipse(ctx, ground.x, ground.y + 2, 11.5, 3.2, rgba(ghost ? C.haze : C.denimShadow, ghost ? 0.12 : 0.2));
}

function drawShoe(ctx, anchor, direction, lateral, depth, lift, ghost) {
  const top = [
    at(anchor, direction, lateral - 0.055, depth - 0.025, 3 + lift),
    at(anchor, direction, lateral + 0.06, depth - 0.025, 3 + lift),
    at(anchor, direction, lateral + 0.065, depth + 0.065, 1 + lift),
    at(anchor, direction, lateral - 0.05, depth + 0.065, 1 + lift),
  ];
  polygon(ctx, top, ghost ? rgba(C.haze, 0.75) : gradient(ctx, top[0].x, top[0].y, top[2].x, top[2].y, [
    [0, C.denimLight], [0.55, C.denim], [1, C.denimShadow],
  ]));
  polygon(ctx, [top[3], top[2], at(anchor, direction, lateral + 0.055, depth + 0.08, 0 + lift), at(anchor, direction, lateral - 0.05, depth + 0.08, 0 + lift)], ghost ? rgba(C.ivory, 0.7) : C.sole);
  const toe = at(anchor, direction, lateral + 0.012, depth + 0.072, 1.55 + lift);
  ellipse(ctx, toe.x, toe.y, 3.65, 2.05, ghost ? rgba(C.haze, 0.66) : gradient(ctx, toe.x - 3, toe.y - 2, toe.x + 3, toe.y + 2, [
    [0, C.denimLight], [0.62, C.denim], [1, C.denimShadow],
  ]));
  ellipse(ctx, toe.x - direction.side * 1.25, toe.y - 0.72, 1.3, 0.58, ghost ? rgba(C.ivoryLight, 0.36) : rgba(C.ivoryLight, 0.66));
  line(ctx, [top[3], top[2]], ghost ? rgba(C.ivoryLight, 0.65) : rgba(C.ivoryLight, 0.9), 0.85);
}

function drawStandingLeg(ctx, anchor, direction, lateral, stride, metrics, ghost) {
  const { lift, torsoBase } = metrics;
  const hip = at(anchor, direction, lateral, 0.015, torsoBase + 2 + lift);
  const ankle = at(anchor, direction, lateral + stride * 0.022, -stride * 0.018, 4 + lift);
  const leg = [
    at(anchor, direction, lateral - 0.06, 0.015, torsoBase + 2 + lift),
    at(anchor, direction, lateral + 0.025, 0.015, torsoBase + 2 + lift),
    at(anchor, direction, lateral + stride * 0.022 + 0.028, -stride * 0.018, 4 + lift),
    at(anchor, direction, lateral + stride * 0.022 - 0.045, -stride * 0.018, 4 + lift),
  ];
  const fill = ghost ? rgba(C.haze, 0.7) : gradient(ctx, hip.x, hip.y - 13, ankle.x, ankle.y, [
    [0, C.denimLight], [0.5, C.denim], [1, C.denimShadow],
  ]);
  polygon(ctx, leg, fill);
  line(ctx, [leg[0], leg[3]], ghost ? rgba(C.ivoryLight, 0.35) : rgba(C.ivoryLight, 0.2), 0.65);
  drawShoe(ctx, anchor, direction, lateral + stride * 0.022, -stride * 0.018, lift, ghost);
}

function drawSeatedLeg(ctx, anchor, direction, lateral, metrics, ghost) {
  const { lift } = metrics;
  const hip = at(anchor, direction, lateral * 0.7, 0.015, 17 + lift);
  const knee = at(anchor, direction, lateral * 1.2, -0.09, 8 + lift);
  const foot = at(anchor, direction, lateral * 1.2, -0.14, 3 + lift);
  line(ctx, [hip, knee], ghost ? rgba(C.haze, 0.75) : C.denim, 5.2);
  line(ctx, [knee, foot], ghost ? rgba(C.haze, 0.68) : C.denimShadow, 4.4);
  drawShoe(ctx, anchor, direction, lateral * 1.2, -0.14, lift, ghost);
}

function drawLegs(ctx, anchor, direction, metrics, seated, ghost) {
  if (seated) {
    drawSeatedLeg(ctx, anchor, direction, -0.07, metrics, ghost);
    drawSeatedLeg(ctx, anchor, direction, 0.07, metrics, ghost);
    return;
  }
  drawStandingLeg(ctx, anchor, direction, -0.07, metrics.phase, metrics, ghost);
  drawStandingLeg(ctx, anchor, direction, 0.07, -metrics.phase, metrics, ghost);
}

function drawArm(ctx, anchor, direction, style, metrics, lateral, far, ghost) {
  const { lift, phase, torsoTop } = metrics;
  const depth = far ? 0.055 : -0.035;
  const swing = (far ? -phase : phase) * 0.012;
  const shoulder = at(anchor, direction, lateral, depth, torsoTop - 1 + lift);
  const elbow = at(anchor, direction, lateral + swing, depth + 0.01, 24 + lift);
  const hand = at(anchor, direction, lateral - swing * 0.5, depth - 0.005, 15 + lift);
  const shade = far || direction.back ? style.outfit.shadow : style.outfit.base;
  const skin = far || direction.back ? C.skinShadow : C.skin;
  const skinLight = far || direction.back ? C.skin : C.skinLight;
  const sleeveEnd = style.outfit.kind === "tank" ? null : style.outfit.kind === "jersey" ? 24 : 21;
  ellipse(ctx, shoulder.x, shoulder.y, 3.35, 2.7, ghost ? rgba(C.haze, 0.62) : shade);
  if (sleeveEnd === null) {
    line(ctx, [shoulder, elbow, hand], ghost ? rgba(C.haze, 0.65) : skin, 5.25);
    line(ctx, [shoulder, elbow], ghost ? rgba(C.ivoryLight, 0.3) : rgba(C.skinLight, 0.35), 0.8);
  } else {
    const cuff = at(anchor, direction, lateral + swing * 0.55, depth + 0.005, sleeveEnd + lift);
    line(ctx, [shoulder, cuff], ghost ? rgba(C.haze, 0.7) : shade, 6);
    line(ctx, [cuff, hand], ghost ? rgba(C.haze, 0.55) : skin, 4.35);
    line(ctx, [shoulder, cuff], ghost ? rgba(C.ivoryLight, 0.22) : rgba(style.outfit.light, 0.45), 0.8);
  }
  ellipse(ctx, elbow.x, elbow.y, 2.25, 2.1, ghost ? rgba(C.haze, 0.48) : rgba(skin, 0.82));
  ellipse(ctx, hand.x, hand.y, 2.25, 2.05, ghost ? rgba(C.haze, 0.62) : skinLight);
}

function drawTorso(ctx, anchor, direction, style, metrics, ghost) {
  const { lift, torsoBase, torsoTop } = metrics;
  const body = [
    at(anchor, direction, -0.19, 0.02, torsoBase + lift),
    at(anchor, direction, 0.19, 0.02, torsoBase + lift),
    at(anchor, direction, 0.17, 0, torsoTop - 2 + lift),
    at(anchor, direction, 0.1, 0, torsoTop + lift),
    at(anchor, direction, -0.1, 0, torsoTop + lift),
    at(anchor, direction, -0.17, 0, torsoTop - 2 + lift),
  ];
  const top = body[3];
  const bottom = body[0];
  const fill = ghost ? rgba(C.haze, 0.72) : gradient(ctx, top.x, top.y, bottom.x, bottom.y, [
    [0, style.outfit.light], [0.45, style.outfit.base], [1, style.outfit.shadow],
  ]);
  polygon(ctx, body, fill);
  ellipse(ctx, body[3].x, body[3].y + 1.3, 3.6, 2.65, ghost ? rgba(C.haze, 0.62) : rgba(style.outfit.light, 0.9));
  ellipse(ctx, body[4].x, body[4].y + 1.3, 3.6, 2.65, ghost ? rgba(C.haze, 0.4) : rgba(style.outfit.base, 0.92));
  polygon(ctx, [body[1], body[2], body[3], body[4]], ghost ? rgba(C.denimShadow, 0.18) : rgba(style.outfit.shadow, 0.42));
  line(ctx, [body[0], body[1]], ghost ? rgba(C.ivoryLight, 0.28) : rgba(C.ivoryLight, 0.32), 0.8);
  return body;
}

function drawOutfitDetails(ctx, anchor, direction, style, metrics, ghost) {
  const { lift, torsoBase, torsoTop } = metrics;
  const atZ = (lateral, depth, z) => at(anchor, direction, lateral, depth, z + lift);
  const ink = ghost ? rgba(C.ivoryLight, 0.52) : style.outfit.accent;
  const seam = ghost ? rgba(C.ivoryLight, 0.35) : rgba(style.outfit.shadow, 0.8);
  const neck = atZ(0, -0.02, torsoTop + 1);
  if (direction.back) {
    if (style.outfit.kind === "hoodie") ellipse(ctx, neck.x, neck.y + 1, 5.3, 2.1, ghost ? rgba(C.haze, 0.35) : rgba(style.outfit.shadow, 0.62));
    if (style.outfit.kind === "jacket") line(ctx, [atZ(0, 0, torsoTop - 4), atZ(0, 0.01, torsoBase + 1)], seam, 1.1);
    if (style.outfit.kind === "jersey") line(ctx, [atZ(-0.145, 0, 26), atZ(0.145, 0, 26)], ink, 2.2);
    return;
  }
  if (style.outfit.kind === "tank") {
    line(ctx, [atZ(-0.09, -0.03, torsoTop), atZ(-0.12, -0.02, 28)], ghost ? rgba(C.haze, 0.5) : style.outfit.light, 1.7);
    line(ctx, [atZ(0.09, -0.03, torsoTop), atZ(0.12, -0.02, 28)], ghost ? rgba(C.haze, 0.32) : style.outfit.shadow, 1.7);
    const pendant = atZ(0, -0.055, 25.4);
    line(ctx, [atZ(-0.055, -0.04, 30), pendant], ink, 0.75);
    line(ctx, [atZ(0.055, -0.04, 30), pendant], ink, 0.75);
    ellipse(ctx, pendant.x, pendant.y, 1.6, 1.8, ghost ? rgba(C.haze, 0.58) : style.outfit.accent);
    ellipse(ctx, pendant.x - 0.45, pendant.y - 0.55, 0.45, 0.55, rgba(C.ivoryLight, ghost ? 0.35 : 0.72));
  }
  if (style.outfit.kind === "hoodie") {
    ellipse(ctx, neck.x, neck.y + 1, 5.1, 2, ghost ? rgba(C.haze, 0.4) : rgba(style.outfit.shadow, 0.65));
    line(ctx, [atZ(-0.045, -0.055, torsoTop), atZ(-0.035, -0.05, 26)], ink, 0.8);
    line(ctx, [atZ(0.045, -0.055, torsoTop), atZ(0.035, -0.05, 26)], ink, 0.8);
    const pocket = atZ(0, -0.045, 20);
    roundRect(ctx, pocket.x - 4.5, pocket.y - 1.2, 9, 3.3, 1.5, ghost ? rgba(C.haze, 0.22) : rgba(style.outfit.shadow, 0.42));
  }
  if (style.outfit.kind === "jacket") {
    const inner = [atZ(-0.055, -0.055, torsoTop - 1), atZ(0.055, -0.055, torsoTop - 1), atZ(0.05, -0.055, torsoBase + 1), atZ(-0.05, -0.055, torsoBase + 1)];
    polygon(ctx, inner, ghost ? rgba(C.haze, 0.36) : style.outfit.inner);
    line(ctx, [atZ(0, -0.061, torsoTop - 1), atZ(0, -0.061, torsoBase + 1)], seam, 0.75);
    line(ctx, [atZ(-0.105, -0.05, torsoTop - 1), atZ(-0.045, -0.06, torsoTop - 4)], ink, 1.25);
    line(ctx, [atZ(0.105, -0.05, torsoTop - 1), atZ(0.045, -0.06, torsoTop - 4)], ink, 1.25);
    ellipse(ctx, atZ(0, -0.065, 27).x, atZ(0, -0.065, 27).y, 0.9, 0.9, ink);
    ellipse(ctx, atZ(0, -0.065, 21).x, atZ(0, -0.065, 21).y, 0.75, 0.75, ink);
  }
  if (style.outfit.kind === "shirt") {
    polygon(ctx, [atZ(-0.09, -0.05, torsoTop), atZ(-0.015, -0.065, torsoTop - 4), atZ(-0.08, -0.06, torsoTop - 6)], ghost ? rgba(C.haze, 0.5) : style.outfit.light);
    polygon(ctx, [atZ(0.09, -0.05, torsoTop), atZ(0.015, -0.065, torsoTop - 4), atZ(0.08, -0.06, torsoTop - 6)], ghost ? rgba(C.haze, 0.33) : style.outfit.shadow);
    line(ctx, [atZ(0, -0.066, torsoTop - 4), atZ(0, -0.066, torsoBase + 1)], seam, 0.7);
    for (const z of [27, 23, 19]) {
      const button = atZ(0, -0.07, z);
      ellipse(ctx, button.x, button.y, 0.65, 0.65, ink);
    }
  }
  if (style.outfit.kind === "jersey") {
    line(ctx, [atZ(-0.15, -0.055, 27), atZ(0.15, -0.055, 27)], ghost ? rgba(C.haze, 0.42) : style.outfit.stripe, 2.4);
    line(ctx, [atZ(-0.12, -0.06, 29), atZ(-0.065, -0.06, torsoTop - 1)], seam, 1.2);
    line(ctx, [atZ(0.12, -0.06, 29), atZ(0.065, -0.06, torsoTop - 1)], ink, 1.2);
    const badge = atZ(0, -0.07, 23.3);
    polygon(ctx, [atZ(-0.025, -0.07, 24.3), atZ(0.025, -0.07, 24.3), atZ(0.04, -0.07, 23.2), atZ(0, -0.07, 22.5), atZ(-0.04, -0.07, 23.2)], ghost ? rgba(C.haze, 0.58) : style.outfit.accent);
    ellipse(ctx, badge.x, badge.y, 0.38, 0.38, ghost ? rgba(C.ivoryLight, 0.34) : C.ivoryLight);
  }
}

export function drawCharacterBody(ctx, anchor, style, direction, metrics, seated = false, ghost = false) {
  drawLegs(ctx, anchor, direction, metrics, seated, ghost);
  drawArm(ctx, anchor, direction, style, metrics, -0.17, true, ghost);
  drawTorso(ctx, anchor, direction, style, metrics, ghost);
  drawOutfitDetails(ctx, anchor, direction, style, metrics, ghost);
  drawArm(ctx, anchor, direction, style, metrics, 0.17, false, ghost);
}
