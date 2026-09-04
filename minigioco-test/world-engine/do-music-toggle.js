// Motore Asso World: do music toggle.


export function installDoMusicToggle(engine) {
  engine.doMusicToggle = function() {
    const name = engine.sfx.musicToggle();
    engine.showBubble(name ? "♪ " + name : "Musica spenta 🔇", 2.6);
    if (name)
        engine.spawnFx("note", engine.turnTop.x, engine.turnTop.y, 2);
};
}
