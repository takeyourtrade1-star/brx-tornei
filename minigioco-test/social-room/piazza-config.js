import { WW, WH } from "../arcade-room/iso-draw.js";
import { P_ARCADE } from "../arcade-room/arcade-config.js";

/* Palette della Sala Piazza: pietra calda, verde salvia e legno di noce.
   I neon arcade restano gli accenti ludici del club, mentre pavimento e pareti
   usano contrasti più morbidi per mantenere leggibili avatar e chat. */
export const P_PIAZZA = {
  ...P_ARCADE,
  bg0: "#17252b", bg1: "#29434a",
  wall: "#5c7774", wallDark: "#3d5759", wallTop: "#86a39a", base: "#2a3c40", baseDark: "#1c2b30",
  wallPanel: "#68847d", wallPanelDark: "#496560", wallTrim: "#a4b9a8",
  floorA: "#d8c89e", floorB: "#c9b78d", floorLine: "#ad9c78", floorSide: "#655945",
  floorPathA: "#e2d5b2", floorPathB: "#d5c59f", floorInset: "#9d8763",
  wood: "#9b6b3e", woodL: "#c78f58", woodD: "#6b4427", woodXD: "#482b1a",
  feltGreen: "#2b7650", feltGreenL: "#4a9a6d", feltGreenD: "#1b4e36",
  feltBlue: "#28577b", feltBlueL: "#4b7fa4", feltBlueD: "#173b58",
  feltEdge: "#b7d7b0", carpet: "#874047", carpetL: "#ab5a59", carpetD: "#612b32",
  gold: "#f5c65c", goldD: "#c58b32", paper: "#fff2c9", paperSoft: "#e7d7ad", ink: "#20232a",
  lantern: "#ffd978", lanternD: "#bc7140", lanternGlow: "#ffe6a2",
  leaf: "#4f9159", leafL: "#79bd6d", leafD: "#2f603d", pot: "#b86545", potD: "#81402f",
  stone: "#8b8d78", stoneL: "#b5af8d", stoneD: "#5e625a",
  screenA: "#07382d", screenB: "#0c3150", screenC: "#28153f",
  sofa: "#b56b55", sofaD: "#7b4039", sofaL: "#d58a68",
  neonBlue: "#5ddbd3", neonGreen: "#80d96a", neonPurple: "#c084e8", neonPink: "#f47d9d",
  skyTop: "#4ea8de", skyBot: "#90e0ef", sun: "#ffe66d",
};

export const PIAZZA_DEFAULT_CAM = { x: WW / 2, y: WH / 2 + 6, z: 1 };
export const PIAZZA_ENTRY_TILE = { cx: 9, cy: 3 };

/* Arredi della Sala Piazza:
   - 3 cabinati arcade lungo la parete di fondo
   - 2 tavolini da gioco TCG con sedie
   - panca e arredi decorativi */
export const FURN_PIAZZA = [
  { key: "cabinet1", tiles: [[2, 1], [3, 1]], inter: "piazzaCab1" },
  { key: "cabinet2", tiles: [[4, 1], [5, 1]], inter: "piazzaCab2" },
  { key: "cabinet3", tiles: [[6, 1], [7, 1]], inter: "piazzaCab3" },
  { key: "table1", tiles: [[2, 4], [3, 4], [2, 5], [3, 5]], inter: "piazzaTable1" },
  { key: "table2", tiles: [[6, 4], [7, 4], [6, 5], [7, 5]], inter: "piazzaTable2" },
  { key: "plant", tiles: [[0, 0]] },
  { key: "bench", tiles: [[10, 4], [10, 5]] },
];

export const INTERACTIVES_PIAZZA = {
  piazzaCab1: {
    name: "Stack Attack",
    icon: "🕹️",
    desc: "Minigioco arcade · Stack Attack",
    approach: [[2, 2], [3, 2]],
    footTiles: [[2, 1], [3, 1]],
    focus: { x: 340, y: 190, z: 1.55 },
    faceTile: [2, 1],
    modalId: "arcade1",
  },
  piazzaCab2: {
    name: "TCG Jump",
    icon: "🕹️",
    desc: "Minigioco arcade · TCG Jump",
    approach: [[4, 2], [5, 2]],
    footTiles: [[4, 1], [5, 1]],
    focus: { x: 436, y: 190, z: 1.55 },
    faceTile: [4, 1],
    modalId: "arcade2",
  },
  piazzaCab3: {
    name: "Card Memory",
    icon: "🕹️",
    desc: "Minigioco arcade · Card Memory",
    approach: [[6, 2], [7, 2]],
    footTiles: [[6, 1], [7, 1]],
    focus: { x: 532, y: 190, z: 1.55 },
    faceTile: [6, 1],
    modalId: "arcade3",
  },
  piazzaTable1: {
    name: "Tavoli degli amici",
    icon: "🃏",
    desc: "Apri i tavoli ufficiali e scegli dove giocare",
    approach: [[1, 4], [1, 5], [4, 4], [4, 5], [2, 3], [3, 3], [2, 6], [3, 6]],
    footTiles: [[2, 4], [3, 4], [2, 5], [3, 5]],
    focus: { x: 380, y: 320, z: 1.45 },
    faceTile: [2, 4],
    modalId: "pc",
  },
  piazzaTable2: {
    name: "Crea una sfida",
    icon: "🎴",
    desc: "Apri la creazione del tavolo ufficiale",
    approach: [[5, 4], [5, 5], [8, 4], [8, 5], [6, 3], [7, 3], [6, 6], [7, 6]],
    footTiles: [[6, 4], [7, 4], [6, 5], [7, 5]],
    focus: { x: 520, y: 320, z: 1.45 },
    faceTile: [6, 4],
    modalId: "board",
  },
  doorBack: {
    name: "Porta Tornei",
    icon: "🏆",
    desc: "Torna alla Sala Tornei principale",
    approach: [[9, 2], [10, 2], [9, 1], [10, 1]],
    footTiles: [],
    focus: { x: 620, y: 220, z: 1.42 },
    faceTile: [9, 0],
    action: "changeRoom",
    target: "tournament",
  },
};
