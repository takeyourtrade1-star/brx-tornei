/* Facade del catalogo arredi: il parent conserva questa singola API. */

import { buildDesk, buildCamera, buildChair } from "./furniture-desk.js";
import { buildTable } from "./furniture-table.js";
import { buildStool, buildPlant, buildLamp, buildTurntable } from "./furniture-decor.js";

export {
  buildDesk,
  buildCamera,
  buildChair,
  buildTable,
  buildStool,
  buildPlant,
  buildLamp,
  buildTurntable,
};

export function buildFurniture() {
  const meta = {};
  const plant = [0, 1, 2].map((frame) => buildPlant(frame));
  const turn = [0, 1, 2, 3].map((frame) => buildTurntable(frame));

  return {
    desk: buildDesk(meta),
    cam: buildCamera(meta, "sw"),
    camB: buildCamera(meta, "ne"),
    chair: buildChair(),
    table: buildTable(),
    stool: buildStool(),
    plant,
    lamp: buildLamp(meta),
    turn,
    meta,
  };
}
