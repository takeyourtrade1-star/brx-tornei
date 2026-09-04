// Motore Asso World: open mirror.


export function installOpenMirror(engine) {
  engine.openMirror = function() {
    engine.sfx.open();
    engine.st.pending = null;
    engine.st.sitTarget = false;
    engine.st.modal = "mirror";
    engine.st.lock = false;
    if (engine.apiRef.current.openModal)
        engine.apiRef.current.openModal("mirror");
};
}
