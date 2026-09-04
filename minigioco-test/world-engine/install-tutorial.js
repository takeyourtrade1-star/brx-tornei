import { installTutSay } from "./tut-say";
import { installTutBeginStep } from "./tut-begin-step";
import { installTutAdvance } from "./tut-advance";
import { installTutTick } from "./tut-tick";
import { installTutShowOutro } from "./tut-show-outro";
import { installTutRestart } from "./tut-restart";
import { installEndTutorial } from "./end-tutorial";
import { installUpdateSpettro } from "./update-spettro";
import { installDrawSpettroCompanion } from "./draw-spettro-companion";

export function installTutorial(engine) {
  installTutSay(engine);
  installTutBeginStep(engine);
  installTutAdvance(engine);
  installTutTick(engine);
  installTutShowOutro(engine);
  installTutRestart(engine);
  installEndTutorial(engine);
  installUpdateSpettro(engine);
  installDrawSpettroCompanion(engine);
}
