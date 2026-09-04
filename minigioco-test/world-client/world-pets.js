import { mkCanvas, outlined } from "./world-geometry";
export function buildCat() {
  const C = { fur: "#e8a04c", dark: "#c27d2f", belly: "#f7e3c0", ear: "#a8632a", eye: "#2e2a3a", nose: "#d4716b" };
  const mk = (draw, flip) => {
    const raw = { cv: mkCanvas(26, 22), ax: 0, ay: 0 };
    const ctx = raw.cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (flip) { ctx.translate(26, 0); ctx.scale(-1, 1); }
    const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    draw(px);
    ctx.restore();
    const sp = outlined(raw);
    sp.feet = { x: 13, y: 22 };
    return sp;
  };
  const walkFr = (f) => (px) => {
    // corpo orizzontale, testa a destra
    px(3, 9, 13, 7, C.fur);
    px(4, 14, 11, 2, C.belly);
    px(5, 9, 2, 6, C.dark); px(9, 9, 2, 6, C.dark); px(13, 9, 2, 6, C.dark); // strisce
    // zampe alternate
    px(4 + (f ? 1 : 0), 16, 2, 4, C.fur); px(8 - (f ? 1 : 0), 16, 2, 4, C.fur);
    px(12 + (f ? -1 : 0), 16, 2, 4, C.fur); px(15 + (f ? 1 : 0), 16, 2, 4, C.fur);
    // coda su, con punta scura
    px(1, 5 + (f ? 1 : 0), 2, 5, C.fur); px(1, 4 + (f ? 1 : 0), 2, 2, C.dark);
    // testa
    px(15, 4, 8, 7, C.fur);
    px(15, 2, 2, 3, C.ear); px(21, 2, 2, 3, C.ear);
    px(17, 6, 1, 2, C.eye); px(20, 6, 1, 2, C.eye);
    px(18, 9, 2, 1, C.nose);
  };
  const sitFr = (f) => (px) => {
    // seduto, coda che scodinzola
    px(7, 9, 10, 9, C.fur);
    px(9, 13, 6, 5, C.belly);
    px(8, 10, 2, 5, C.dark); px(13, 10, 2, 5, C.dark);
    px(8, 18, 3, 2, C.fur); px(13, 18, 3, 2, C.fur);
    // coda
    px(17 + (f ? 1 : 0), 13 - (f ? 2 : 0), 2, 6, C.fur);
    px(17 + (f ? 1 : 0), 12 - (f ? 2 : 0), 2, 2, C.dark);
    // testa
    px(8, 2, 8, 7, C.fur);
    px(8, 0, 2, 3, C.ear); px(14, 0, 2, 3, C.ear);
    px(10, 4, 1, 2, C.eye); px(13, 4, 1, 2, C.eye);
    px(11, 7, 2, 1, C.nose);
  };
  const sleepFr = (f) => (px) => {
    // gomitolo che respira
    const b = f ? 1 : 0;
    px(5, 13 - b, 15, 6 + b, C.fur);
    px(6, 11 - b, 13, 2, C.fur);
    px(7, 12 - b, 2, 3, C.dark); px(11, 11 - b, 2, 3, C.dark); px(15, 12 - b, 2, 3, C.dark);
    // testa appoggiata
    px(15, 9 - b, 7, 6, C.fur);
    px(15, 7 - b, 2, 3, C.ear); px(20, 7 - b, 2, 3, C.ear);
    px(17, 12 - b, 2, 1, C.eye); // occhi chiusi (lineetta)
    px(20, 12 - b, 1, 1, C.eye);
    // coda avvolta davanti
    px(4, 16, 12, 2, C.dark);
  };
  const pose = (fr) => [mk(fr(0), false), mk(fr(1), false), mk(fr(0), true), mk(fr(1), true)];
  return { walk: pose(walkFr), sit: pose(sitFr), sleep: pose(sleepFr) };
}

/* ====================== 5c. CANE HUSKY (pixel-art) ========================= */
/* "Cookie", husky grigia/bianca. Pose: sleep / sit / walk. */

