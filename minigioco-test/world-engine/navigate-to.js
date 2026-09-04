// Motore Asso World: navigate to.


export function installNavigateTo(engine) {
  engine.navigateTo = function(targetRoom) {
    if (engine.st.destroyed || engine.st.paused || engine.st.modal || engine.st.lock || engine.st.cinematic || engine.st.transition)
        return null;
    if (targetRoom === engine.st.room)
        return null;
    const plan = engine.worldNavigation.navigateTo(targetRoom);
    if (!plan)
        return null;
    engine.st.navigationTarget = targetRoom;
    engine.sfx.ensure();
    engine.st.lastAct = engine.st.t;
    engine.wakeAfk();
    engine.hideHintOnce();
    return plan;
};
}
