/* Facade opzionale: consente al monolite di importare il contratto della
 * stanza da un unico percorso, mantenendo i moduli interni estraibili. */

export * from "./room-config.js";
export { buildBackground, tourDoorBounds, socialDoorBounds } from "./room-background.js";
export { buildFurniture } from "./room-furniture.js";
export { buildBoard } from "./board.js";
export { drawMonitorScene, drawMonitorScreen, screenPoint, screenSubQuad } from "./room-monitor.js";
