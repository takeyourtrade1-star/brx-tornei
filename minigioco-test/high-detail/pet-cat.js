import { ellipse, gradient } from "./primitives.js";
import {
  drawPetAffection,
  drawPetLeg,
  drawPetPaw,
  fillPath,
  rgba,
  strokePath,
} from "./pet-common.js";

function drawCatTail(ctx, bodyY, pose, palette) {
  if (pose.resting) {
    strokePath(ctx, (path) => {
      path.moveTo(-7.1, bodyY + 0.8);
      path.bezierCurveTo(-9.4, bodyY + 1.8, -8.8, -2.9, -6, -2.35);
      path.bezierCurveTo(-4.4, -1.95, -2.4, -2.55, -0.4, -2.65);
    }, rgba(palette.shadow, 0.68), 4.2);
    strokePath(ctx, (path) => {
      path.moveTo(-7, bodyY + 0.5);
      path.bezierCurveTo(-8.8, bodyY + 1.3, -8.3, -2.7, -5.9, -2.2);
      path.bezierCurveTo(-4.3, -1.8, -2.5, -2.4, -0.5, -2.5);
    }, rgba(palette.light, 0.32), 0.9);
    return;
  }
  const wag = pose.tailWag * 1.5;
  strokePath(ctx, (path) => {
    path.moveTo(-7.1, bodyY + 1.2);
    path.bezierCurveTo(-11.6, bodyY + 0.7, -13.2, bodyY - 2.8 + wag, -10.9, bodyY - 6.4 + wag);
    path.bezierCurveTo(-9.6, bodyY - 8.4 + wag, -11.3, bodyY - 10.2 + wag, -9.2, bodyY - 12.2 + wag);
  }, rgba(palette.shadow, 0.72), 4.1);
  strokePath(ctx, (path) => {
    path.moveTo(-7, bodyY + 0.8);
    path.bezierCurveTo(-11, bodyY + 0.2, -12.3, bodyY - 2.8 + wag, -10.4, bodyY - 6.3 + wag);
    path.bezierCurveTo(-9.2, bodyY - 8.2 + wag, -10.7, bodyY - 9.7 + wag, -9.1, bodyY - 11.2 + wag);
  }, rgba(palette.light, 0.38), 0.95);
}

function drawCatLegs(ctx, bodyY, pose, palette) {
  if (pose.resting) {
    drawPetPaw(ctx, -4, -2.2, 1.9, 1.15, palette, true);
    drawPetPaw(ctx, -1.9, -2.05, 2, 1.2, palette);
    return;
  }
  if (pose.seated) {
    ellipse(ctx, -2.8, bodyY + 1.45, 4.15, 3.2, rgba(palette.body, 0.88));
    drawPetPaw(ctx, -3.6, -2.25, 1.9, 1.15, palette, true);
    drawPetPaw(ctx, -1.35, -2.1, 2, 1.2, palette);
    drawPetLeg(ctx, { hipX: 1.8, hipY: bodyY - 1.8, footX: 2.25, baseY: -2.1, palette, far: true, width: 1.3 });
    drawPetLeg(ctx, { hipX: 4, hipY: bodyY - 1.8, footX: 4.35, baseY: -1.95, palette, width: 1.35 });
    return;
  }
  const stepA = pose.gait * 0.95;
  const stepB = -pose.gait * 0.95;
  const liftA = Math.max(0, pose.gait) * 0.58;
  const liftB = Math.max(0, -pose.gait) * 0.58;
  drawPetLeg(ctx, { hipX: -5.6, hipY: bodyY - 1, footX: -5.2, step: stepB, lift: liftB, palette, far: true, width: 1.45 });
  drawPetLeg(ctx, { hipX: 2.5, hipY: bodyY - 1, footX: 2.9, step: stepA, lift: liftA, palette, far: true, width: 1.45 });
  drawPetLeg(ctx, { hipX: -3.4, hipY: bodyY - 0.7, footX: -3.2, step: stepA, lift: liftA, palette, width: 1.5 });
  drawPetLeg(ctx, { hipX: 4.7, hipY: bodyY - 0.7, footX: 4.65, step: stepB, lift: liftB, palette, width: 1.5 });
}

function drawCatEar(ctx, x, y, side, twitch, palette, back) {
  const fill = back ? rgba(palette.shadow, 0.72) : palette.body;
  fillPath(ctx, (path) => {
    path.moveTo(x - side * 2.7, y + 1.7);
    path.quadraticCurveTo(x - side * 2.5, y - 2.2, x - side * 1.1, y - 7.1 + twitch);
    path.quadraticCurveTo(x + side * 0.2, y - 6, x + side * 2.5, y + 1.1);
    path.quadraticCurveTo(x + side * 0.4, y + 2.2, x - side * 2.7, y + 1.7);
    path.closePath();
  }, fill);
  if (!back) {
    fillPath(ctx, (path) => {
      path.moveTo(x - side * 1.9, y + 0.6);
      path.quadraticCurveTo(x - side * 1.7, y - 1.7, x - side * 1, y - 5.1 + twitch);
      path.quadraticCurveTo(x + side * 0.2, y - 3.7, x + side * 1.5, y + 0.8);
      path.closePath();
    }, palette.innerEar);
  }
}

