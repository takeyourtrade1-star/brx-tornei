// Motore Asso World: exit shadow.


export function installExitShadow(engine) {
  engine.exitShadow = function() {
    engine.st.shadow = null;
    engine.st.shadowCards = null;
    engine.sfx.musicShadow(false);
    engine.sfx.interference();
    engine.showBubble("Tutto torna normale. …Per ora.", 3);
};
}
