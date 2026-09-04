// Motore Asso World: start hype.


export function installStartHype(engine) {
  engine.startHype = function(opponent) {
    if (engine.st.hype || engine.letterOverlayActive() || engine.st.modal || engine.st.destroyed)
        return;
    engine.st.cinematic = true;
    engine.st.pending = null;
    engine.st.sitTarget = false;
    engine.st.afk = false;
    engine.st.afkGoing = false;
    engine.st.hype = { phase: "alarm", t0: engine.st.t, opp: opponent || "Sfidante", nextBeep: 0, deals: null, puffs: 0 };
    engine.doRing("SFIDANTE TROVATO: " + (opponent || "???") + "! ⚔️");
};
}
