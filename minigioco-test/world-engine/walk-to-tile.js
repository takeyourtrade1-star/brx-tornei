// Motore Asso World: walk to tile.
import * as dependencies from "./dependencies";

export function installWalkToTile(engine) {
  engine.walkToTile = function(tl) {
    const origin = engine.st.av.to || engine.st.av.from;
    if (origin.cx === tl.cx && origin.cy === tl.cy) {
        engine.st.av.queue = [];
        return false;
    }
    const path = dependencies.findPath(origin, tl, engine.blocked);
    if (!path)
        return false;
    engine.st.av.queue = path;
    return true;
};
}
