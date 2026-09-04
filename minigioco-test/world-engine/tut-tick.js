// Motore Asso World: tut tick.
import * as dependencies from "./dependencies";

export function installTutTick(engine) {
  engine.tutTick = function(dt) {
    const T = engine.st.tut;
    if (!T.active)
        return;
    if (!T.announced) {
        T.announced = true;
        engine.st.cinematic = true; // blocca l'input manuale
        if (engine.apiRef.current.setTutorial)
            engine.apiRef.current.setTutorial(true);
        engine.tutIntro(true); // il banner nasce già grande al centro
    }
    if (T.phase === "init") { // aspetta che finisca l'ingresso in scena
        if (engine.avIdle())
            engine.tutBeginStep();
        return;
    }
    if (T.phase === "outro")
        return; // cartello finale: aspetta la scelta dell'utente
    const step = dependencies.TUT_STEPS[T.i];
    if (!step) {
        engine.tutShowOutro();
        return;
    }
    T.t += dt;
    if (step.kind === "say") {
        const need = step.dur ?? dependencies.tutCaptionSec(step.text, { intro: !!step.intro });
        if (T.t >= need)
            engine.tutAdvance();
        return;
    }
    if (step.kind === "keys") {
        if (T.t >= dependencies.tutUiHoldSec(step))
            engine.tutAdvance();
        return;
    }
    /* kind "demo" */
    if (T.phase === "walk") {
        const captionDone = T.t >= dependencies.tutCaptionSec(step.text);
        // modale aperta ma frase esterna ancora in corso: non tagliare il cartello
        if (engine.st.modal === step.id && captionDone) {
            T.phase = "hold";
            T.t = 0;
            // modale aperta: spiega cosa farci dentro. Solo la barra in alto (il
            // fumetto sull'omino sarebbe coperto dalla modale), niente bolla residua.
            if (step.inside) {
                engine.tutCaption(step.inside);
                engine.st.bubble = null;
            }
        }
        else if (T.t > 14) {
            engine.startInteract(engine.inter[step.id]);
        } // safety: forza l'apertura se il path è bloccato
        return;
    }
    if (T.phase === "hold") {
        if (T.t >= dependencies.tutHoldSec(step)) {
            T.phase = "close";
            T.t = 0;
            if (engine.apiRef.current.closeModal)
                engine.apiRef.current.closeModal();
            else {
                engine.st.modal = null;
            }
        }
        return;
    }
    if (T.phase === "close") {
        if ((engine.st.modal === null && engine.avIdle()) || T.t > 7)
            engine.tutAdvance(); // attende chiusura + ritorno avatar
        return;
    }
};
}
