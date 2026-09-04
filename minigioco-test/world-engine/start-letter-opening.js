// Motore Asso World: start letter opening.


export function installStartLetterOpening(engine) {
  engine.startLetterOpening = function() {
    if (!engine.st.letter || engine.st.letter.phase !== "idle" || engine.st.hype || engine.st.modal || engine.st.lock)
        return;
    engine.sfx.click();
    engine.st.cinematic = true;
    engine.st.letter.phase = "lift";
    engine.st.letter.t0 = engine.st.t;
};
}
