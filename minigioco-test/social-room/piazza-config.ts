/**
 * Configurazione, palette e layout degli arredi per Sala Piazza.
 */

export const P_PIAZZA = {
  bg0: "#0c111d",
  bg1: "#141c2e",
  wall: "#3e4c66",
  wallDark: "#2c374d",
  wallTop: "#566787",
  base: "#1f2738",
  baseDark: "#151c28",
  floorA: "#cfbf9e",
  floorB: "#c2b291",
  floorLine: "#ad9e7e",
  floorSide: "#5f533e",
  wood: "#8c6239",
  woodL: "#ad7d4c",
  woodD: "#664424",
  woodXD: "#482e16",
  feltGreen: "#235b3e",
  feltGreenL: "#347953",
  feltGreenD: "#173f2a",
  feltBlue: "#1e3a5f",
  feltBlueL: "#2d5282",
  feltBlueD: "#142740",
  carpet: "#872e2e",
  carpetL: "#a83e3e",
  carpetD: "#612020",
  sofa: "#963c36",
  sofaL: "#b54e47",
  sofaD: "#6b2722",
  neonCyan: "#05d9e8",
  neonOrange: "#ff6b35",
  neonPurple: "#b026ff",
  neonYellow: "#ffd166",
  gold: "#f2b94b",
  goldD: "#c98f2b",
  metal: "#4a5568",
  metalL: "#718096",
  metalD: "#2d3748",
  skyTop: "#4ea8de",
  skyBot: "#90e0ef",
  sun: "#ffe66d",
} as const;

export interface PiazzaFurnDef {
  readonly key: string;
  readonly tiles: readonly (readonly [number, number])[];
  readonly inter?: string;
}

export const FURN_PIAZZA: readonly PiazzaFurnDef[] = [
  { key: "cab1", tiles: [[2, 1], [3, 1]], inter: "cab1" },
  { key: "cab2", tiles: [[4, 1], [5, 1]], inter: "cab2" },
  { key: "cab3", tiles: [[6, 1], [7, 1]], inter: "cab3" },
  { key: "table1", tiles: [[2, 5], [3, 5], [2, 6], [3, 6]], inter: "table1" },
  { key: "table2", tiles: [[7, 5], [8, 5], [7, 6], [8, 6]], inter: "table2" },
  { key: "plant1", tiles: [[0, 0]] },
  { key: "plant2", tiles: [[11, 8]] },
  { key: "bench", tiles: [[10, 4], [10, 5]] },
];

export const tkey = (x: number, y: number): string => `${Math.round(x)},${Math.round(y)}`;

export function getBlockedPiazzaTiles(): Set<string> {
  const blocked = new Set<string>();
  for (const f of FURN_PIAZZA) {
    for (const [x, y] of f.tiles) {
      blocked.add(tkey(x, y));
    }
  }
  // Muri e limiti esterni
  for (let x = 0; x < 12; x++) blocked.add(tkey(x, 0));
  for (let y = 0; y < 10; y++) blocked.add(tkey(0, y));
  // Vano porta tornei libero per accesso
  blocked.delete(tkey(9, 1));
  blocked.delete(tkey(10, 1));
  return blocked;
}

export interface PiazzaInteractiveDef {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly desc: string;
  readonly approach: readonly (readonly [number, number])[];
  readonly inspectionText: string;
}

export const INTERACTIVES_PIAZZA: Record<string, PiazzaInteractiveDef> = {
  cab1: {
    id: "cab1",
    name: "Pixel Strike",
    icon: "🕹️",
    desc: "Cabinato Arcade #1 (Fuori servizio)",
    approach: [[2, 2], [3, 2]],
    inspectionText: "Cabinato 'Pixel Strike': fuori servizio per manutenzione! In arrivo presto 🕹️",
  },
  cab2: {
    id: "cab2",
    name: "Dragon Clash",
    icon: "🕹️",
    desc: "Cabinato Arcade #2 (Fuori servizio)",
    approach: [[4, 2], [5, 2]],
    inspectionText: "Cabinato 'Dragon Clash': scheda madre in test. Sarà giocabile nei prossimi update! 🐉",
  },
  cab3: {
    id: "cab3",
    name: "Space Duellist",
    icon: "🕹️",
    desc: "Cabinato Arcade #3 (Fuori servizio)",
    approach: [[6, 2], [7, 2]],
    inspectionText: "Cabinato 'Space Duellist': gettoniera in calibrazione. In arrivo presto! 🚀",
  },
  table1: {
    id: "table1",
    name: "Tavolo Duelli Verde",
    icon: "🃏",
    desc: "Tavolo da gioco con playmat verde smeraldo",
    approach: [[1, 5], [1, 6], [4, 5], [4, 6], [2, 4], [3, 4], [2, 7], [3, 7]],
    inspectionText: "Tavolo Duelli Verde: mazzo pronto e carte distribuite sul playmat! 🃏",
  },
  table2: {
    id: "table2",
    name: "Tavolo Duelli Blu",
    icon: "🎴",
    desc: "Tavolo da gioco con playmat blu indaco",
    approach: [[6, 5], [6, 6], [9, 5], [9, 6], [7, 4], [8, 4], [7, 7], [8, 7]],
    inspectionText: "Tavolo Duelli Blu: contasegnalini e dadi pronti per una sfida strategica! 🎴",
  },
  door: {
    id: "door",
    name: "Porta Tornei",
    icon: "🏆",
    desc: "Torna alla Sala Tornei principale",
    approach: [[9, 1], [10, 1]],
    inspectionText: "Porta verso la Sala Tornei Ebartex.",
  },
  window: {
    id: "window",
    name: "Finestra panoramica",
    icon: "☀️",
    desc: "Finestra con vista sulla città",
    approach: [[1, 3], [1, 4], [1, 7], [1, 8]],
    inspectionText: "Il sole splende fuori... una giornata perfetta per sfidarsi a carte in piazza! ☀️",
  },
};
