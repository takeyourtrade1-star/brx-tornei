/*
 * Configurazione condivisa della Sala Tornei.
 * Le coordinate restano quelle del motore isometrico storico: cambiare questi
 * valori significa cambiare anche collisioni, hit-test e camera del monolite.
 */

export const HTW = 32;
export const HTH = 16;
export const COLS = 12;
export const ROWS = 10;
export const WW = 736;
export const WH = 560;
export const OX = 336;
export const OY = 150;
export const WALL_H = 112;
export const SPEED = 3.4;

/* Re-export del vocabolario Canvas già usato dal monolite e dagli altri
 * moduli room-art: una sola implementazione delle primitive isometriche. */
export {
  mkCanvas, mkSprite, tileTop, isoVec, isoBox, quadFill, shade, hexA, wallL, wallR,
} from "../arcade-room/iso-draw.js";

/* Palette calda, compatta e leggibile a bassa risoluzione. */
export const P = Object.freeze({
  bg0: "#191b2e", bg1: "#262a49",
  floorA: "#d9cdaf", floorB: "#cfc2a2", floorLine: "#b9ac8c", floorSide: "#6f6450",
  wall: "#aebfa7", wallDark: "#8da188", wallTop: "#c4d2bb",
  base: "#8a6a48", baseDark: "#6e5236",
  wood: "#a07848", woodL: "#c09a68", woodD: "#7a5836", woodXD: "#5c4128",
  felt: "#3f7d54", feltD: "#33664a", feltL: "#4f9465",
  metal: "#5a6273", metalL: "#838da1", metalD: "#3f4453",
  screen: "#8fe0ef", screenD: "#3aa8c4", screenOff: "#101826", glow: "#bdf3ff",
  cork: "#c89a62", corkD: "#a87c4a",
  paper: "#f7f1dd", paperY: "#f5e29a", paperP: "#f3b8c5",
  red: "#d94f46", redD: "#a83a34", gold: "#f2b94b", goldD: "#c98f2b",
  leaf: "#5d9e4c", leafD: "#3f7a38", pot: "#b56a44", potD: "#8e4f30",
  skin: "#f2c79a", skinD: "#d9a878", hair: "#5a4632", hoodie: "#4ba3a3", hoodieD: "#357d7d",
  pants: "#4a5577", pantsD: "#394260", shoe: "#e8e4da", outline: "#2e2a3a",
  rug: "#a8453e", rugD: "#8a3731", rugL: "#e8d7b0",
  sky: "#aee2f2", skyL: "#e6f6e8",
  ink: "#2e2a3a", night: "#10142a", white: "#ffffff", glass: "#a8c6dc",
});

export const RAR = Object.freeze({
  comune: { label: "Comune", c: "#9aa3ad", g: "#6f7780" },
  rara: { label: "Rara", c: "#4a90e2", g: "#2f6cb5" },
  epica: { label: "Epica", c: "#a05fd0", g: "#7a3fa8" },
  leggendaria: { label: "Leggendaria", c: "#e8a33d", g: "#c47f1d" },
});

/* Vani sulle pareti: stessi lati e stessi anchor del layout precedente. */
export const TOUR_DOOR = Object.freeze({ c0: 8.65, c1: 10.2, hTop: 92, hBot: 1 });
export const SOCIAL_DOOR = Object.freeze({ c0: 5.0, c1: 6.45, hTop: 92, hBot: 1 });

export const DEFAULT_CAM = Object.freeze({ x: WW / 2, y: WH / 2 + 6, z: 1 });

/* Arredi: footprint in tile, copiato dal contratto del motore principale. */
export const FURN = Object.freeze([
  { key: "plant", tiles: [[0, 0]] },
  { key: "cam", tiles: [[1, 2]] },
  { key: "desk", tiles: [[0, 3], [0, 4], [0, 5]], inter: "pc" },
  { key: "cam2", tiles: [[1, 6]] },
  { key: "chair", tiles: [[1, 4]] },
  { key: "table", tiles: [[6, 2], [7, 2], [8, 2], [6, 3], [7, 3], [8, 3], [6, 4], [7, 4], [8, 4]], inter: "decks" },
  { key: "stool", tiles: [[5, 3]] },
  { key: "stool2", tiles: [[9, 4]] },
  { key: "lamp", tiles: [[11, 0]] },
  { key: "turn", tiles: [[10, 1]] },
]);

