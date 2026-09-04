// Motore Asso World: tut advance.


export function installTutAdvance(engine) {
  engine.tutAdvance = function() {
    if (engine.apiRef.current.setTutorialUiSpot)
        engine.apiRef.current.setTutorialUiSpot(null);
    engine.st.tut.i++;
    engine.tutBeginStep();
};
}
