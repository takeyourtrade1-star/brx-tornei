import { WW, WH } from "../arcade-room/iso-draw.js";
import { P_ARCADE } from "../arcade-room/arcade-config.js";

/* Palette della Sala Piazza: calda, accogliente, con pavimentazione classica
   a mattonelle e legno, arricchita dalla luce delle finestre e dai neon arcade. */
export const P_PIAZZA = {
  ...P_ARCADE,
  bg0: "#101626", bg1: "#192238",
  wall: "#4a5b78", wallDark: "#344259", wallTop: "#63789c", base: "#232e42", baseDark: "#182030",
  floorA: "#cfbf9e", floorB: "#c2b291", floorLine: "#ad9e7e", floorSide: "#5f533e",
  wood: "#8c6239", woodL: "#ad7d4c", woodD: "#664424", woodXD: "#482e16",
  feltGreen: "#235b3e", feltGreenL: "#347953", feltGreenD: "#173f2a",
  feltBlue: "#1e3a5f", feltBlueL: "#2d5282", feltBlueD: "#142740",
  carpet: "#872e2e", carpetL: "#a83e3e", carpetD: "#612020",
  gold: "#f2b94b", goldD: "#c98f2b",
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
    name: "Pixel Strike",
    icon: "🕹️",
    desc: "Cabinato Arcade #1 · Fuori servizio",
    approach: [[2, 2], [3, 2]],
    footTiles: [[2, 1], [3, 1]],
    focus: { x: 340, y: 190, z: 1.55 },
    faceTile: [2, 1],
    action: "inspect",
    bubbleText: "Cabinato 'Pixel Strike': fuori servizio per manutenzione! In arrivo presto 🕹️",
  },
  piazzaCab2: {
    name: "Dragon Clash",
    icon: "🕹️",
    desc: "Cabinato Arcade #2 · Fuori servizio",
    approach: [[4, 2], [5, 2]],
    footTiles: [[4, 1], [5, 1]],
    focus: { x: 436, y: 190, z: 1.55 },
    faceTile: [4, 1],
    action: "inspect",
    bubbleText: "Cabinato 'Dragon Clash': collaudo scheda in corso. Sarà giocabile a breve! 🐉",
  },
  piazzaCab3: {
    name: "Space Duellist",
    icon: "🕹️",
    desc: "Cabinato Arcade #3 · Fuori servizio",
    approach: [[6, 2], [7, 2]],
    footTiles: [[6, 1], [7, 1]],
    focus: { x: 532, y: 190, z: 1.55 },
    faceTile: [6, 1],
    action: "inspect",
    bubbleText: "Cabinato 'Space Duellist': gettoniera in calibrazione. In arrivo presto! 🚀",
  },
  piazzaTable1: {
    name: "Tavolo Duelli Verde",
    icon: "🃏",
    desc: "Tavolo da gioco TCG con playmat verde",
    approach: [[1, 4], [1, 5], [4, 4], [4, 5], [2, 3], [3, 3], [2, 6], [3, 6]],
    footTiles: [[2, 4], [3, 4], [2, 5], [3, 5]],
    focus: { x: 380, y: 320, z: 1.45 },
    faceTile: [2, 4],
    action: "inspect",
    bubbleText: "Tavolo Duelli Verde: mazzi pronti sul playmat per una sfida amichevole! 🃏",
  },
  piazzaTable2: {
    name: "Tavolo Duelli Blu",
    icon: "🎴",
    desc: "Tavolo da gioco TCG con playmat blu",
    approach: [[5, 4], [5, 5], [8, 4], [8, 5], [6, 3], [7, 3], [6, 6], [7, 6]],
    footTiles: [[6, 4], [7, 4], [6, 5], [7, 5]],
    focus: { x: 520, y: 320, z: 1.45 },
    faceTile: [6, 4],
    action: "inspect",
    bubbleText: "Tavolo Duelli Blu: segnalini e dadi pronti per una partita strategica! 🎴",
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