export function buildDog() {
  const C = { fur: "#4a4e59", dark: "#2c2e35", belly: "#ffffff", ear: "#383b43", eye: "#825329", nose: "#1d1e22" };
  const mk = (draw, flip) => {
    const raw = { cv: mkCanvas(32, 26), ax: 0, ay: 0 };
    const ctx = raw.cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (flip) { ctx.translate(32, 0); ctx.scale(-1, 1); }
    const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    draw(px);
    ctx.restore();
    const sp = outlined(raw);
    sp.feet = { x: 16, y: 26 };
    return sp;
  };
  const walkFr = (f) => (px) => {
    // corpo, testa a destra
    px(4, 9, 17, 9, C.fur);
    px(5, 15, 15, 3, C.belly);
    px(4, 9, 8, 5, C.dark);
    // zampe
    px(5 + (f ? 2 : 0), 18, 2, 6, C.fur); px(5 + (f ? 2 : 0), 23, 2, 1, C.belly);
    px(10 - (f ? 2 : 0), 18, 2, 6, C.fur); px(10 - (f ? 2 : 0), 23, 2, 1, C.belly);
    px(15 + (f ? -2 : 0), 18, 2, 6, C.fur); px(15 + (f ? -2 : 0), 23, 2, 1, C.belly);
    px(19 + (f ? 2 : 0), 18, 2, 6, C.fur); px(19 + (f ? 2 : 0), 23, 2, 1, C.belly);
    // coda
    px(1, 4 + (f ? 1 : 0), 4, 7, C.fur); px(2, 3 + (f ? 1 : 0), 2, 2, C.belly);
    // testa (faccia bianca, retro scuro)
    px(20, 3, 9, 9, C.belly);
    px(20, 3, 3, 9, C.fur);
    px(20, 0, 3, 4, C.dark); px(25, 0, 3, 4, C.dark);
    px(21, 1, 1, 3, C.belly); px(26, 1, 1, 3, C.belly);
    px(22, 5, 1, 2, C.eye); px(26, 5, 1, 2, C.eye);
    px(27, 8, 3, 2, C.nose);
  };
  const sitFr = (f) => (px) => {
    px(8, 9, 13, 12, C.fur);
    px(8, 9, 10, 5, C.dark);
    px(10, 14, 8, 7, C.belly);
    // zampe
    px(9, 21, 3, 3, C.fur); px(9, 23, 3, 1, C.belly);
    px(16, 21, 3, 3, C.fur); px(16, 23, 3, 1, C.belly);
    // coda
    px(21 + (f ? 1 : 0), 14 - (f ? 1 : 0), 4, 7, C.fur); px(22 + (f ? 1 : 0), 13 - (f ? 1 : 0), 3, 3, C.belly);
    // testa (maschera bianca husky)
    px(10, 2, 10, 9, C.belly);
    px(10, 2, 10, 2, C.fur);
    px(10, 4, 1, 5, C.fur); px(19, 4, 1, 5, C.fur);
    px(10, 0, 3, 3, C.dark); px(17, 0, 3, 3, C.dark);
    px(11, 1, 1, 2, C.belly); px(18, 1, 1, 2, C.belly);
    px(12, 4, 1, 2, C.eye); px(16, 4, 1, 2, C.eye);
    px(14, 7, 3, 2, C.nose);
  };
  const sleepFr = (f) => (px) => {
    const b = f ? 1 : 0;
    px(6, 12 - b, 20, 9 + b, C.fur);
    px(6, 12 - b, 15, 5, C.dark);
    px(11, 15 - b, 10, 4, C.belly);
    // testa
    px(18, 8 - b, 10, 8, C.belly);
    px(18, 8 - b, 4, 8, C.fur);
    px(18, 5 - b, 3, 4, C.dark); px(24, 5 - b, 3, 4, C.dark);
    px(21, 11 - b, 2, 1, C.dark); px(24, 11 - b, 2, 1, C.dark);
    px(5, 17, 15, 4, C.fur); px(4, 18, 4, 3, C.belly);
  };
  const pose = (fr) => [mk(fr(0), false), mk(fr(1), false), mk(fr(0), true), mk(fr(1), true)];
  return { walk: pose(walkFr), sit: pose(sitFr), sleep: pose(sleepFr) };
}

/* ============================ 6. AUDIO ================================= */
