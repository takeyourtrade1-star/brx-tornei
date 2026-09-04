// Motore Asso World: draw monitor screen.
import * as dependencies from "./dependencies";

export function installDrawMonitorScreen(engine) {
  engine.drawMonitorScreen = function(flick) {
    const scene = engine.fx.targetFps <= 30 || engine.fx.reducedMotion ? 0 : Math.floor(engine.st.t / 7) % 3;
    dependencies.drawMonitorScene(engine.wctx, engine.screenQuad, {
        scene,
        flicker: Boolean(flick && engine.fx.flicker && !engine.fx.reducedMotion),
    });
};
}
