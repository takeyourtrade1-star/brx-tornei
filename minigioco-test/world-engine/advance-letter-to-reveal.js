// Motore Asso World: advance letter to reveal.


export function installAdvanceLetterToReveal(engine) {
  engine.advanceLetterToReveal = function() {
    const lt = engine.st.letter;
    if (!lt || lt.phase !== "open" || lt.flapBurst)
        return;
    lt.flapBurst = true;
    lt.phase = "reveal";
    lt.t0 = engine.st.t;
    engine.st.shake = 18;
    engine.sfx.success();
    engine.sfx.open();
    const { w, h } = engine.st.view;
    const cy = h / 2 - 10;
    engine.burstLetterFx(w / 2, cy, 56);
    engine.st.letterFx.push({
        x: w / 2, y: cy,
        ring: true, maxRadius: 120, col: "#F3C76A", dur: 0.75, t0: engine.st.t,
    });
    engine.st.letterFx.push({
        x: w / 2, y: cy,
        ring: true, maxRadius: 180, col: "#F3C76A", dur: 1.0, t0: engine.st.t,
    });
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        engine.st.letterFx.push({
            x: w / 2 + Math.cos(a) * 6, y: cy + Math.sin(a) * 4,
            vx: Math.cos(a) * 95, vy: Math.sin(a) * 72 - 44,
            col: i % 2 ? "#F3C76A" : "#ffe6a8",
            size: 3 + Math.random() * 2,
            dur: 0.6 + Math.random() * 0.35,
            t0: engine.st.t,
            grav: 50,
        });
    }
};
}
