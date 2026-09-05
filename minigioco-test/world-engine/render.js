// Motore Asso World: render.
import { renderDetailedWorld } from "../high-detail/renderer";
import { renderWorldBase } from "./render-world-base";
import { renderEntities } from "./render-entities";
import { renderComposite } from "./render-composite";
import { renderLabels } from "./render-labels";
import { renderRewards } from "./render-rewards";

export function installRender(engine) {
  engine.render = function() {
    const frame = {  };
    if (engine.fx.highDetail) {
      renderDetailedWorld(engine, frame);
      renderLabels(engine, frame);
      renderRewards(engine, frame);
      return;
    }
    if (renderWorldBase(engine, frame)) return;
    if (renderEntities(engine, frame)) return;
    if (renderComposite(engine, frame)) return;
    if (renderLabels(engine, frame)) return;
    if (renderRewards(engine, frame)) return;
  };
}
