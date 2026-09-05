import { point, polygon, line, ellipse, glow, gradient } from "./primitives.js";
import { M } from "./furniture-helpers.js";
import { phaseId, rgba } from "./background-atmosphere.js";
import {
  drawEnclosedShell, insetPlane, wallQuad, drawWallDoor,
} from "./background-architecture.js";

const left = (c, z) => point(0, c, z);
const right = (c, z) => point(c, 0, z);

function drawWindow(ctx, phase) {
  const outer = wallQuad("left", 5.55, 7.75, 24, 101);
  const glass = wallQuad("left", 5.76, 7.54, 30, 95);
  polygon(ctx, outer, M.walnutDeep, rgba(M.walnutLight, 0.42), 1.4);
  const id = phaseId(phase);
  const skyTop = phase?.skyTop || (id === "night" ? "#243e61" : id === "dusk" ? "#d87e6b" : "#88c5cf");
  const skyBottom = phase?.skyBot || (id === "night" ? "#617394" : id === "dusk" ? "#f0bb83" : "#e5d6b8");
  polygon(ctx, glass, gradient(ctx, glass[0].x, glass[0].y, glass[2].x, glass[2].y, [
    [0, skyTop], [0.58, skyBottom], [1, "#D5B38D"],
  ]));

  const hills = [left(5.76, 37), left(5.76, 48), left(6.08, 51), left(6.42, 44), left(6.82, 54), left(7.15, 43), left(7.54, 49), left(7.54, 37)];
  polygon(ctx, hills, id === "night" ? "rgba(24,50,63,0.72)" : "rgba(62,96,91,0.64)");
  const distant = [left(5.76, 37), left(5.76, 42), left(6.05, 45), left(6.33, 40), left(6.68, 47), left(7.05, 41), left(7.54, 45), left(7.54, 37)];
  polygon(ctx, distant, id === "night" ? "rgba(52,73,91,0.76)" : "rgba(174,112,83,0.52)");
  const sun = left(6.42, id === "dusk" ? 66 : 77);
  glow(ctx, sun.x, sun.y, 35, 30, id === "night" ? "rgba(181,205,224,0.08)" : "rgba(255,212,126,0.18)");
  ellipse(ctx, sun.x, sun.y, id === "night" ? 10 : 13, id === "night" ? 10 : 11, id === "night" ? "#D6E0D9" : "#F6C56C");
  if (id !== "night") {
    line(ctx, [left(5.98, 68), left(6.34, 67), left(6.62, 68)], "rgba(255,244,220,0.6)", 1.6);
    line(ctx, [left(7.02, 59), left(7.42, 58)], "rgba(255,244,220,0.44)", 1.2);
  } else {
    for (const [c, z] of [[5.95, 76], [6.16, 57], [6.92, 79], [7.28, 66]]) {
      const star = left(c, z); ellipse(ctx, star.x, star.y, 1.15, 0.75, "rgba(255,248,220,0.78)");
    }
  }
  line(ctx, [left(6.64, 31), left(6.64, 94)], rgba(M.walnutLight, 0.72), 1.2);
  line(ctx, [left(5.78, 61), left(7.52, 61)], rgba(M.walnutLight, 0.72), 1.2);
  polygon(ctx, wallQuad("left", 5.48, 7.82, 20, 26), M.walnut, rgba(M.ivoryLight, 0.4), 0.8);
}

function drawWindowLight(ctx, phase) {
  const night = phaseId(phase) === "night";
  const sourceL = left(5.84, 29);
  const sourceR = left(7.5, 29);
  const targetL = point(1.65, 8.25, 0.9);
  const targetR = point(6.6, 9.35, 0.9);
  const light = gradient(ctx, sourceL.x, sourceL.y, targetR.x, targetR.y, [
    [0, night ? "rgba(177,209,219,0.09)" : "rgba(255,224,159,0.19)"],
    [0.52, night ? "rgba(177,209,219,0.045)" : "rgba(255,224,159,0.08)"],
    [1, "rgba(255,224,159,0)"],
  ]);
  polygon(ctx, [sourceL, sourceR, targetR, targetL], light);
  const shadow = night ? "rgba(42,62,70,0.08)" : "rgba(80,57,45,0.12)";
  for (const [c, endX, endY] of [[6.64, 4.25, 8.9], [5.82, 2.25, 8.12]]) {
    const a = left(c - 0.045, 29); const b = left(c + 0.045, 29);
    polygon(ctx, [a, b, point(endX + 0.15, endY, 1), point(endX - 0.15, endY, 1)], shadow);
  }
}

