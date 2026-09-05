import { hitDetailedObject } from "../high-detail/scene-cache";
// Motore Asso World: hit object.


export function installHitObject(engine) {
  engine.hitObject = function(sx, sy) {
    const w = engine.unproject(sx, sy);
    if (engine.fx.highDetail) return hitDetailedObject(engine, w);
    for (const id of Object.keys(engine.inter)) {
        if (engine.solidInRect(w, engine.inter[id].hitRect, engine.inter[id].hitCv))
            return engine.inter[id];
    }
    return null;
};
}
