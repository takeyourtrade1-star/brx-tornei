// Motore Asso World: tut show outro.
import * as dependencies from "./dependencies";

export function installTutShowOutro(engine) {
  engine.tutShowOutro = function() {
    const T = engine.st.tut;
    T.phase = "outro";
    T.t = 0;
    engine.st.cinematic = true;
    engine.st.sitTarget = false;
    engine.st.pending = null;
    if (engine.st.modal && engine.apiRef.current.closeModal)
        engine.apiRef.current.closeModal();
    engine.st.modal = null;
    if (engine.st.bubble)
        engine.st.bubble = null;
    engine.tutIntro(true); // ri-ingrandisce il pop-up
    if (engine.apiRef.current.setTutorialUiSpot)
        engine.apiRef.current.setTutorialUiSpot(null);
    engine.tutCaption(dependencies.TUT_OUTRO); // testo che si "scrive" lato React
    engine.tutOutro(true); // mostra i bottoni di scelta
};
}
