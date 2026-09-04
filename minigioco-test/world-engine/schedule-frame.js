// Motore Asso World: schedule frame.


export function installScheduleFrame(engine) {
  engine.scheduleFrame = function() {
    if (engine.st.destroyed || engine.st.raf !== null || engine.st.pauseTimer !== null)
        return;
    engine.st.raf = requestAnimationFrame(engine.loop);
};
}
