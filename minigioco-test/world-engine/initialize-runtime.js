// Motore Asso World: initialize runtime.
import * as dependencies from "./dependencies";

export function initializeRuntime(engine) {
    engine.ro = null;
    if (typeof ResizeObserver !== "undefined") {
        engine.ro = new ResizeObserver(() => engine.resize());
        engine.ro.observe(engine.wrap);
    }
    engine.resize();
    engine.removeInput = dependencies.createWorldInputBindings({
        canvas: engine.canvas,
        wrap: engine.wrap,
        onPointerDown: engine.onPointerDown,
        onPointerMove: engine.onPointerMove,
        onPointerLeave: engine.onPointerLeave,
        onKeyDown: engine.onKeyDown,
        onKeyUp: engine.onKeyUp,
        onBlur: () => { engine.st.keys.clear(); engine.st.hover.tile = null; engine.st.hover.obj = null; },
    });
    engine.scheduleFrame();
}