export const DOOR_TOUR = Object.freeze({
  id: "door", name: "Porta Arcade", icon: "🕹️", desc: "Sala Giochi Retro",
  approach: [[9, 0], [10, 0], [8, 0]], footTiles: [],
  focus: { x: 636, y: 232, z: 1.45 }, faceTile: null,
  action: "changeRoom", target: "arcade",
});

export const INTERACTIVES = Object.freeze({
  pc: {
    name: "PC", icon: "🖥️", desc: "Tornei ufficiali live",
    approach: [[1, 3], [1, 5]], footTiles: [[0, 3], [0, 4], [0, 5]],
    focus: { x: 200, y: 190, z: 1.62 }, faceTile: [0, 4],
  },
  decks: {
    name: "Tavolo delle carte", icon: "🃏", desc: "Mazzi ufficiali",
    approach: [[5, 4], [9, 3], [9, 2], [6, 1], [7, 1], [8, 1], [6, 5], [7, 5], [8, 5], [5, 2]],
    footTiles: [[6, 2], [7, 2], [8, 2], [6, 3], [7, 3], [8, 3], [6, 4], [7, 4], [8, 4]],
    focus: { x: 464, y: 310, z: 1.45 }, faceTile: [7, 3],
  },
  board: {
    name: "Bacheca", icon: "📌", desc: "Crea tavolo ufficiale",
    approach: [[3, 0], [4, 0], [5, 0]], footTiles: [],
    focus: { x: 472, y: 158, z: 1.6 }, faceTile: null,
  },
  door: DOOR_TOUR,
  socialDoor: {
    name: "Porta Sala Piazza", icon: "🧑‍🤝‍🧑", desc: "Incontra gli amici online",
    approach: [[6, 0], [6, 1], [7, 0]], footTiles: [],
    focus: { x: 520, y: 232, z: 1.45 }, faceTile: null,
    action: "changeRoom", target: "piazza",
  },
});

export const MUSIC_OBJ = Object.freeze({
  id: "music", approach: [[9, 1], [10, 2], [11, 2], [9, 0]], faceTile: [10, 1],
});

export function dayPhase(hour = new Date().getHours()) {
  if (hour >= 6 && hour < 9) {
    return { id: "dawn", skyTop: "#ffd9a0", skyBot: "#ffeecf", beam: 0.15, amb: "rgba(255,170,110,0.07)", celestial: "sun", lampBoost: 1.1 };
  }
  if (hour >= 9 && hour < 17) {
    return { id: "day", skyTop: P.sky, skyBot: P.skyL, beam: 0.20, amb: null, celestial: "sun", lampBoost: 1 };
  }
  if (hour >= 17 && hour < 21) {
    return { id: "dusk", skyTop: "#f2a05c", skyBot: "#ffd9a8", beam: 0.13, amb: "rgba(130,70,140,0.10)", celestial: "sun", lampBoost: 1.2 };
  }
  return { id: "night", skyTop: "#101a3a", skyBot: "#1c2c55", beam: 0.05, amb: "rgba(18,26,70,0.22)", celestial: "moon", lampBoost: 1.5, stars: true };
}

export function resolvePhase(phase = dayPhase()) {
  const source = phase || dayPhase();
  return {
    id: typeof source.id === "string" ? source.id : "day",
    skyTop: source.skyTop || P.sky,
    skyBot: source.skyBot || P.skyL,
    beam: Number.isFinite(source.beam) ? Math.max(0, Math.min(0.22, source.beam)) : 0.2,
    amb: source.amb || null,
    celestial: source.celestial === "moon" ? "moon" : "sun",
    lampBoost: Number.isFinite(source.lampBoost) ? source.lampBoost : 1,
    stars: source.stars === true,
  };
}
