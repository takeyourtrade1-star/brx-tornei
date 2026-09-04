// Motore Asso World: do ring.


export function installDoRing(engine) {
  engine.doRing = function(msg) {
    engine.sfx.ding();
    engine.st.ring = { until: engine.st.t + 6 };
    engine.st.alert = engine.st.t + 7;
    engine.showBubble("📯 " + msg, 5);
};
}
