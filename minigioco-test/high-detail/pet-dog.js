import { ellipse, gradient } from "./primitives.js";
import {
  drawPetAffection,
  drawPetLeg,
  drawPetPaw,
  fillPath,
  rgba,
  strokePath,
} from "./pet-common.js";

function drawDogTail(ctx, bodyY, pose, palette) {
  if (pose.resting) {
    strokePath(ctx, (path) => {
      path.moveTo(-7.7, bodyY + 0.5);
      path.bezierCurveTo(-10.3, bodyY + 1.7, -9.4, -2.8, -6.4, -2.25);
      path.bezierCurveTo(-4.7, -1.9, -2.2, -2.55, 0.2, -2.65);
    }, rgba(palette.shadow, 0.68), 4.4);
    strokePath(ctx, (path) => {
      path.moveTo(-7.6, bodyY + 0.2);
      path.bezierCurveTo(-9.7, bodyY + 1.2, -8.9, -2.6, -6.3, -2.1);
      path.bezierCurveTo(-4.6, -1.75, -2.3, -2.35, 0.1, -2.5);
    }, rgba(palette.light, 0.3), 0.95);
    return;
  }
  const wag = pose.tailWag * 1.7;
  strokePath(ctx, (path) => {
    path.moveTo(-7.6, bodyY + 0.4);
    path.bezierCurveTo(-11.6, bodyY + 0.2, -13, bodyY - 3.8 + wag, -10.4, bodyY - 6.2 + wag);
    path.bezierCurveTo(-8.8, bodyY - 7.7 + wag, -10.1, bodyY - 9.2 + wag, -8.6, bodyY - 10.5 + wag);
  }, rgba(palette.shadow, 0.72), 4.3);
  strokePath(ctx, (path) => {
    path.moveTo(-7.5, bodyY);
    path.bezierCurveTo(-11.2, bodyY - 0.2, -12.1, bodyY - 3.6 + wag, -10.1, bodyY - 5.9 + wag);
    path.bezierCurveTo(-8.7, bodyY - 7.2 + wag, -9.7, bodyY - 8.5 + wag, -8.6, bodyY - 9.6 + wag);
  }, rgba(palette.light, 0.36), 0.95);
}

function drawDogLegs(ctx, bodyY, pose, palette) {
  if (pose.resting) {
    drawPetPaw(ctx, -4.1, -2.2, 2, 1.2, palette, true);
    drawPetPaw(ctx, -1.8, -2.05, 2.1, 1.25, palette);
    return;
  }
  if (pose.seated) {
    ellipse(ctx, -2.75, bodyY + 1.45, 4.65, 3.45, rgba(palette.body, 0.88));
    drawPetPaw(ctx, -3.8, -2.25, 2, 1.2, palette, true);
    drawPetPaw(ctx, -1.35, -2.1, 2.2, 1.28, palette);
    drawPetLeg(ctx, { hipX: 1.8, hipY: bodyY - 1.85, footX: 2.2, baseY: -2.1, palette, far: true, width: 1.38 });
    drawPetLeg(ctx, { hipX: 4.2, hipY: bodyY - 1.85, footX: 4.45, baseY: -1.95, palette, width: 1.42 });
    return;
  }
  const stepA = pose.gait * 1.02;
  const stepB = -pose.gait * 1.02;
  const liftA = Math.max(0, pose.gait) * 0.58;
  const liftB = Math.max(0, -pose.gait) * 0.58;
  drawPetLeg(ctx, { hipX: -6, hipY: bodyY - 1, footX: -5.7, step: stepB, lift: liftB, palette, far: true, width: 1.55 });
  drawPetLeg(ctx, { hipX: 2.2, hipY: bodyY - 1, footX: 2.7, step: stepA, lift: liftA, palette, far: true, width: 1.55 });
  drawPetLeg(ctx, { hipX: -3.6, hipY: bodyY - 0.6, footX: -3.35, step: stepA, lift: liftA, palette, width: 1.62 });
  drawPetLeg(ctx, { hipX: 5, hipY: bodyY - 0.6, footX: 4.9, step: stepB, lift: liftB, palette, width: 1.62 });
}

function drawDogEar(ctx, x, y, side, twitch, palette, back) {
  fillPath(ctx, (path) => {
    path.moveTo(x - side * 2.6, y - 2.8);
    path.quadraticCurveTo(x - side * 4.7, y - 1.1, x - side * 3.6, y + 4.2 + twitch);
    path.quadraticCurveTo(x - side * 2.5, y + 5.7 + twitch, x - side * 1.1, y + 1.5);
    path.quadraticCurveTo(x - side * 1.1, y - 1.8, x - side * 2.6, y - 2.8);
    path.closePath();
  }, back ? palette.shadow : palette.shadow);
  if (!back) {
    strokePath(ctx, (path) => {
      path.moveTo(x - side * 2.5, y - 1.5);
      path.quadraticCurveTo(x - side * 3.7, y + 0.2, x - side * 3.3, y + 2.8 + twitch);
    }, rgba(palette.innerEar, 0.7), 0.55);
  }
}