function drawCardGallery(ctx) {
  const frame = wallQuad("left", 0.72, 2.82, 43, 101);
  const art = wallQuad("left", 0.94, 2.6, 48, 96);
  polygon(ctx, frame, M.walnutDeep, rgba(M.amberLight, 0.38), 1.2);
  polygon(ctx, art, gradient(ctx, art[0].x, art[0].y, art[2].x, art[2].y, [
    [0, "#E6AE78"], [0.48, "#B86258"], [1, "#314E5A"],
  ]));
  const crest = left(1.78, 73);
  glow(ctx, crest.x, crest.y, 34, 25, "rgba(240,190,103,0.12)");
  ellipse(ctx, crest.x, crest.y, 15, 11, "rgba(32,63,70,0.68)");
  polygon(ctx, [left(1.78, 88), left(2.10, 77), left(1.86, 61), left(1.56, 77)], "rgba(242,198,117,0.82)");
  polygon(ctx, [left(1.78, 84), left(1.92, 77), left(1.78, 69), left(1.64, 77)], "rgba(255,240,202,0.82)");
  line(ctx, [left(1.07, 53), left(2.42, 53)], "rgba(255,246,221,0.68)", 1.1);
  line(ctx, [left(1.07, 49), left(2.08, 49)], "rgba(255,246,221,0.42)", 0.8);
  line(ctx, [left(0.98, 95), left(2.56, 95)], rgba(M.amberLight, 0.72), 0.9);
}

function drawBook(ctx, c, shelf, width, height, color, band) {
  polygon(ctx, wallQuad("left", c, c + width, shelf + 1.5, shelf + height), color, rgba(M.ivoryLight, 0.45), 0.45);
  line(ctx, [left(c + width * 0.28, shelf + 2.2), left(c + width * 0.28, shelf + height - 1)], rgba(M.ivoryLight, 0.35), 0.55);
  line(ctx, [left(c + 0.03, shelf + height - 2), left(c + width - 0.03, shelf + height - 2)], band, 0.9);
}

function drawTrophy(ctx, c, shelf) {
  polygon(ctx, [left(c - 0.18, shelf + 14), left(c + 0.18, shelf + 14), left(c + 0.22, shelf + 8), left(c + 0.1, shelf + 4), left(c - 0.1, shelf + 4), left(c - 0.22, shelf + 8)], M.amber);
  line(ctx, [left(c - 0.22, shelf + 12), left(c - 0.42, shelf + 11), left(c - 0.42, shelf + 8), left(c - 0.2, shelf + 8)], M.amberLight, 0.8);
  line(ctx, [left(c + 0.22, shelf + 12), left(c + 0.42, shelf + 11), left(c + 0.42, shelf + 8), left(c + 0.2, shelf + 8)], M.amberLight, 0.8);
  line(ctx, [left(c, shelf + 4), left(c, shelf + 1.8)], M.amberLight, 1);
  line(ctx, [left(c - 0.28, shelf + 1.5), left(c + 0.28, shelf + 1.5)], M.brass, 1.1);
  ellipse(ctx, left(c, shelf + 12).x, left(c, shelf + 12).y - 1, 2, 1, M.amberLight);
}

