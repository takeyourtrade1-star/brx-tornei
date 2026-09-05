import { point, polygon, line, box, plane, ellipse, glow, gradient } from "./primitives.js";
import { M } from "./furniture-helpers.js";
import { drawOutsideAtmosphere, wallFill, rgba } from "./background-atmosphere.js";

export const GRID_W = 12;
export const GRID_D = 10;
export const WALL_HEIGHT = 112;

export const wallPoint = (side, column, z) => side === "left"
  ? point(0, column, z)
  : point(column, 0, z);

export function wallQuad(side, c0, c1, z0, z1) {
  return [wallPoint(side, c0, z1), wallPoint(side, c1, z1), wallPoint(side, c1, z0), wallPoint(side, c0, z0)];
}

function drawFoundation(ctx, colors) {
  polygon(ctx, [point(0, GRID_D, 0), point(GRID_W, GRID_D, 0), point(GRID_W, GRID_D, -9), point(0, GRID_D, -9)], colors.foundation);
  polygon(ctx, [point(GRID_W, GRID_D, 0), point(GRID_W, 0, 0), point(GRID_W, 0, -9), point(GRID_W, GRID_D, -9)], colors.foundationDeep);
  line(ctx, [point(0, GRID_D, -1), point(GRID_W, GRID_D, -1)], colors.bevel, 1.2);
  line(ctx, [point(GRID_W, GRID_D, -1), point(GRID_W, 0, -1)], colors.bevelSoft, 1);
}

function drawStoneSeams(ctx, colors, strong = false) {
  const seam = strong ? rgba(colors.seam, 0.28) : rgba(colors.seam, 0.18);
  for (let x = 1; x < GRID_W; x += 2) line(ctx, [point(x, 0, 0.7), point(x, GRID_D, 0.7)], seam, 0.7);
  for (let y = 1; y < GRID_D; y += 2) line(ctx, [point(0, y, 0.7), point(GRID_W, y, 0.7)], seam, 0.7);
  line(ctx, [point(0, GRID_D, 1), point(GRID_W, GRID_D, 1)], rgba(colors.edge, 0.34), 1);
  line(ctx, [point(GRID_W, GRID_D, 1), point(GRID_W, 0, 1)], rgba(colors.edge, 0.25), 1);
}

function drawParquetFloor(ctx, colors) {
  const origin = point(0, 0, 0);
  const far = point(GRID_W, GRID_D, 0);
  plane(ctx, 0, 0, GRID_W, GRID_D, 0, gradient(ctx, origin.x, origin.y, far.x, far.y, [
    [0, colors.floorLight || colors.floor], [0.46, colors.floor], [1, colors.floorDark || colors.floor],
  ]));
  const plankDepth = 0.56;
  for (let i = 0; i < 18; i += 1) {
    const y = i * plankDepth;
    const plankTone = i % 2 ? (colors.floorLight || colors.floor) : (colors.floorDark || colors.floor);
    plane(ctx, 0, y, GRID_W, Math.min(plankDepth - 0.035, GRID_D - y), 0.55, rgba(plankTone, 0.10));
    line(ctx, [point(0, y, 0.75), point(GRID_W, y, 0.75)], rgba(colors.plankSeam, 0.38), 0.55);
    const offset = i % 2 ? 1.35 : 0;
    for (let x = offset; x < GRID_W; x += 3.15) {
      line(ctx, [point(x, y + 0.08, 0.85), point(Math.min(GRID_W, x + 1.2), y + 0.08, 0.85)], rgba(colors.grain || colors.plankSeam || colors.floor, 0.23), 0.5);
    }
  }
  line(ctx, [point(0, GRID_D, 1), point(GRID_W, GRID_D, 1)], rgba(colors.edge, 0.44), 1);
  line(ctx, [point(GRID_W, GRID_D, 1), point(GRID_W, 0, 1)], rgba(colors.edge, 0.28), 1);
}

function drawWallPanels(ctx, colors) {
  for (const side of ["left", "right"]) {
    const end = side === "left" ? GRID_D : GRID_W;
    const panel = wallQuad(side, 0, end, 0, 30);
    polygon(ctx, panel, colors.panel);
    polygon(ctx, wallQuad(side, 0, end, 30, 35), colors.trimBand || colors.trim);
    polygon(ctx, wallQuad(side, 0, end, 35, 39), colors.trimHighlight || colors.trimSoft);
    line(ctx, [wallPoint(side, 0, 39), wallPoint(side, end, 39)], rgba(M.ivoryLight, 0.25), 0.7);
    for (let c = 2; c < end; c += 2) {
      line(ctx, [wallPoint(side, c, 2), wallPoint(side, c, 29)], colors.panelSeam, 0.55);
    }
  }
}

