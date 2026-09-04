// Motore Asso World: close letter reward.


export function installCloseLetterReward(engine) {
  engine.closeLetterReward = function() {
    engine.st.letter = null;
    engine.st.cinematic = false;
    engine.st.letterNextAt = engine.st.t + 40 + Math.random() * 10;
    engine.sfx.click();
};
}
