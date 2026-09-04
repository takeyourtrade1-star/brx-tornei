// Motore Asso World: start interact.
import * as dependencies from "./dependencies";

export function installStartInteract(engine) {
  engine.startInteract = function(o) {
    if (o.action === "changeRoom") {
        engine.changeRoom(o.target);
        return;
    }
    if (o.action === "inspect") {
        const t = engine.st.av.from;
        if (o.faceTile) {
            const dx = o.faceTile[0] - t.cx, dy = o.faceTile[1] - t.cy;
            engine.st.av.dir = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "se" : "nw") : (dy >= 0 ? "sw" : "ne");
        }
        engine.showBubble(o.bubbleText || "...", 3.6);
        engine.sfx.tap && engine.sfx.tap();
        return;
    }
    if (o.action === "openSocialRoom") {
        engine.changeRoom("piazza");
        return;
    }
    const modalId = dependencies.getInteractionModalId(o.id, o);
    engine.st.lock = true;
    if (o.id === "pc")
        engine.st.alert = 0; // il giocatore ha visto la notifica
    const t = engine.st.av.from;
    if (o.faceTile) {
        const dx = o.faceTile[0] - t.cx, dy = o.faceTile[1] - t.cy;
        engine.st.av.dir = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "se" : "nw") : (dy >= 0 ? "sw" : "ne");
    }
    else
        engine.st.av.dir = "ne";
    const dcam = engine.st.room === "arcade" ? dependencies.ARC_DEFAULT_CAM : engine.st.room === "piazza" ? dependencies.PIAZZA_DEFAULT_CAM : dependencies.DEFAULT_CAM;
    const fx = dependencies.lerp(o.focus.x, dcam.x, 0.2), fy = dependencies.lerp(o.focus.y, dcam.y, 0.2);
    engine.camTo({ x: fx, y: fy, z: o.focus.z }, 0.62, () => {
        engine.sfx.open();
        engine.st.modal = modalId;
        engine.st.lock = false;
        engine.apiRef.current.openModal && engine.apiRef.current.openModal(modalId);
    });
};
}
