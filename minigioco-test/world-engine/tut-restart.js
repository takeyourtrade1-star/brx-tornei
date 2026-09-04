// Motore Asso World: tut restart.


export function installTutRestart(engine) {
  engine.tutRestart = function() {
    engine.st.tut = { active: true, i: 0, phase: "init", t: 0, announced: true };
    engine.st.cinematic = true;
    engine.st.modal = null;
    engine.st.pending = null;
    engine.st.sitTarget = false;
    if (engine.st.bubble)
        engine.st.bubble = null;
    engine.tutOutro(false);
    engine.tutCaption(null);
    engine.tutIntro(true);
    if (engine.apiRef.current.setTutorialUiSpot)
        engine.apiRef.current.setTutorialUiSpot(null);
    if (engine.apiRef.current.setTutorial)
        engine.apiRef.current.setTutorial(true);
};
}
