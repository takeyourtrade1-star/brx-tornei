// Motore Asso World: click object.
import * as dependencies from "./dependencies";

export function installClickObject(engine) {
  engine.clickObject = function(o) {
    engine.sfx.click();
    engine.st.sitTarget = false;
    const tile = engine.st.av.to || engine.st.av.from;
    const idle = !engine.st.av.to && !engine.st.av.queue.length;
    const onApproach = o.approach.some(([x, y]) => x === tile.cx && y === tile.cy);
    if (onApproach && idle) {
        if (o.id === "pc") {
            engine.st.standBack = { cx: tile.cx, cy: tile.cy };
            engine.st.sitTarget = true;
            engine.st.av.queue = [{ cx: engine.CHAIR[0], cy: engine.CHAIR[1] }];
        }
        else if (o.id === "music")
            engine.doMusicToggle();
        else
            engine.startInteract(o);
        return;
    }
    let best = null;
    for (const [x, y] of o.approach) {
        if (tile.cx === x && tile.cy === y) {
            best = [];
            break;
        }
        const p = dependencies.findPath(tile, { cx: x, cy: y }, engine.blocked);
        if (p && (!best || p.length < best.length))
            best = p;
    }
    if (!best)
        return;
    engine.st.av.queue = best;
    engine.st.pending = o;
    engine.hideHintOnce();
};
}
