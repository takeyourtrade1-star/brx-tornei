// Motore Asso World: change room.


export function installChangeRoom(engine) {
  engine.changeRoom = function(target) {
    if (engine.st.transition)
        return;
    engine.st.transition = { t: 0, target, swapped: false };
    engine.st.lock = true;
    engine.st.pending = null;
    engine.st.av.queue = [];
    engine.st.av.to = null;
    engine.st.av.seated = false;
    engine.st.modal = null;
    if (engine.apiRef.current.closeModal)
        engine.apiRef.current.closeModal();
};
}
