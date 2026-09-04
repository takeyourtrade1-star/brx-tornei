// Motore Asso World: resize.
import * as dependencies from "./dependencies";

export function installResize(engine) {
  engine.resize = function() {
    const w = Math.max(1, engine.wrap.clientWidth || 1), h = Math.max(1, engine.wrap.clientHeight || 1);
    const dpr = engine.fx.dpr;
    engine.canvas.width = Math.max(1, Math.round(w * dpr));
    engine.canvas.height = Math.max(1, Math.round(h * dpr));
    // riempie più spazio (laterale + un po' di altezza) lasciando un margine minimo
    engine.st.view = { w, h, dpr, scale: dependencies.fitWorldScale(w, h) };
};
}
