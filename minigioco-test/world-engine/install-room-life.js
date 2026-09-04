import { installPetFootPoint } from "./pet-foot-point";
import { installDoMusicToggle } from "./do-music-toggle";
import { installDoRing } from "./do-ring";
import { installEnterShadow } from "./enter-shadow";
import { installExitShadow } from "./exit-shadow";
import { installPetCat } from "./pet-cat";
import { installPetDog } from "./pet-dog";
import { installEggClick } from "./egg-click";
import { installBurstLetterFx } from "./burst-letter-fx";
import { installSpawnLetter } from "./spawn-letter";
import { installStartLetterOpening } from "./start-letter-opening";
import { installAdvanceLetterToReveal } from "./advance-letter-to-reveal";
import { installCloseLetterReward } from "./close-letter-reward";
import { installStartHype } from "./start-hype";
import { installShiftStep } from "./shift-step";
import { installUpdate } from "./update";

export function installRoomLife(engine) {
  installPetFootPoint(engine);
  installDoMusicToggle(engine);
  installDoRing(engine);
  installEnterShadow(engine);
  installExitShadow(engine);
  installPetCat(engine);
  installPetDog(engine);
  installEggClick(engine);
  installBurstLetterFx(engine);
  installSpawnLetter(engine);
  installStartLetterOpening(engine);
  installAdvanceLetterToReveal(engine);
  installCloseLetterReward(engine);
  installStartHype(engine);
  installShiftStep(engine);
  installUpdate(engine);
}
