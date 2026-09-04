// Motore Asso World: burst letter fx.


export function installBurstLetterFx(engine) {
  engine.burstLetterFx = function(cx, cy, n = 24) {
    for (let i = 0; i < n; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 90;
        engine.st.letterFx.push({
            x: cx, y: cy,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 30,
            col: Math.random() < 0.65 ? "#F3C76A" : (Math.random() < 0.5 ? "#ffe6a8" : "#ffffff"),
            size: 2 + Math.random() * 3,
            dur: 0.7 + Math.random() * 0.5,
            t0: engine.st.t,
            grav: 45,
        });
    }
};
}