function drawDogFace(ctx, headX, headY, pose, palette) {
  const eyeY = headY - 0.9;
  if (pose.blink > 0.55) {
    strokePath(ctx, (path) => { path.moveTo(headX - 1.6, eyeY); path.quadraticCurveTo(headX - 0.9, eyeY + 0.45, headX - 0.2, eyeY); }, palette.eye, 0.62);
    strokePath(ctx, (path) => { path.moveTo(headX + 1.1, eyeY); path.quadraticCurveTo(headX + 1.8, eyeY + 0.45, headX + 2.5, eyeY); }, palette.eye, 0.62);
  } else {
    ellipse(ctx, headX - 1.35, eyeY, 0.48, 0.59, palette.eye);
    ellipse(ctx, headX + 1.2, eyeY, 0.5, 0.61, palette.eye);
    ellipse(ctx, headX - 1.22, eyeY - 0.19, 0.13, 0.15, rgba(palette.light, 0.7));
    ellipse(ctx, headX + 1.32, eyeY - 0.19, 0.13, 0.15, rgba(palette.light, 0.7));
  }
  ellipse(ctx, headX + 1.15, headY + 1.45, 2.2, 1.58, palette.muzzle);
  ellipse(ctx, headX + 2.35, headY + 1.3, 1.35, 1.25, rgba(palette.muzzle, 0.9));
  ellipse(ctx, headX + 2.55, headY + 0.9, 0.78, 0.58, palette.nose);
  strokePath(ctx, (path) => {
    path.moveTo(headX + 2.55, headY + 1.35);
    path.quadraticCurveTo(headX + 2.55, headY + 2.05, headX + 1.9, headY + 2.28);
    path.moveTo(headX + 2.55, headY + 1.35);
    path.quadraticCurveTo(headX + 2.75, headY + 2, headX + 3.25, headY + 2.08);
  }, palette.deep, 0.5);
}

function drawDogCollar(ctx, headX, headY, palette) {
  strokePath(ctx, (path) => {
    path.moveTo(headX - 4.5, headY + 3);
    path.quadraticCurveTo(headX - 0.1, headY + 4.45, headX + 4.45, headY + 2.8);
  }, palette.collar, 1.3);
  ellipse(ctx, headX + 2.35, headY + 3.6, 0.82, 0.72, palette.tag);
  ellipse(ctx, headX + 2.12, headY + 3.38, 0.18, 0.16, palette.collarLight);
}

export function drawDogPet(ctx, { x, y, palette, pose }) {
  const side = pose.direction.side;
  const bodyY = (pose.resting ? -6.2 : pose.seated ? -8.25 : -9) + pose.breathing * 0.24;
  const headX = pose.back ? -0.55 : 2.3;
  const headY = (pose.resting ? -9.7 : pose.seated ? -14.7 : -15.65) + pose.breathing * 0.15;
  const bodyRx = pose.resting ? 9.3 : pose.seated ? 8.6 : 8.9;
  const bodyRy = pose.resting ? 3.35 : pose.seated ? 4.95 : 4.45;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(side, 1);
  drawDogTail(ctx, bodyY, pose, palette);
  drawDogLegs(ctx, bodyY, pose, palette);
  ellipse(ctx, -1.25, bodyY, bodyRx, bodyRy, gradient(ctx, -10, bodyY - 4, 8, bodyY + 4, [
    [0, palette.light], [0.58, palette.body], [1, rgba(palette.shadow, 0.58)],
  ]));
  ellipse(ctx, 0.55, bodyY - 0.05, 2.25, 3.1, rgba(palette.muzzle, 0.42));
  ellipse(ctx, -3.5, bodyY - 1.8, 2.55, 1.15, rgba(palette.light, 0.28));
  if (pose.resting) {
    drawPetPaw(ctx, 1.85, -4.85, 2.15, 1.25, palette, true);
    drawPetPaw(ctx, 4.05, -4.65, 2.2, 1.3, palette);
  }
  drawDogEar(ctx, headX - 2.2, headY - 1.6, -1, pose.earTwitch, palette, pose.back);
  drawDogEar(ctx, headX + 2.5, headY - 1.4, 1, -pose.earTwitch, palette, pose.back);
  fillPath(ctx, (path) => {
    path.moveTo(headX - 4.4, headY - 1.2);
    path.quadraticCurveTo(headX - 3.7, headY - 5.2, headX - 0.5, headY - 5.25);
    path.quadraticCurveTo(headX + 4.1, headY - 5.2, headX + 4.6, headY - 0.45);
    path.quadraticCurveTo(headX + 4.8, headY + 3.8, headX + 0.9, headY + 4.45);
    path.quadraticCurveTo(headX - 3.3, headY + 4.45, headX - 4.4, headY - 1.2);
    path.closePath();
  }, pose.back ? palette.shadow : palette.light);
  if (pose.back) {
    ellipse(ctx, headX - 0.8, headY - 0.65, 2.5, 1.75, rgba(palette.body, 0.62));
  } else {
    ellipse(ctx, headX + 1.35, headY + 0.45, 2.55, 2.5, rgba(palette.body, 0.82));
    drawDogFace(ctx, headX, headY, pose, palette);
  }
  drawDogCollar(ctx, headX, headY, palette);
  drawPetAffection(ctx, headX, headY, palette, pose);
  ctx.restore();
}
