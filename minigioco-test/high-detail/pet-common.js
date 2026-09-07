import { ellipse, glow } from "./primitives.js";

export const PET_PALETTES = Object.freeze({
  cat: Object.freeze({
    body: "#8f9996", light: "#c5ccc2", shadow: "#71807f", deep: "#4c5a5e",
    eye: "#263d48", nose: "#bd7772", muzzle: "#ddd8ca", innerEar: "#d89ca1",
    collar: "#c47b57", collarLight: "#efa76f", tag: "#f1cf7c",
  }),
  dog: Object.freeze({
    body: "#ae815e", light: "#dfc49b", shadow: "#8a6153", deep: "#5e4643",
    eye: "#3e3333", nose: "#504044", muzzle: "#ecd4ad", innerEar: "#bd7c76",
    collar: "#d36b4c", collarLight: "#f09b68", tag: "#f1cf7c",
  }),
});

export function rgba(hex, alpha) {
  const value = String(hex).replace("#", "");
  const number = Number.parseInt(value.length === 3 ? value.split("").map((part) => part + part).join("") : value, 16);
  if (!Number.isFinite(number)) return hex;
  return `rgba(${(number >> 16) & 255},${(number >> 8) & 255},${number & 255},${alpha})`;
}

export function resolvePetDirection(direction = "se") {
  const id = ["se", "sw", "ne", "nw"].includes(direction) ? direction : "se";
  return { id, side: id === "sw" || id === "nw" ? -1 : 1, back: id === "ne" || id === "nw" };
}

function blinkAmount(time, offset) {
  const cycle = (time + offset) % 5.8;
  if (cycle < 0 || cycle > 0.2) return 0;
  return Math.sin((cycle / 0.2) * Math.PI);
}

export function createPetPose({
  time = 0,
  walking = false,
  direction = "se",
  mode = "stand",
  petted = false,
  reducedMotion = false,
  type = "cat",
} = {}) {
  const state = String(mode || "stand").toLowerCase();
  const movingIntent = walking || state === "walk" || state === "walking";
  const resting = !movingIntent && (state === "sleep" || state === "rest" || state === "riposo");
  const seated = !movingIntent && (state === "sit" || state === "seated" || state === "seduto");
  const t = reducedMotion || !Number.isFinite(time) ? 0 : time;
  const moving = !reducedMotion && movingIntent;
  const gait = moving ? Math.sin(t * 9.2) : 0;
  const breathing = reducedMotion ? 0 : Math.sin(t * (resting ? 1.35 : 2.15)) * (resting ? 0.18 : 0.24);
  const blink = resting ? 1 : reducedMotion ? 0 : blinkAmount(t, type === "dog" ? 0.8 : 2.6);
  const tailWag = reducedMotion ? 0 : petted ? Math.sin(t * 10.4) : moving ? Math.sin(t * 7.2) * 0.35 : 0;
  const earTwitch = reducedMotion ? 0 : petted ? Math.sin(t * 8.6) * 0.22 : Math.sin(t * 2.1) * 0.06;
  const affection = petted ? (reducedMotion ? 0.75 : 0.52 + Math.sin(t * 7) * 0.2) : 0;
  const resolvedDirection = resolvePetDirection(direction);
  return {
    direction: resolvedDirection,
    back: resolvedDirection.back,
    moving,
    seated,
    resting,
    sleeping: resting && state === "sleep",
    perched: !movingIntent && (state === "perch" || state === "perched"),
    gait,
    breathing,
    blink,
    tailWag,
    earTwitch,
    affection,
  };
}

export function fillPath(ctx, build, fill, stroke, width = 1) {
  ctx.beginPath();
  build(ctx);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

export function strokePath(ctx, build, color, width = 1) {
  ctx.beginPath();
  build(ctx);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
}

export function drawPetShadow(ctx, x, y, palette, pose) {
  const perched = pose.perched;
  const resting = pose.resting;
  glow(ctx, x, y + 1.5, perched ? 8.5 : 10.5, perched ? 3 : 3.8, rgba(palette.shadow, perched ? 0.06 : 0.08));
  ellipse(ctx, x, y + 1.4, perched ? 6.4 : resting ? 8.7 : 9.6, perched ? 1.8 : 2.25, rgba(palette.shadow, perched ? 0.1 : 0.13));
}

export function drawPetLeg(ctx, {
  hipX,
  hipY,
  footX,
  baseY = -2.25,
  step = 0,
  lift = 0,
  palette,
  far = false,
  width = 1.35,
}) {
  const ankleX = footX + step;
  const ankleY = baseY - lift;
  const fill = far ? rgba(palette.shadow, 0.72) : palette.body;
  fillPath(ctx, (path) => {
    path.moveTo(hipX - width, hipY);
    path.quadraticCurveTo(hipX - width - 0.25, hipY + 2.2, ankleX - width * 0.75, ankleY + 0.8);
    path.quadraticCurveTo(ankleX, ankleY + 1.2, ankleX + width * 0.78, ankleY + 0.65);
    path.lineTo(ankleX + width, ankleY - 0.2);
    path.quadraticCurveTo(hipX + width, hipY + 1.4, hipX + width, hipY);
    path.closePath();
  }, fill);
  drawPetPaw(ctx, ankleX, ankleY + 0.15, width + 0.5, 1.18, palette, far);
}

export function drawPetPaw(ctx, x, y, rx, ry, palette, far = false) {
  const fill = far ? rgba(palette.shadow, 0.72) : palette.body;
  ellipse(ctx, x, y, rx, ry, fill);
  ellipse(ctx, x - 0.28, y - 0.32, rx * 0.5, ry * 0.3, rgba(palette.light, far ? 0.12 : 0.28));
}

export function drawPetAffection(ctx, x, y, palette, pose) {
  if (!pose.affection) return;
  const alpha = Math.max(0.25, Math.min(0.85, pose.affection));
  drawHeart(ctx, x + 5.5, y - 6.2, 0.9, rgba(palette.collarLight, alpha));
  if (pose.affection > 0.6) drawHeart(ctx, x + 8.1, y - 3.7, 0.56, rgba(palette.nose, alpha * 0.8));
}

function drawHeart(ctx, x, y, size, fill) {
  fillPath(ctx, (path) => {
    path.moveTo(x, y + size * 1.8);
    path.bezierCurveTo(x - size * 2.4, y + size * 0.3, x - size * 1.8, y - size * 1.4, x - size * 0.7, y - size * 0.8);
    path.bezierCurveTo(x, y - size * 1.3, x + size * 0.25, y - size * 1.3, x + size * 0.8, y - size * 0.7);
    path.bezierCurveTo(x + size * 1.9, y - size * 1.5, x + size * 2.5, y + size * 0.2, x, y + size * 1.8);
    path.closePath();
  }, fill);
}
