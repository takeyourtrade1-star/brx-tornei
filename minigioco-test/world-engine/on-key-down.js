// Motore Asso World: on key down.


export function installOnKeyDown(engine) {
  engine.onKeyDown = function(e) {
    if (engine.st.paused)
        return;
    engine.st.navigationTarget = null;
    const tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || engine.st.modal || engine.st.cinematic
        || (engine.apiRef.current.isSocialRoomOpen && engine.apiRef.current.isSocialRoomOpen()))
        return;
    /* ESC nella Sala Arcade o Sala Piazza → torna alla Sala Tornei */
    if (e.key === "Escape" && !engine.st.lock && (engine.st.room === "arcade" || engine.st.room === "piazza")) {
        e.preventDefault();
        engine.changeRoom("tournament");
        return;
    }
    /* Invio nella Sala Piazza → attiva la barra chat */
    if (engine.st.room === "piazza" && (e.key === "Enter" || e.code === "Enter") && !engine.st.lock) {
        e.preventDefault();
        if (engine.apiRef.current.focusChat)
            engine.apiRef.current.focusChat();
        return;
    }
    /* P = modalità foto */
    if (e.code === "KeyP" && !engine.st.lock) {
        e.preventDefault();
        engine.sfx.ensure();
        engine.st.lastAct = engine.st.t;
        engine.takePhoto();
        return;
    }
    /* hotkey dirette: 1/2/3 oggetti (mappati per stanza) */
    if (!engine.st.lock && (e.code === "Digit1" || e.code === "Digit2" || e.code === "Digit3" || e.code === "Digit4")) {
        const which = e.code === "Digit1" ? 1 : e.code === "Digit2" ? 2 : e.code === "Digit3" ? 3 : 4;
        const target = engine.st.room === "arcade"
            ? (which === 1 ? engine.inter.arcade1 : which === 2 ? engine.inter.arcade2 : which === 3 ? engine.inter.arcade3 : engine.inter.kakegurui)
            : engine.st.room === "piazza"
                ? (which === 1 ? engine.inter.piazzaCab1 : which === 2 ? engine.inter.piazzaCab2 : which === 3 ? engine.inter.piazzaCab3 : engine.inter.piazzaTable1)
                : (which === 1 ? engine.inter.pc : which === 2 ? engine.inter.decks : engine.inter.board);
        if (!target)
            return;
        e.preventDefault();
        engine.sfx.ensure();
        engine.st.lastAct = engine.st.t;
        engine.wakeAfk();
        engine.teleportInteract(target);
        engine.hideHintOnce();
        return;
    }
    const codes = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (codes.includes(e.code)) {
        e.preventDefault();
        engine.sfx.ensure();
        engine.st.lastAct = engine.st.t;
        engine.wakeAfk();
        engine.st.keys.add(e.code);
        engine.st.lastKey = e.code;
    }
};
}
