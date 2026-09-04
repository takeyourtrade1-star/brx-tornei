// Motore Asso World: pet cat.


export function installPetCat(engine) {
  engine.petCat = function() {
    const cat = engine.st.cat;
    engine.sfx.purr();
    const cp = engine.petFootPoint(cat);
    engine.spawnFx("heart", cp.x, cp.y - 8, 3);
    if (cat.state === "sleep") {
        cat.state = "sit";
        cat.until = engine.st.t + 4;
    }
    cat.pets++;
    let isPendingChair = false;
    // Se viene accarezzata mentre è a terra, prenota il salto sulla sedia dopo un breve ritardo
    // per non interrompere la catena di carezze dell'easter egg
    if (!cat.perch && !cat.to) {
        cat.pendingChairAt = engine.st.t + 1.5;
        isPendingChair = true;
    }
    /* easter egg segreto: 7 carezze di fila, musica spenta, a notte fonda */
    cat.streak = engine.st.t - cat.lastPet < 5 ? cat.streak + 1 : 1;
    cat.lastPet = engine.st.t;
    if (cat.streak >= 7 && !engine.st.shadow && !engine.sfx.musicOn() && engine.phase.id === "night") {
        cat.streak = 0;
        cat.pendingChairAt = null;
        engine.enterShadow();
        return;
    }
    if (cat.pets % 3 === 0) {
        // Evitiamo di sovrascrivere l'azione forzata della sedia se sta per partire
        if (!cat.forceChair && !isPendingChair) {
            cat.follow = 6;
            engine.sfx.meow();
            engine.showBubble(engine.st.shadow ? "Missy vede oltre il velo… e ti segue. 🐈‍⬛" : "Missy ti segue! 🐱", 2.6);
        }
    }
};
}
