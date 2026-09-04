// Motore Asso World: on pointer move.
import * as dependencies from "./dependencies";

export function installOnPointerMove(engine) {
  engine.onPointerMove = function(e) {
    if (engine.st.paused)
        return;
    if (engine.st.destroyed)
        return;
    const p = engine.pointerPos(e);
    engine.st.pointer.x = p.x;
    engine.st.pointer.y = p.y;
    /* hover link "Ebartex" nell'overlay busta (fase done) */
    if (engine.letterOverlayActive() && engine.st.letter && engine.st.letter.phase === "done" && engine.st.letter.ebartexHitRect) {
        const r = engine.st.letter.ebartexHitRect;
        engine.st.letter.ebartexHover = p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
        engine.canvas.style.cursor = engine.st.letter.ebartexHover ? "pointer" : "default";
        return;
    }
    const dec = engine.hitDecor(p.x, p.y);
    const obj = dec ? null : engine.hitObject(p.x, p.y);
    engine.st.hover.decor = dec ? dec.kind : null;
    engine.st.hover.obj = obj ? obj.id : null;
    engine.canvas.style.cursor = (obj || dec) && !engine.st.modal && !engine.st.lock ? "pointer" : "default";
    if (!obj && !dec) {
        const wpt = engine.unproject(p.x, p.y);
        const tl = dependencies.worldToTile(wpt.x, wpt.y);
        engine.st.hover.tile = dependencies.inGrid(tl.cx, tl.cy) && !engine.blocked.has(dependencies.tkey(tl.cx, tl.cy)) ? tl : null;
    }
    else
        engine.st.hover.tile = null;
};
}
