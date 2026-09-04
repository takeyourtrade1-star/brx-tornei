// Motore Asso World: interact.


export function installInteract(engine) {
  engine.interact = function(id) {
    if (engine.st.destroyed || engine.st.paused || engine.st.modal || engine.st.lock || engine.st.cinematic)
        return null;
    const resolvedId = engine.resolveInteractiveId(id);
    if (!resolvedId)
        return null;
    engine.st.navigationTarget = null;
    engine.sfx.ensure();
    engine.st.lastAct = engine.st.t;
    engine.wakeAfk();
    const plan = engine.worldNavigation.interact(resolvedId);
    if (plan)
        engine.hideHintOnce();
    return plan;
};
}