function drawCatFace(ctx, headX, headY, pose, palette) {
  const eyeY = headY - 0.65;
  if (pose.blink > 0.55) {
    strokePath(ctx, (path) => { path.moveTo(headX - 2.5, eyeY); path.quadraticCurveTo(headX - 1.7, eyeY + 0.55, headX - 0.9, eyeY); }, palette.eye, 0.62);
    strokePath(ctx, (path) => { path.moveTo(headX + 0.5, eyeY); path.quadraticCurveTo(headX + 1.4, eyeY + 0.55, headX + 2.3, eyeY); }, palette.eye, 0.62);
  } else {
    ellipse(ctx, headX - 1.9, eyeY, 0.46, 0.62, palette.eye);
    ellipse(ctx, headX + 1.9, eyeY, 0.49, 0.64, palette.eye);
    ellipse(ctx, headX - 1.75, eyeY - 0.2, 0.13, 0.16, rgba(palette.light, 0.7));
    ellipse(ctx, headX + 2.05, eyeY - 0.2, 0.13, 0.16, rgba(palette.light, 0.7));
  }
  ellipse(ctx, headX + 1.9, headY + 1.45, 2.1, 1.55, palette.muzzle);
  ellipse(ctx, headX + 3.55, headY + 1.35, 1.75, 1.5, palette.muzzle);
  ellipse(ctx, headX + 3.1, headY + 0.95, 0.78, 0.58, palette.nose);
  strokePath(ctx, (path) => {
    path.moveTo(headX + 3.1, headY + 1.4);
    path.quadraticCurveTo(headX + 2.9, headY + 2.15, headX + 2.25, headY + 2.35);
    path.moveTo(headX + 3.1, headY + 1.4);
    path.quadraticCurveTo(headX + 3.3, headY + 2.05, headX + 3.95, headY + 2.15);
  }, palette.deep, 0.48);
  strokePath(ctx, (path) => {
    path.moveTo(headX + 1.7, headY + 1.4); path.lineTo(headX - 1.6, headY + 0.8);
    path.moveTo(headX + 1.65, headY + 2.05); path.lineTo(headX - 1.25, headY + 2.55);
    path.moveTo(headX + 4.55, headY + 1.3); path.lineTo(headX + 7.1, headY + 0.75);
    path.moveTo(headX + 4.55, headY + 2); path.lineTo(headX + 6.85, headY + 2.55);
  }, rgba(palette.light, 0.55), 0.34);
}

function drawCatCollar(ctx, headX, headY, palette) {
  strokePath(ctx, (path) => {
    path.moveTo(headX - 4.2, headY + 3);
    path.quadraticCurveTo(headX, headY + 4.5, headX + 4.2, headY + 2.8);
  }, palette.collar, 1.35);
  ellipse(ctx, headX + 2.8, headY + 3.7, 0.82, 0.72, palette.tag);
  ellipse(ctx, headX + 2.55, headY + 3.48, 0.18, 0.18, palette.collarLight);
}

export function drawCatPet(ctx, { x, y, palette, pose }) {
  const side = pose.direction.side;
  const bodyY = (pose.resting ? -6.2 : pose.seated ? -8.4 : -9) + pose.breathing * 0.28;
  const headX = pose.back ? -0.6 : 2.8;
  const headY = (pose.resting ? -9.8 : pose.seated ? -14.9 : -15.8) + pose.breathing * 0.16;
  const bodyRx = pose.resting ? 9 : pose.seated ? 8.2 : 8.35;
  const bodyRy = pose.resting ? 3.25 : pose.seated ? 4.8 : 4.1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(side, 1);
  drawCatTail(ctx, bodyY, pose, palette);
  drawCatLegs(ctx, bodyY, pose, palette);
  ellipse(ctx, -1.2, bodyY, bodyRx, bodyRy, gradient(ctx, -9, bodyY - 4, 7, bodyY + 4, [
    [0, palette.light], [0.62, palette.body], [1, rgba(palette.shadow, 0.58)],
  ]));
  ellipse(ctx, -2.9, bodyY - 1.65, 2.45, 1.1, rgba(palette.light, 0.3));
  if (pose.resting) {
    drawPetPaw(ctx, 1.75, -4.95, 2.05, 1.2, palette, true);
    drawPetPaw(ctx, 3.85, -4.75, 2.1, 1.25, palette);
  }
  drawCatEar(ctx, headX - 2.1, headY - 2.3, -1, pose.earTwitch, palette, pose.back);
  drawCatEar(ctx, headX + 1.7, headY - 2.1, 1, -pose.earTwitch, palette, pose.back);
  ellipse(ctx, headX, headY, 5.9, 4.9, pose.back ? rgba(palette.shadow, 0.72) : palette.body);
  if (pose.back) {
    ellipse(ctx, headX - 1.05, headY - 0.8, 2.1, 1.6, rgba(palette.light, 0.35));
  } else {
    drawCatFace(ctx, headX, headY, pose, palette);
  }
  drawCatCollar(ctx, headX, headY, palette);
  drawPetAffection(ctx, headX, headY, palette, pose);
  ctx.restore();
}
