import { point, polygon, line, box, plane, ellipse, glow, gradient } from "./primitives.js";
import { M } from "./furniture-helpers.js";
import { phaseId, rgba } from "./background-atmosphere.js";
import { drawTerraceGarden } from './terrace-garden';
import {
  drawOpenShell, insetPlane, drawWallDoor,
  drawArchitecturalPost, drawFloorEmblem,
} from "./background-architecture.js";

const left = (c, z) => point(0, c, z);
const right = (c, z) => point(c, 0, z);

function drawHorizon(ctx, phase) {
  const id = phaseId(phase);
  const skyTop = id === "night" ? "rgba(33,52,79,0.34)" : id === "dusk" ? "rgba(214,125,112,0.34)" : "rgba(117,181,194,0.28)";
  const skyBottom = id === "night" ? "rgba(79,95,121,0.12)" : id === "dusk" ? "rgba(230,176,130,0.13)" : "rgba(214,215,189,0.11)";
  glow(ctx, 358, 181, 246, 92, skyTop);
  const backEdge = [right(0, 76), right(1.7, 82), right(3.4, 74), right(5.2, 85), right(7.1, 73), right(9.2, 80), right(12, 75), right(12, 46), right(0, 46)];
  polygon(ctx, backEdge, gradient(ctx, backEdge[0].x, backEdge[0].y, backEdge[7].x, backEdge[7].y, [[0, skyTop], [0.66, skyBottom], [1, "rgba(231,216,184,0.04)"]]));
  const leftEdge = [left(0, 73), left(1.8, 80), left(3.6, 71), left(5.5, 82), left(7.4, 70), left(10, 77), left(10, 46), left(0, 46)];
  polygon(ctx, leftEdge, "rgba(119,157,157,0.11)");
  const farHill = [right(0, 42), right(0, 58), right(1.4, 61), right(2.6, 53), right(4.1, 66), right(5.7, 55), right(7.4, 63), right(9, 50), right(10.4, 59), right(12, 53), right(12, 42)];
  polygon(ctx, farHill, id === "night" ? "rgba(25,54,65,0.76)" : "rgba(83,111,101,0.52)");
  const nearHill = [right(0, 40), right(0, 50), right(1.6, 54), right(3.1, 45), right(4.8, 58), right(6.4, 48), right(8.2, 55), right(10.1, 45), right(12, 51), right(12, 40)];
  polygon(ctx, nearHill, id === "night" ? "rgba(42,55,72,0.82)" : "rgba(168,111,82,0.48)");
  for (const [c, z, w, h] of [[0.8, 50, 0.8, 11], [2.1, 49, 0.55, 17], [3.5, 48, 0.72, 9], [5.25, 52, 0.46, 14], [7.7, 49, 0.62, 12], [9.2, 47, 0.78, 18], [11, 51, 0.48, 10]]) {
    polygon(ctx, [right(c, z), right(c + w, z), right(c + w, z + h * 0.72), right(c + w * 0.56, z + h), right(c, z + h)], "rgba(35,62,70,0.42)");
  }
  const sun = right(2.6, id === "dusk" ? 73 : 86);
  glow(ctx, sun.x, sun.y, 42, 34, id === "night" ? "rgba(180,206,220,0.06)" : "rgba(255,211,127,0.16)");
  ellipse(ctx, sun.x, sun.y, 12, 10, id === "night" ? "#D8E3D7" : "#F5C66D");
}

function drawParapets(ctx) {
  const stone = { top: M.ivoryLight, left: M.ivory, right: M.ivoryShade, edge: rgba(M.amberLight, 0.56) };
  box(ctx, 0, 0, 0.38, 10, 0, 25, stone);
  box(ctx, 0, 0, 12, 0.36, 0, 22, stone);
  line(ctx, [left(0.02, 25), left(9.98, 25)], rgba(M.ivoryLight, 0.6), 1);
  line(ctx, [right(0.02, 22), right(11.98, 22)], rgba(M.ivoryLight, 0.55), 1);
  line(ctx, [point(0.4, 0.4, 0), point(0.4, 9.6, 0)], rgba(M.walnutLight, 0.38), 1);
}

function drawPlanter(ctx, x, y, potColor) {
  box(ctx, x, y, 0.78, 0.78, 25, 11, {
    top: M.terracottaLight, left: potColor, right: M.terracottaDeep, edge: rgba(M.ivoryLight, 0.4),
  });
  const crown = point(x + 0.39, y + 0.39, 53);
  glow(ctx, crown.x, crown.y, 18, 12, "rgba(112,174,128,0.08)");
  ellipse(ctx, crown.x, crown.y, 11, 6, M.green);
  ellipse(ctx, crown.x - 7, crown.y + 3, 8, 4.5, M.moss);
  ellipse(ctx, crown.x + 7, crown.y + 2, 8, 4.5, M.petrolLight);
  line(ctx, [point(x + 0.39, y + 0.39, 36), point(x + 0.39, y + 0.39, 52)], rgba(M.green, 0.78), 1.1);
}

