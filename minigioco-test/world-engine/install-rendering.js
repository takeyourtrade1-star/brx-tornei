import { installDrawGlow } from "./draw-glow";
import { installDrawCatSprite } from "./draw-cat-sprite";
import { installDrawDogSprite } from "./draw-dog-sprite";
import { installDrawMonitorScreen } from "./draw-monitor-screen";
import { installDrawTableClock } from "./draw-table-clock";
import { installDrawAvatarSprite } from "./draw-avatar-sprite";
import { installDrawGhostSprite } from "./draw-ghost-sprite";
import { installRender } from "./render";
import { installDrawWatermark } from "./draw-watermark";
import { installTakePhoto } from "./take-photo";
import { installDrawCreditsReward } from "./draw-credits-reward";

export function installRendering(engine) {
  installDrawGlow(engine);
  installDrawCatSprite(engine);
  installDrawDogSprite(engine);
  installDrawMonitorScreen(engine);
  installDrawTableClock(engine);
  installDrawAvatarSprite(engine);
  installDrawGhostSprite(engine);
  installRender(engine);
  installDrawWatermark(engine);
  installTakePhoto(engine);
  installDrawCreditsReward(engine);
}
