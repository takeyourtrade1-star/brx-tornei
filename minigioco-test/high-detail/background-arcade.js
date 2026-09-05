import { point, polygon, line, plane, ellipse, glow, gradient } from "./primitives.js";
import { M } from "./furniture-helpers.js";
import { phaseId, rgba } from "./background-atmosphere.js";
import {
  drawEnclosedShell, insetPlane, wallQuad, drawWallDoor,
} from "./background-architecture.js";

const left = (c, z) => point(0, c, z);
const right = (c, z) => point(c, 0, z);

function drawRecessedBackwall(ctx) {
  const alcove = wallQuad("right", 1.05, 10.15, 26, 97);
  polygon(ctx, alcove, gradient(ctx, alcove[0].x, alcove[0].y, alcove[2].x, alcove[2].y, [
    [0, "#18263C"], [0.44, "#132A3B"], [1, "#201B34"],
  ]), rgba(M.cyanDeep, 0.22), 0.8);
  line(ctx, [right(1.2, 91), right(9.98, 91)], rgba(M.ivoryLight, 0.24), 0.8);
  line(ctx, [right(1.2, 39), right(9.98, 39)], rgba(M.plum, 0.34), 1);
  for (const c of [2.1, 5.0, 8.1]) {
    polygon(ctx, wallQuad("right", c, c + 0.15, 40, 87), rgba(M.cyan, 0.32));
    const lamp = right(c + 0.08, 88);
    glow(ctx, lamp.x, lamp.y, 18, 12, rgba(M.cyan, 0.12));
    ellipse(ctx, lamp.x, lamp.y, 2.2, 1.25, M.cyan);
  }
}

function drawSideArchitecture(ctx) {
  const leftBands = [
    [0.55, 2.12, 46, 50, rgba(M.plum, 0.26)],
    [6.45, 8.45, 75, 78, rgba(M.cyan, 0.22)],
  ];
  for (const [c0, c1, z0, z1, color] of leftBands) {
    polygon(ctx, wallQuad("left", c0, c1, z0, z1), color);
    line(ctx, [left(c0, z1), left(c1, z1)], rgba(M.ivoryLight, 0.34), 0.7);
  }
  line(ctx, [left(0, 92), left(10, 92)], rgba(M.plum, 0.28), 1.1);
  line(ctx, [left(0, 34), left(10, 34)], rgba(M.cyanDeep, 0.32), 1.2);
  line(ctx, [right(0, 103), right(12, 103)], rgba(M.plum, 0.42), 1.1);
  line(ctx, [right(0, 31), right(12, 31)], rgba(M.cyanDeep, 0.34), 1.2);
}

function drawFloor(ctx) {
  insetPlane(ctx, 0.85, 1.1, 10.25, 8.05, 1.2, "#171B2B", rgba(M.cyanDeep, 0.28));
  insetPlane(ctx, 3.25, 3.25, 5.6, 3.85, 2.1, "#20233B", rgba(M.plum, 0.38));
  plane(ctx, 3.65, 3.62, 4.8, 3.1, 2.6, "rgba(45,68,78,0.42)", rgba(M.cyan, 0.18));
  line(ctx, [point(1.25, 1.55, 2), point(10.7, 1.55, 2)], rgba(M.plum, 0.2), 0.9);
  line(ctx, [point(1.25, 8.75, 2), point(10.7, 8.75, 2)], rgba(M.cyanDeep, 0.2), 0.9);
  const mark = point(6, 5, 3.1);
  ellipse(ctx, mark.x, mark.y, 34, 12, "rgba(11,26,38,0.42)");
  ellipse(ctx, mark.x, mark.y - 1, 22, 7, "rgba(91,75,115,0.34)");
  line(ctx, [point(5.52, 5, 3.6), point(6.48, 5, 3.6)], rgba(M.amberLight, 0.5), 0.9);
  line(ctx, [point(6, 4.58, 3.6), point(6, 5.42, 3.6)], rgba(M.amberLight, 0.5), 0.9);
}

function drawPortalLight(ctx) {
  const source = left(4.85, 88);
  glow(ctx, source.x, source.y, 52, 36, rgba(M.plum, 0.10));
  const floor = point(2.4, 3.4, 2);
  glow(ctx, floor.x, floor.y, 88, 28, rgba(M.cyan, 0.06));
}

export function drawArcadeBackground(ctx, phase = {}) {
  const night = phaseId(phase) === "night";
  const colors = {
    wallBright: night ? "#151B2C" : "#192038", wallShade: "#10182A", panel: "#172A3A",
    trim: rgba(M.plum, 0.68), trimSoft: rgba(M.cyan, 0.38), panelSeam: rgba(M.ivoryLight, 0.08),
    crown: rgba(M.cyan, 0.54), crownFace: "#1C2940", crownCap: "#253550",
    crownHighlight: rgba(M.cyan, 0.58), crownShadow: "#111827",
    floor: "#101725", floorLight: "#1A2336", floorDark: "#0B101B", plankSeam: "#27324B", grain: M.cyanDeep, seam: M.petrolDeep,
    edge: M.ivoryLight, foundation: "#263247", foundationDeep: "#1A2536",
    bevel: rgba(M.cyan, 0.28), bevelSoft: rgba(M.plum, 0.24),
  };
  drawEnclosedShell(ctx, colors, phase, { room: "arcade", strongFloor: false });
  drawRecessedBackwall(ctx);
  drawSideArchitecture(ctx);
  drawFloor(ctx);
  drawPortalLight(ctx);
  drawWallDoor(ctx, "left", 3.9, 5.8, {
    frame: "#302A43", frameEdge: rgba(M.plum, 0.7), leafTop: "#4F4568",
    leafBottom: "#2A3450", panel: "rgba(19,29,45,0.72)", panelEdge: rgba(M.cyan, 0.42),
    highlight: rgba(M.ivoryLight, 0.4), knob: M.amber, knobLight: M.amberLight,
    sign: M.petrolDeep, accent: M.cyan,
  }, M.cyan, "TORNEI");
}