function drawArcadeAlcove(ctx) {
  box(ctx, 1.25, 0.18, 7.3, 0.36, 21, 45, {
    top: M.petrol, left: M.petrolDeep, right: "#163C49", edge: rgba(M.cyan, 0.42),
  });
  plane(ctx, 1.54, 0.10, 6.72, 0.08, 66, "rgba(14,30,39,0.72)", rgba(M.cyan, 0.38));
  for (const x of [2.2, 4.55, 6.85]) {
    line(ctx, [point(x, 0.12, 27), point(x, 0.12, 62)], rgba(M.ivoryLight, 0.24), 0.8);
    const lamp = point(x + 0.04, 0.08, 66);
    glow(ctx, lamp.x, lamp.y, 18, 10, rgba(M.cyan, 0.10));
    ellipse(ctx, lamp.x, lamp.y, 2.4, 1.3, M.cyan);
  }
}

function drawStoneCourt(ctx) {
  insetPlane(ctx, 0.95, 1.55, 10.1, 7.75, 1.3, "rgba(232,220,194,0.92)", rgba(M.terracotta, 0.42));
  insetPlane(ctx, 3.4, 3.05, 5.15, 3.85, 2.2, "rgba(180,101,75,0.76)", rgba(M.amberLight, 0.68));
  drawFloorEmblem(ctx, 5.98, 4.92, {
    dark: M.terracottaDeep, outer: "rgba(232,220,194,0.92)", inner: "rgba(183,97,75,0.78)", mark: M.amberLight,
  });
  line(ctx, [point(1.3, 1.85, 2), point(10.55, 1.85, 2)], rgba(M.ivoryLight, 0.32), 0.8);
  line(ctx, [point(1.3, 8.9, 2), point(10.55, 8.9, 2)], rgba(M.walnutLight, 0.3), 0.8);
}

function drawStringLights(ctx) {
  const posts = {
    top: M.ivoryLight, left: M.walnut, right: M.walnutDeep, edge: rgba(M.amberLight, 0.55), glow: M.amberLight,
  };
  drawArchitecturalPost(ctx, 1.0, 0.62, posts, 82);
  drawArchitecturalPost(ctx, 11.0, 0.62, posts, 82);
  const anchors = [point(1.06, 0.68, 80), point(11.06, 0.68, 80)];
  line(ctx, anchors, rgba(M.amberLight, 0.6), 0.8);
  for (const [x, z] of [[2.3, 77], [3.9, 75], [5.55, 76], [7.2, 75], [8.8, 77], [10.15, 79]]) {
    const bulb = point(x, 0.68, z);
    glow(ctx, bulb.x, bulb.y, 12, 9, rgba(M.amberLight, 0.12));
    ellipse(ctx, bulb.x, bulb.y, 2, 1.35, M.amberLight);
  }
}

export function drawPiazzaBackground(ctx, phase = {}) {
  const colors = {
    floor: "#CFC2A7", seam: M.terracottaDeep, edge: M.ivoryLight,
    foundation: "#A88A6D", foundationDeep: "#80614E", bevel: rgba(M.ivoryLight, 0.5), bevelSoft: rgba(M.ivoryLight, 0.26),
  };
  drawOpenShell(ctx, colors, phase, "piazza");
  drawHorizon(ctx, phase);
  drawParapets(ctx);
  drawArcadeAlcove(ctx);
  drawStoneCourt(ctx);
  drawPlanter(ctx, 0.62, 1.65, M.terracotta);
  drawPlanter(ctx, 0.62, 7.18, M.terracottaDeep);
  drawStringLights(ctx);
  drawTerraceGarden(ctx);
  drawWallDoor(ctx, "right", 8.65, 10.2, {
    frame: M.walnutDeep, frameEdge: rgba(M.amberLight, 0.58), leafTop: M.walnutLight,
    leafBottom: M.walnut, panel: rgba(M.walnutDeep, 0.54), panelEdge: rgba(M.amberLight, 0.38),
    highlight: rgba(M.ivoryLight, 0.55), knob: M.amber, knobLight: M.amberLight,
    sign: M.petrolDeep, accent: M.amber,
  }, M.amberLight, "TORNEI");
}
