// Motore Asso World: loop.
import * as dependencies from "./dependencies";

export function installLoop(engine) {
  engine.loop = function(ts) {
    engine.st.raf = null;
    if (engine.st.destroyed)
        return;
    // Il canvas della stanza non deve competere con quello del cabinato in primo
    // piano. In pausa scende a 5 controlli/s invece di richiamare 60 frame/s.
    if (document.hidden || engine.st.paused ||
        dependencies.ARCADE_GAME_IDS.has(engine.st.modal) ||
        (engine.apiRef.current.isSocialRoomOpen && engine.apiRef.current.isSocialRoomOpen())) {
        engine.frameLimiter.pause(ts);
        engine.st.pauseTimer = window.setTimeout(() => {
            engine.st.pauseTimer = null;
            engine.scheduleFrame();
        }, 200);
        return;
    }
    engine.scheduleFrame(); // pianifica subito: un errore non uccide il loop
    const dt = engine.frameLimiter.consume(ts);
    if (dt === null)
        return;
    engine.st.t += dt;
    try {
        engine.update(dt);
        engine.render();
    }
    catch (err) {
        engine.st.errCount = (engine.st.errCount || 0) + 1;
        if (engine.st.errCount <= 3)
            console.error("[IsoRoomGame] errore nel frame:", err);
        if (engine.st.errCount >= 3) {
            engine.api.destroy();
            engine.opts.onError?.();
        }
    }
};
}
