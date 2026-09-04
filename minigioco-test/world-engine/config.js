/* Contratti del motore: le coordinate e gli oggetti appartengono ai moduli
 * stanza/avatar. Qui restano soltanto alias compatibili e regole comuni. */

import {
  COLS,
  DEFAULT_CAM,
  FURN,
  HTH,
  HTW,
  INTERACTIVES,
  OX,
  OY,
  ROWS,
  WW,
  WH,
  dayPhase,
} from "../room-art/room-config.js";
import {
  ARC_DEFAULT_CAM,
  ARC_ENTRY_TILE,
  FURN_ARCADE,
  INTERACTIVES_ARCADE,
  TOUR_ENTRY_TILE,
} from "../arcade-room/arcade-config.js";
import {
  FURN_PIAZZA,
  INTERACTIVES_PIAZZA,
  PIAZZA_DEFAULT_CAM,
  PIAZZA_ENTRY_TILE,
} from "../social-room/piazza-config.js";
import { DEFAULT_LOOK } from "../avatar/avatar-sprite-renderer";

export {
  COLS,
  DEFAULT_CAM,
  FURN,
  HTH,
  HTW,
  INTERACTIVES,
  OX,
  OY,
  ROWS,
  WW,
  WH,
  dayPhase,
};

export const WORLD_WIDTH = WW;
export const WORLD_HEIGHT = WH;
export const TILE_HALF_WIDTH = HTW;
export const TILE_HALF_HEIGHT = HTH;
export const GRID_COLS = COLS;
export const GRID_ROWS = ROWS;
export const WORLD_ORIGIN_X = OX;
export const WORLD_ORIGIN_Y = OY;
export const AVATAR_SPEED = 3.4;
export const CAMERA_MARGIN = 20;
export const DEFAULT_CAMERA = DEFAULT_CAM;

export { DEFAULT_LOOK };

export const DEFAULT_PROTOTYPE_STATS = Object.freeze({ giocati: 0, vinti: 0 });
export const EMPTY_STATS = Object.freeze({ giocati: 0, vinti: 0 });

export const ROOM_IDS = Object.freeze(["tournament", "arcade", "piazza"]);
export const OFFICIAL_SURFACE_IDS = new Set(["pc", "board", "decks"]);
export const ARCADE_GAME_IDS = new Set(["arcade1", "arcade2", "arcade3", "kakegurui"]);

/* Gli alias mantengono il contratto iniziale dell'engine senza ricopiare
 * footprint o modalita: arcade e Piazza restano single source of truth. */
export const ROOM_FURNITURE = Object.freeze({
  tournament: FURN,
  arcade: FURN_ARCADE,
  piazza: FURN_PIAZZA,
});

export const ROOM_INTERACTIVES = Object.freeze({
  tournament: INTERACTIVES,
  arcade: INTERACTIVES_ARCADE,
  piazza: INTERACTIVES_PIAZZA,
});

export const ROOM_DEFAULTS = Object.freeze({
  tournament: { camera: DEFAULT_CAM, entry: { cx: 10, cy: 9 } },
  arcade: { camera: ARC_DEFAULT_CAM, entry: ARC_ENTRY_TILE },
  piazza: { camera: PIAZZA_DEFAULT_CAM, entry: PIAZZA_ENTRY_TILE },
});

export const ROOM_DOORS = Object.freeze({
  tournament: { arcade: "door", piazza: "socialDoor" },
  arcade: { tournament: "doorBack" },
  piazza: { tournament: "doorBack" },
});

/* Mantiene i due ingressi usati dal flusso di transizione del motore legacy. */
export const ROOM_ENTRY_TILES = Object.freeze({
  tournament: TOUR_ENTRY_TILE,
  arcade: ARC_ENTRY_TILE,
  piazza: PIAZZA_ENTRY_TILE,
});

export function normalizeStats(value, integrationMode = "prototype") {
  const fallback = integrationMode === "site" ? EMPTY_STATS : DEFAULT_PROTOTYPE_STATS;
  const giocati = Number(value && value.giocati);
  const vinti = Number(value && value.vinti);
  if (!Number.isFinite(giocati) || !Number.isFinite(vinti)) return { ...fallback };
  return {
    giocati: Math.max(0, Math.floor(giocati)),
    vinti: Math.max(0, Math.min(Math.floor(vinti), Math.floor(giocati))),
  };
}

export function initialRoom(value) {
  return ROOM_IDS.includes(value) ? value : "tournament";
}
