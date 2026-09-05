import { ellipse, gradient, line, polygon, roundRect } from "./primitives.js";
import { at } from "./character-body.js";
import { CHARACTER_COLORS as C, rgba } from "./character-style.js";

function hairBackplate(ctx, center, hair, direction) {
  const side = direction.side;
  const base = hair.base;
  const shadow = hair.shadow;
  if (hair.cut === "pony") ellipse(ctx, center.x + side * 8, center.y + 2, 4.2, 7.3, shadow);
  if (hair.cut === "long") {
    ellipse(ctx, center.x - 7.2, center.y + 4.2, 3.6, 9.4, shadow);
    ellipse(ctx, center.x + 7.2, center.y + 4.2, 3.6, 9.4, base);
  }
  if (hair.cut === "bob") {
    roundRect(ctx, center.x - 8.8, center.y - 1, 17.6, 11, 4.2, shadow);
  }
  if (hair.cut === "curls") {
    ellipse(ctx, center.x - 7.2, center.y - 1, 3.2, 2, shadow);
    ellipse(ctx, center.x + 7.2, center.y - 1, 3.2, 2, base);
  }
  ellipse(ctx, center.x, center.y - 3.6, 9.4, 5.9, gradient(ctx, center.x - 8, center.y - 8, center.x + 8, center.y + 3, [
    [0, hair.light], [0.42, base], [1, shadow],
  ]));
}

function hairCap(ctx, center, hair, direction) {
  const { base, light, shadow, cut } = hair;
  ellipse(ctx, center.x, center.y - 4.8, 9.35, cut === "curls" ? 4.35 : 4.4, gradient(ctx, center.x - 8, center.y - 9, center.x + 8, center.y, [
    [0, light], [0.45, base], [1, shadow],
  ]));
  if (cut === "crop") {
    polygon(ctx, [
      { x: center.x - 8, y: center.y - 3.7 }, { x: center.x - 5, y: center.y + 0.2 },
      { x: center.x - 1, y: center.y - 1.4 }, { x: center.x + 2, y: center.y + 0.4 },
      { x: center.x + 5, y: center.y - 1.4 }, { x: center.x + 8, y: center.y - 3.7 },
    ], base);
  }
  if (cut === "buzz") {
    for (const dx of [-7, -4.2, -1.3, 1.8, 4.7, 7]) {
      line(ctx, [{ x: center.x + dx, y: center.y - 6.7 }, { x: center.x + dx - 0.5, y: center.y - 5.3 }], rgba(light, 0.68), 0.75);
    }
    line(ctx, [{ x: center.x - 7.5, y: center.y - 1.3 }, { x: center.x + 7.4, y: center.y - 1.3 }], rgba(shadow, 0.52), 0.65);
  }
  if (cut === "curls") {
    for (const dx of [-6.8, -3, 1, 5.2]) ellipse(ctx, center.x + dx, center.y - 5 + Math.abs(dx) * 0.13, 2.6, 2.4, dx > 0 ? light : base);
    for (const dx of [-6.4, -2.1, 2.8, 6.6]) ellipse(ctx, center.x + dx, center.y - 4.5, 2, 2, shadow);
  }
  if (cut === "bob") {
    polygon(ctx, [
      { x: center.x - 8, y: center.y - 3 }, { x: center.x - 3, y: center.y + 0.5 },
      { x: center.x + 4, y: center.y - 1 }, { x: center.x + 8, y: center.y - 3 },
    ], base);
    line(ctx, [{ x: center.x - 6, y: center.y - 5.5 }, { x: center.x - 1, y: center.y - 6.2 }, { x: center.x + 4, y: center.y - 5 }], light, 1.1);
    ellipse(ctx, center.x + direction.side * 5.8, center.y - 5.3, 1.1, 1.1, C.amber);
  }
  if (cut === "pony") {
    ellipse(ctx, center.x + direction.side * 8.3, center.y + 1.1, 4, 7.3, base);
    ellipse(ctx, center.x + direction.side * 8.3, center.y - 3.5, 1.7, 1.5, C.amber);
    line(ctx, [{ x: center.x - 6.8, y: center.y - 5.1 }, { x: center.x - 1, y: center.y - 6.1 }, { x: center.x + 4.8, y: center.y - 5.2 }], light, 1.15);
  }
  if (cut === "long") {
    line(ctx, [{ x: center.x - 6.5, y: center.y - 5.3 }, { x: center.x - 1, y: center.y - 6.1 }, { x: center.x + 5.8, y: center.y - 5 }], light, 1.15);
    line(ctx, [{ x: center.x + direction.side * 7.2, y: center.y - 1 }, { x: center.x + direction.side * 7.6, y: center.y + 8 }], rgba(light, 0.6), 0.8);
  }
  line(ctx, [{ x: center.x - 6.8, y: center.y - 7 }, { x: center.x - 2.5, y: center.y - 7.9 }], rgba(light, 0.65), 0.75);
}

