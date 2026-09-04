// Motore Asso World: wake afk.
import * as dependencies from "./dependencies";

export function installWakeAfk(engine) {
  engine.wakeAfk = function() {
    if (!engine.st.afk && !engine.st.afkGoing && !engine.st.afkShuffle && !engine.st.afkShuffleGoing)
        return;
    const wasMeditating = engine.st.afk || engine.st.afkShuffle;
    engine.st.afk = false;
    engine.st.afkGoing = false;
    engine.st.afkShuffle = null;
    engine.st.afkShuffleGoing = false;
    if (wasMeditating) {
        engine.sfx.success();
        engine.showBubble(dependencies.AFK_LINES[Math.floor(Math.random() * dependencies.AFK_LINES.length)], 3.5);
        const ap = dependencies.tileTop(engine.st.av.fx, engine.st.av.fy);
        engine.spawnFx("spark", ap.x, ap.y - 36, 4);
    }
};
}
