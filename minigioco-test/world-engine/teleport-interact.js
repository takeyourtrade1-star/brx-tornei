// Motore Asso World: teleport interact.


export function installTeleportInteract(engine) {
  engine.teleportInteract = function(o) {
    engine.st.av.queue = [];
    engine.st.av.to = null;
    engine.st.pending = null;
    engine.st.sitTarget = false;
    const ap = (o.approach && o.approach[0]) || null;
    if (ap) {
        engine.st.av.from = { cx: ap[0], cy: ap[1] };
        engine.st.av.fx = ap[0];
        engine.st.av.fy = ap[1];
    }
    engine.startInteract(o);
};
}
