// Motore Asso World: tut begin step.
import * as dependencies from "./dependencies";

export function installTutBeginStep(engine) {
  engine.tutBeginStep = function() {
    const T = engine.st.tut, step = dependencies.TUT_STEPS[T.i];
    if (!step) {
        engine.tutShowOutro();
        return;
    }
    T.t = 0;
    if (step.intro) {
        // saluto grande al centro: niente fumetto sull'omino, solo il cartello centrale
        engine.tutIntro(true);
        engine.tutCaption(step.text);
        if (engine.st.bubble)
            engine.st.bubble = null;
    }
    else if (step.kind === "keys") {
        engine.tutIntro(false);
        engine.tutCaption(step.text);
        if (engine.st.bubble)
            engine.st.bubble = null;
        if (engine.st.modal && engine.apiRef.current.closeModal)
            engine.apiRef.current.closeModal();
        engine.st.modal = null;
        if (engine.apiRef.current.setTutorialUiSpot)
            engine.apiRef.current.setTutorialUiSpot(step.id);
    }
    else {
        engine.tutIntro(false); // la barra "vola" in alto e prosegue
        engine.tutSay(step.text);
    }
    if (step.kind === "say") {
        T.phase = "say";
    }
    else if (step.kind === "keys") {
        T.phase = "keys";
    }
    else {
        T.phase = "walk";
        engine.clickObject(engine.inter[step.id]); // riusa tutta la coreografia (cammina, siede al PC, apre)
    }
};
}
