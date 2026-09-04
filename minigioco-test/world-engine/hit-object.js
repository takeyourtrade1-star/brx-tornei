// Motore Asso World: hit object.


export function installHitObject(engine) {
  engine.hitObject = function(sx, sy) {
    const w = engine.unproject(sx, sy);
    for (const id of Object.keys(engine.inter)) {
        if (engine.solidInRect(w, engine.inter[id].hitRect, engine.inter[id].hitCv))
            return engine.inter[id];
    }
    return null;
};
}