function drawGalleryShelves(ctx) {
  const panel = wallQuad("left", 3.08, 4.82, 44, 92);
  polygon(ctx, panel, "rgba(255,247,230,0.18)", rgba(M.walnutLight, 0.6), 0.9);
  for (const z of [47, 63, 79, 91]) {
    line(ctx, [left(3.16, z), left(4.74, z)], M.walnut, 1.2);
    line(ctx, [left(3.18, z + 1.3), left(4.72, z + 1.3)], rgba(M.amberLight, 0.42), 0.6);
  }
  drawBook(ctx, 3.25, 47, 0.17, 12, M.terracotta, M.amberLight);
  drawBook(ctx, 3.48, 47, 0.22, 10, M.petrolMid, M.ivoryLight);
  drawBook(ctx, 3.78, 47, 0.14, 13, M.walnutLight, M.amberLight);
  drawBook(ctx, 4.16, 63, 0.2, 12, M.moss, M.ivoryLight);
  drawBook(ctx, 4.42, 63, 0.17, 10, M.terracottaLight, M.amberLight);
  drawTrophy(ctx, 3.52, 79);
  drawBook(ctx, 4.08, 79, 0.18, 10, M.petrol, M.amberLight);
  drawBook(ctx, 4.38, 91, 0.2, 8, M.walnutLight, M.ivoryLight);
}

function drawMirror(ctx) {
  const frame = wallQuad("left", 8.05, 9.85, 30, 98);
  const glass = wallQuad("left", 8.28, 9.62, 35, 93);
  polygon(ctx, frame, M.walnutDeep, rgba(M.amberLight, 0.4), 1.2);
  polygon(ctx, wallQuad("left", 8.18, 9.72, 33, 95), M.walnutLight);
  polygon(ctx, glass, gradient(ctx, glass[0].x, glass[0].y, glass[2].x, glass[2].y, [
    [0, "#D7E4DD"], [0.42, "#96B7B7"], [1, "#527784"],
  ]));
  polygon(ctx, [left(8.52, 91), left(8.87, 91), left(8.61, 39), left(8.33, 39)], "rgba(255,255,255,0.22)");
  polygon(ctx, [left(9.14, 84), left(9.31, 84), left(9.25, 45), left(9.08, 45)], "rgba(255,255,255,0.15)");
  ellipse(ctx, left(9.17, 78).x, left(9.17, 78).y, 5, 8, "rgba(255,247,221,0.12)");
  line(ctx, [left(8.35, 48), left(9.55, 48)], "rgba(226,206,169,0.26)", 1.2);
  line(ctx, [left(8.34, 36), left(9.56, 36)], rgba(M.amberLight, 0.72), 0.8);
}

function drawBoard(ctx) {
  const outer = wallQuad("right", 2.7, 4.7, 30, 99);
  const board = wallQuad("right", 2.9, 4.5, 36, 93);
  polygon(ctx, wallQuad("right", 2.61, 4.78, 28, 101), "rgba(30,27,27,0.18)");
  polygon(ctx, outer, M.walnutDeep, rgba(M.amberLight, 0.45), 1.1);
  polygon(ctx, wallQuad("right", 2.8, 4.6, 33, 96), M.walnutLight);
  polygon(ctx, board, gradient(ctx, board[0].x, board[0].y, board[2].x, board[2].y, [
    [0, "#B98252"], [0.55, "#A56D48"], [1, "#7D4E3B"],
  ]));
  line(ctx, [right(2.94, 89), right(4.46, 89)], rgba(M.ivoryLight, 0.18), 0.7);
  line(ctx, [right(3.02, 43), right(4.42, 43)], rgba(M.walnutDeep, 0.44), 0.8);
  line(ctx, [right(3.12, 82), right(3.76, 62), right(4.27, 76)], rgba(M.terracottaDeep, 0.62), 1);
  line(ctx, [right(3.17, 65), right(3.72, 52), right(4.34, 61)], rgba(M.petrolDeep, 0.68), 1);
  const notes = [
    [2.98, 86, 3.42, 74, M.ivoryLight, M.terracotta],
    [3.52, 87, 3.91, 75, "#F1DFAE", M.petrol],
    [4.02, 86, 4.38, 72, "#F6E9D2", M.amber],
    [3.12, 67, 3.54, 55, "#EBD3C0", M.petrolMid],
    [3.82, 63, 4.32, 49, "#F7E9C9", M.terracotta],
  ];
  for (const [c0, z1, c1, z0, paper, pin] of notes) {
    polygon(ctx, wallQuad("right", c0, c1, z0, z1), paper, rgba(M.ivoryLight, 0.42), 0.5);
    ellipse(ctx, right((c0 + c1) / 2, z1 - 1.3).x, right((c0 + c1) / 2, z1 - 1.3).y, 2.1, 1.6, pin);
  }
  ellipse(ctx, right(4.33, 52).x, right(4.33, 52).y, 6, 3.5, M.amber);
  ellipse(ctx, right(4.33, 52).x, right(4.33, 52).y - 1, 2, 1.2, M.amberLight);
}

