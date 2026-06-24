import { WW, WH } from "./iso-draw.js";
export const P_ARCADE = {
  bg0: "#0d0d1a", bg1: "#12122a",
  floorA: "#12122a", floorB: "#0d0d1a", floorLine: "#1a1a3a", floorSide: "#08080f",
  wall: "#15152e", wallDark: "#0e0e1e", wallTop: "#1a1a38", base: "#0a0a18", baseDark: "#06060f",
  cabinet: "#1a1a2e", cabinetL: "#252542", cabinetD: "#101022",
  screen: "#00ff9d", screenD: "#04231f",
  neonPink: "#ff2a6d", neonBlue: "#05d9e8", neonGreen: "#39ff14",
  neonPurple: "#b026ff", neonYellow: "#fff01f",
  wood: "#3a2a1e", woodL: "#5a4a3e", woodD: "#2a1a0e",
  felt: "#1a3a2e", feltD: "#0e2a1e", feltL: "#2a5a3e",
  metal: "#3a3a4e", metalL: "#5a5a6e", metalD: "#1a1a2e",
  red: "#d94f46", gold: "#f2b94b", outline: "#06060f",
  sofa: "#a8453e", sofaD: "#7a2e28", sofaL: "#c85a52",
  popcorn: "#f5e29a", popcornD: "#c9a834",
};
export const ARC_DEFAULT_CAM = { x: WW / 2, y: WH / 2 + 6, z: 1 };
export const FURN_ARCADE = [
  { key: "cabinet1", tiles: [[2, 2], [3, 2]], inter: "arcade1" },
  { key: "cabinet2", tiles: [[5, 2], [6, 2]], inter: "arcade2" },
  { key: "cabinet3", tiles: [[8, 2], [9, 2]], inter: "arcade3" },
  { key: "kakeTable", tiles: [[5, 6], [6, 6], [5, 7], [6, 7]], inter: "kakegurui" },
  { key: "sofa", tiles: [[2, 7], [3, 7]] },
  { key: "ticket", tiles: [[10, 3]] },
  { key: "popcorn", tiles: [[1, 6]] },
];
export const INTERACTIVES_ARCADE = {
  arcade1: { name: "Stack Attack", icon: "🎮", desc: "Torre di carte", approach: [[2, 3], [3, 3]], footTiles: [[2, 2], [3, 2]], focus: { x: 340, y: 220, z: 1.55 }, faceTile: [2, 2], game: "stackAttack" },
  arcade2: { name: "TCG Jump", icon: "🎮", desc: "Platformer · 3 livelli", approach: [[5, 3], [6, 3]], footTiles: [[5, 2], [6, 2]], focus: { x: 436, y: 220, z: 1.55 }, faceTile: [5, 2], game: "tcgJump" },
  arcade3: { name: "Card Memory", icon: "🎮", desc: "Memory · 3 livelli", approach: [[8, 3], [9, 3]], footTiles: [[8, 2], [9, 2]], focus: { x: 532, y: 220, z: 1.55 }, faceTile: [8, 2], game: "cardMemory" },
  kakegurui: { name: "Tavolo Duello", icon: "🎴", desc: "Sasso/Carta/Forbice", approach: [[4, 6], [7, 6], [5, 8], [6, 8]], footTiles: [[5, 6], [6, 6], [5, 7], [6, 7]], focus: { x: 436, y: 380, z: 1.45 }, faceTile: [5, 7], game: "kakegurui" },
  doorBack: { name: "Porta Tornei", icon: "🏆", desc: "Torna alla Sala Tornei", approach: [[1, 4], [1, 5], [1, 3]], footTiles: [], focus: { x: 188, y: 184, z: 1.42 }, faceTile: [0, 4], action: "changeRoom", target: "tournament" },
};
export const DOOR_TOUR = { id: "door", name: "Porta Arcade", icon: "🕹️", desc: "Sala Giochi Retro", approach: [[9, 0], [10, 0], [8, 0]], footTiles: [], focus: { x: 636, y: 232, z: 1.45 }, faceTile: null, action: "changeRoom", target: "arcade" };
export const STATIONS = [
  { id: "tcgJump", name: "TCG Jump", kind: "Platformer", accent: "#39ff14", icon: "🍄" },
  { id: "stackAttack", name: "Stack Attack", kind: "Timing", accent: "#05d9e8", icon: "🃏" },
  { id: "cardMemory", name: "Card Memory", kind: "Memory", accent: "#b026ff", icon: "🧠" },
  { id: "kakegurui", name: "Tavolo Duello", kind: "1v1 · Sasso/Carta/Forbice", accent: "#ff2a6d", icon: "🎴" },
];
export const ARC_ENTRY_TILE = { cx: 1, cy: 4 };
export const TOUR_ENTRY_TILE = { cx: 10, cy: 4 };