function drawWallCrown(ctx, colors) {
  for (const side of ["left", "right"]) {
    const end = side === "left" ? GRID_D : GRID_W;
    polygon(ctx, wallQuad(side, 0, end, WALL_HEIGHT, WALL_HEIGHT + 7), colors.crownFace || colors.crown);
    polygon(ctx, wallQuad(side, 0, end, WALL_HEIGHT + 7, WALL_HEIGHT + 11), colors.crownCap || colors.crown);
    line(ctx, [wallPoint(side, 0, WALL_HEIGHT + 11), wallPoint(side, end, WALL_HEIGHT + 11)], colors.crownHighlight || colors.crown, 1.25);
    line(ctx, [wallPoint(side, 0, WALL_HEIGHT + 7), wallPoint(side, end, WALL_HEIGHT + 7)], colors.crownShadow || colors.trim, 0.8);
  }
}

export function drawEnclosedShell(ctx, colors, phase, options = {}) {
  drawOutsideAtmosphere(ctx, options.room || "tournament", phase);
  const left = wallQuad("left", 0, GRID_D, 0, WALL_HEIGHT);
  const right = wallQuad("right", 0, GRID_W, 0, WALL_HEIGHT);
  wallFill(ctx, left, colors.wallBright, colors.wallShade);
  wallFill(ctx, right, colors.wallShade, colors.wallBright);
  drawWallPanels(ctx, colors);
  drawWallCrown(ctx, colors);
  drawParquetFloor(ctx, colors);
  drawFoundation(ctx, colors);
}

export function drawOpenShell(ctx, colors, phase, room = "piazza") {
  drawOutsideAtmosphere(ctx, room, phase);
  plane(ctx, 0, 0, GRID_W, GRID_D, 0, colors.floor);
  drawStoneSeams(ctx, colors, true);
  drawFoundation(ctx, colors);
}

export function insetPlane(ctx, x, y, w, d, z, fill, edge) {
  plane(ctx, x + 0.12, y + 0.12, w, d, z - 1.2, "rgba(32,31,32,0.15)");
  plane(ctx, x, y, w, d, z, fill, edge);
}

function drawDoorLabel(ctx, side, c0, c1, z, label, color) {
  if (!label) return;
  const center = wallPoint(side, (c0 + c1) / 2, z);
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(side === "right" ? Math.atan2(16, 32) : Math.atan2(-16, 32));
  ctx.scale(1, 0.72);
  ctx.fillStyle = color;
  ctx.font = "600 7px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 0, 0);
  ctx.restore();
}

export function drawWallDoor(ctx, side, c0, c1, colors, labelColor = colors.accent, label = "") {
  const outer = wallQuad(side, c0, c1, 1, 94);
  const leaf = wallQuad(side, c0 + 0.11, c1 - 0.11, 4, 90);
  polygon(ctx, wallQuad(side, c0 - 0.08, c1 + 0.08, 0, 96), "rgba(24,24,27,0.22)");
  polygon(ctx, outer, colors.frame, colors.frameEdge, 1.2);
  const doorGradient = gradient(ctx, leaf[0].x, leaf[0].y, leaf[2].x, leaf[2].y, [[0, colors.leafTop], [1, colors.leafBottom]]);
  polygon(ctx, leaf, doorGradient);
  for (const [z0, z1] of [[12, 38], [47, 76]]) {
    polygon(ctx, wallQuad(side, c0 + 0.25, c1 - 0.25, z0, z1), colors.panel, colors.panelEdge, 0.6);
  }
  line(ctx, [wallPoint(side, c0 + 0.12, 91), wallPoint(side, c1 - 0.12, 91)], colors.highlight, 1);
  const knob = wallPoint(side, c0 + (c1 - c0) * 0.72, 49);
  ellipse(ctx, knob.x, knob.y, 3.1, 2.2, colors.knob);
  ellipse(ctx, knob.x - 0.7, knob.y - 0.8, 0.8, 0.55, colors.knobLight);
  const plaque = wallQuad(side, c0 + 0.3, c1 - 0.3, 98, 105);
  polygon(ctx, plaque, colors.sign, labelColor, 0.8);
  line(ctx, [plaque[0], plaque[1]], rgba(M.ivoryLight, 0.6), 0.7);
  drawDoorLabel(ctx, side, c0 + 0.3, c1 - 0.3, 101.4, label, M.ivoryLight);
}

export function drawArchitecturalPost(ctx, x, y, colors, height = 82) {
  box(ctx, x, y, 0.12, 0.12, 0, height, {
    top: colors.top, left: colors.left, right: colors.right, edge: colors.edge,
  });
  const p = point(x + 0.06, y + 0.06, height + 3);
  glow(ctx, p.x, p.y, 15, 12, rgba(colors.glow, 0.11));
}

export function drawFloorEmblem(ctx, x, y, colors) {
  const center = point(x, y, 2.4);
  ellipse(ctx, center.x, center.y, 54, 20, rgba(colors.dark, 0.18));
  ellipse(ctx, center.x, center.y - 1, 47, 17, colors.outer);
  ellipse(ctx, center.x, center.y - 1, 33, 11, colors.inner);
  line(ctx, [point(x - 0.85, y, 3), point(x + 0.85, y, 3)], colors.mark, 1.3);
  line(ctx, [point(x, y - 0.7, 3), point(x, y + 0.7, 3)], colors.mark, 1.3);
}
