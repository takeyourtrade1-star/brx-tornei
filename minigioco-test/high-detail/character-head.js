import { ellipse, gradient, line } from "./primitives.js";
import { pixelAt } from "./character-body.js";
import { drawHairBack, drawHairFront } from "./character-hair.js";
import { CHARACTER_COLORS as C, rgba } from "./character-style.js";

function tone(color, ghost, alpha = 1) {
  return ghost ? rgba(C.haze, alpha) : alpha === 1 ? color : rgba(color, alpha);
}

function curve(ctx, start, control, end, color, width) {
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.stroke();
}

function drawHeadBase(ctx, center, ghost) {
  const face = ghost ? tone(C.haze, true, 0.78) : gradient(ctx, center.x - 7, center.y - 8, center.x + 8, center.y + 9, [
    [0, C.skinLight], [0.48, C.skin], [1, C.skinShadow],
  ]);
  ellipse(ctx, center.x, center.y, 8.35, 8.55, face);
  ellipse(ctx, center.x + 5.1, center.y + 1.4, 2.5, 5.5, tone(C.skinShadow, ghost, 0.25));
}

function drawFace(ctx, center, direction, metrics, blink, ghost) {
  const gaze = direction.side * metrics.gaze;
  const far = center.x - direction.side * 2.45 + gaze;
  const near = center.x + direction.side * 2.95 + gaze;
  const eyeY = center.y + 0.75;
  const eye = tone(C.eye, ghost, 0.94);
  const brow = tone(C.brow, ghost, 0.72);
  curve(ctx,
    { x: far - direction.side * 0.95, y: center.y - 2.35 },
    { x: far, y: center.y - 2.7 },
    { x: far + direction.side * 0.95, y: center.y - 2.35 },
    brow,
    0.55,
  );
  curve(ctx,
    { x: near - direction.side * 1.05, y: center.y - 2.45 },
    { x: near, y: center.y - 2.82 },
    { x: near + direction.side * 1.05, y: center.y - 2.45 },
    brow,
    0.58,
  );
  if (blink) {
    line(ctx, [
      { x: far - direction.side * 1.1, y: eyeY },
      { x: far + direction.side * 0.75, y: eyeY + 0.15 },
    ], tone(C.skinDeep, ghost, 0.85), 0.75);
    line(ctx, [
      { x: near - direction.side * 1.2, y: eyeY },
      { x: near + direction.side * 1.05, y: eyeY + 0.15 },
    ], tone(C.skinDeep, ghost, 0.9), 0.8);
  } else {
    ellipse(ctx, far, eyeY, 0.82, 1.02, eye);
    ellipse(ctx, near, eyeY, 0.9, 1.12, eye);
  }
  ellipse(ctx, center.x - direction.side * 4.8, center.y + 3, 1.55, 0.7, tone(C.cheek, ghost, 0.38));
  ellipse(ctx, center.x + direction.side * 4.8, center.y + 3, 1.55, 0.7, tone(C.cheek, ghost, 0.4));
  line(ctx, [
    { x: center.x + direction.side * 0.7, y: center.y + 1.65 },
    { x: center.x + direction.side * 1.15, y: center.y + 2.55 },
  ], tone(C.skinShadow, ghost, 0.52), 0.55);
  curve(ctx,
    { x: center.x - direction.side * 1.8, y: center.y + 4.65 },
    { x: center.x, y: center.y + 5.7 },
    { x: center.x + direction.side * 1.8, y: center.y + 4.65 },
    tone(C.mouth, ghost, 0.78),
    0.8,
  );
}

export function drawDetailedHead(ctx, anchor, style, direction, metrics, blink = false, ghost = false) {
  const center = pixelAt(anchor, direction, metrics.headTurn, metrics.headZ + metrics.lift);
  if (direction.back) {
    drawHairBack(ctx, center, style.hair, direction, ghost, true);
    return;
  }
  drawHairBack(ctx, center, style.hair, direction, ghost);
  drawHeadBase(ctx, center, ghost);
  ellipse(ctx, center.x - direction.side * 8, center.y + 0.8, 1.45, 2.45, tone(C.skinShadow, ghost, 0.7));
  ellipse(ctx, center.x + direction.side * 8, center.y + 0.8, 1.45, 2.45, tone(C.skinLight, ghost, 0.72));
  drawFace(ctx, center, direction, metrics, blink, ghost);
  drawHairFront(ctx, center, style.hair, direction, ghost);
  if (ghost) ellipse(ctx, center.x - 3.4, center.y - 5.1, 0.9, 0.55, rgba(C.ivoryLight, 0.2));
}