function drawBackHead(ctx, center, hair) {
  const mass = gradient(ctx, center.x - 9, center.y - 10, center.x + 9, center.y + 9, [
    [0, hair.light], [0.32, hair.base], [0.78, hair.shadow], [1, hair.shadow],
  ]);
  ellipse(ctx, center.x, center.y, 8.8, 9.4, rgba(hair.shadow, 0.72));
  ellipse(ctx, center.x, center.y - 2.9, 9.35, 6.8, mass);
  ellipse(ctx, center.x - 4.2, center.y - 5.4, 2.2, 1.2, rgba(hair.light, 0.38));
  if (hair.cut === "buzz") {
    for (const dx of [-7, -4, -1, 2, 5, 7]) line(ctx, [{ x: center.x + dx, y: center.y - 6 }, { x: center.x + dx - 0.4, y: center.y - 4.7 }], rgba(hair.light, 0.65), 0.65);
    line(ctx, [{ x: center.x - 7.3, y: center.y - 0.7 }, { x: center.x + 7.3, y: center.y - 0.7 }], rgba(hair.shadow, 0.6), 0.7);
  }
  if (hair.cut === "curls") {
    for (const [dx, tone] of [[-6.8, hair.shadow], [-4.1, hair.base], [-1.1, hair.light], [2.1, hair.base], [5, hair.shadow], [7, hair.base]]) {
      ellipse(ctx, center.x + dx, center.y + 1.1, 2.8, 3.7, tone);
      ellipse(ctx, center.x + dx - 0.55, center.y - 0.5, 0.65, 0.75, rgba(hair.light, 0.5));
    }
  }
  if (hair.cut === "long" || hair.cut === "bob") {
    ellipse(ctx, center.x - 7, center.y + 3, 3.6, 8.4, hair.base);
    ellipse(ctx, center.x + 7, center.y + 3, 3.6, 8.4, hair.shadow);
  }
  if (hair.cut === "pony") ellipse(ctx, center.x + 8, center.y + 2, 4.2, 7.1, hair.base);
  line(ctx, [{ x: center.x - 5.4, y: center.y - 5 }, { x: center.x, y: center.y - 6.1 }, { x: center.x + 4.5, y: center.y - 5.1 }], rgba(hair.light, 0.62), 1);
}

