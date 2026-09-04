import { disposeWorld } from "../world-engine/dispose-world";
import { installInteraction } from "../world-engine/install-interaction";
import { installTutorial } from "../world-engine/install-tutorial";
import { installRoomLife } from "../world-engine/install-room-life";
import { installRendering } from "../world-engine/install-rendering";
import { installInput } from "../world-engine/install-input";
import { initializeScenes } from "../world-engine/initialize-scenes";
import { initializeState } from "../world-engine/initialize-state";
import { initializeDrawing } from "../world-engine/initialize-drawing";
import { initializeLetterArt } from "../world-engine/initialize-letter-art";
import { initializeRuntime } from "../world-engine/initialize-runtime";
import { initializeApi } from "../world-engine/initialize-api";

/** Un motore per mount; le fasi mantengono lo stato confinato a questa istanza. */
export function createGame(canvas, wrap, apiRef, dbg, opts = {}) {
  const engine = { canvas, wrap, apiRef, dbg, opts };
  try {
    installInteraction(engine);
    installTutorial(engine);
    installRoomLife(engine);
    installRendering(engine);
    installInput(engine);
    initializeScenes(engine);
    initializeState(engine);
    initializeDrawing(engine);
    initializeLetterArt(engine);
    initializeRuntime(engine);
    initializeApi(engine);
    return engine.api;
  } catch (error) {
    disposeWorld(engine);
    throw error;
  }
}
