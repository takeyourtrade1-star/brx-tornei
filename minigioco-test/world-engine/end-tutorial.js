// Motore Asso World: end tutorial.


export function installEndTutorial(engine) {
  engine.endTutorial = function() {
    const T = engine.st.tut;
    if (!T.active)
        return;
    T.active = false;
    engine.st.cinematic = false;
    engine.st.introDone = true;
    engine.st.lastAct = engine.st.t;
    engine.st.pending = null;
    engine.st.sitTarget = false;
    if (engine.st.bubble)
        engine.st.bubble.sticky = false; // lascia svanire la battuta corrente
    if (engine.st.modal && engine.apiRef.current.closeModal)
        engine.apiRef.current.closeModal(); // caso "Salta" a modale aperta
    engine.tutCaption(null);
    engine.tutIntro(false);
    engine.tutOutro(false);
    if (engine.apiRef.current.setTutorial)
        engine.apiRef.current.setTutorial(false);
    engine.showBubble("Tocca a te! 🎮", 3);
    try {
        localStorage.setItem("irg-tutorial-done", "1");
    }
    catch (e) { }
};
}