function drawFace(ctx, center, direction, blink) {
  const near = center.x + direction.side * 3.1;
  const far = center.x - direction.side * 2.4;
  const eyeY = center.y + 1.2;
  if (blink) {
    line(ctx, [{ x: far - direction.side * 1.1, y: eyeY }, { x: far + direction.side * 0.6, y: eyeY + 0.2 }], C.skinDeep, 0.8);
    line(ctx, [{ x: near - direction.side * 1.2, y: eyeY }, { x: near + direction.side * 1, y: eyeY + 0.2 }], C.skinDeep, 0.85);
  } else {
    ellipse(ctx, far, eyeY, 1.05, 1.35, C.eye);
    ellipse(ctx, near, eyeY, 1.25, 1.55, C.eye);
    ellipse(ctx, far - direction.side * 0.25, eyeY - 0.48, 0.35, 0.42, C.ivoryLight);
    ellipse(ctx, near - direction.side * 0.3, eyeY - 0.55, 0.4, 0.48, C.ivoryLight);
  }
  line(ctx, [{ x: far - direction.side * 1, y: center.y - 1.2 }, { x: far + direction.side * 0.7, y: center.y - 1.7 }], rgba(C.walnutShadow, 0.55), 0.7);
  line(ctx, [{ x: near - direction.side * 1.2, y: center.y - 1.3 }, { x: near + direction.side * 1, y: center.y - 1.8 }], rgba(C.walnutShadow, 0.6), 0.7);
  ellipse(ctx, center.x + direction.side * 0.8, center.y + 3.2, 0.8, 1.05, C.skinShadow);
  line(ctx, [{ x: center.x - direction.side * 2, y: center.y + 5.1 }, { x: center.x + direction.side * 1.9, y: center.y + 5.1 }], C.mouth, 0.75);
}

function drawHeadBase(ctx, center) {
  const face = gradient(ctx, center.x - 7, center.y - 8, center.x + 8, center.y + 9, [
    [0, C.skinLight], [0.5, C.skin], [1, C.skinShadow],
  ]);
  ellipse(ctx, center.x, center.y, 8.45, 9.15, face);
  ellipse(ctx, center.x + 5.2, center.y + 1.7, 3.2, 6.2, rgba(C.skinShadow, 0.3));
}

export function drawDetailedHead(ctx, anchor, style, direction, metrics, blink = false, ghost = false) {
  const center = at(anchor, direction, 0.008, direction.back ? 0.03 : -0.035, metrics.headZ + metrics.lift + 4.2);
  const neck = at(anchor, direction, 0, direction.back ? 0.02 : -0.025, metrics.torsoTop + metrics.lift + 6.2);
  const neckFill = gradient(ctx, neck.x - 3, neck.y, neck.x + 3, neck.y + 14, [
    [0, ghost ? rgba(C.haze, 0.6) : C.skinLight],
    [1, ghost ? rgba(C.haze, 0.42) : C.skinShadow],
  ]);
  roundRect(ctx, neck.x - 2.9, neck.y, 5.8, 14, 2.2, neckFill);
  if (direction.back) {
    drawBackHead(ctx, center, style.hair);
    return;
  }
  hairBackplate(ctx, center, style.hair, direction);
  drawHeadBase(ctx, center);
  ellipse(ctx, center.x - 8.1, center.y + 0.6, 1.8, 3.2, rgba(C.skinShadow, 0.65));
  ellipse(ctx, center.x + 8.1, center.y + 0.6, 1.8, 3.2, rgba(C.skinLight, 0.7));
  drawFace(ctx, center, direction, blink);
  hairCap(ctx, center, style.hair, direction);
  if (style.hair.cut === "long") {
    ellipse(ctx, center.x - 7.3, center.y + 5.1, 3.4, 8.4, style.hair.shadow);
    ellipse(ctx, center.x + 7.3, center.y + 5.1, 3.4, 8.4, style.hair.base);
  }
  if (style.hair.cut === "bob") {
    roundRect(ctx, center.x - 8.2, center.y + 0.4, 3.3, 7.5, 1.5, style.hair.base);
    roundRect(ctx, center.x + 4.9, center.y + 0.4, 3.3, 7.5, 1.5, style.hair.shadow);
  }
  if (ghost) ellipse(ctx, center.x - 4.2, center.y - 5.5, 1.1, 0.8, rgba(C.ivoryLight, 0.35));
}