function drawCardclubFloor(ctx) {
  insetPlane(ctx, 3.0, 5.0, 3.15, 2.15, 1.8, "rgba(49,91,104,0.96)", rgba(M.terracottaLight, 0.8));
  const border = [point(3.12, 5.12, 3), point(6.03, 5.12, 3), point(6.03, 7.0, 3), point(3.12, 7.0, 3), point(3.12, 5.12, 3)];
  line(ctx, border, rgba(M.terracottaLight, 0.9), 1.25);
  line(ctx, [point(3.28, 5.3, 3.1), point(5.88, 5.3, 3.1), point(5.88, 6.82, 3.1), point(3.28, 6.82, 3.1), point(3.28, 5.3, 3.1)], rgba(M.amberLight, 0.68), 0.8);
  for (const [x, y] of [[3.65, 5.58], [4.55, 5.58], [5.45, 5.58], [3.65, 6.4], [4.55, 6.4], [5.45, 6.4]]) {
    line(ctx, [point(x, y + 0.22, 3.4), point(x + 0.22, y, 3.4), point(x, y - 0.22, 3.4), point(x - 0.22, y, 3.4), point(x, y + 0.22, 3.4)], rgba(M.terracottaLight, 0.72), 0.7);
  }
}

export function drawTournamentBackground(ctx, phase = {}) {
  const colors = {
    wallBright: M.ivoryLight, wallShade: M.ivory, panel: M.petrolDeep,
    trim: M.walnut, trimSoft: rgba(M.amberLight, 0.52), panelSeam: rgba(M.ivoryLight, 0.16),
    crown: rgba(M.ivoryLight, 0.72), crownFace: M.ivory, crownCap: M.ivoryLight,
    crownHighlight: rgba(M.ivoryLight, 0.78), crownShadow: M.walnut,
    floor: "#C89261", floorLight: "#E0B47D", floorDark: "#A46B4B", plankSeam: M.walnutDeep, grain: "#F2D09A",
    edge: M.ivoryLight, foundation: "#A88B70", foundationDeep: "#806751",
    bevel: rgba(M.ivoryLight, 0.46), bevelSoft: rgba(M.ivoryLight, 0.25),
  };
  drawEnclosedShell(ctx, colors, phase, { room: "tournament", strongFloor: true });
  drawWindowLight(ctx, phase);
  drawCardclubFloor(ctx);
  drawWindow(ctx, phase);
  drawCardGallery(ctx);
  drawGalleryShelves(ctx);
  drawMirror(ctx);
  drawBoard(ctx);
  const doorColors = {
    frame: M.walnutDeep, frameEdge: rgba(M.amberLight, 0.54), leafTop: M.walnutLight,
    leafBottom: M.walnut, panel: rgba(M.walnutDeep, 0.54), panelEdge: rgba(M.amberLight, 0.42),
    highlight: rgba(M.ivoryLight, 0.52), knob: M.amber, knobLight: M.amberLight,
    sign: M.petrolDeep, accent: M.amber,
  };
  drawWallDoor(ctx, "right", 5, 6.45, doorColors, M.amberLight, "PIAZZA");
  drawWallDoor(ctx, "right", 8.65, 10.2, doorColors, M.cyan, "ARCADE");
}
