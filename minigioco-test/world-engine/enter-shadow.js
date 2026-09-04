// Motore Asso World: enter shadow.
import * as dependencies from "./dependencies";

export function installEnterShadow(engine) {
  engine.enterShadow = function() {
    engine.st.shadow = { until: engine.st.t + 60, t0: engine.st.t };
    engine.sfx.interference();
    engine.sfx.musicShadow(true);
    engine.st.matrix = [];
    for (let i = 0; i < 14; i++) {
        engine.st.matrix.push({ u: Math.random(), y: Math.random(), sp: 0.25 + Math.random() * 0.5 });
    }
    // Inizializza le carte caotiche sullo sfondo dello Shadow Realm
    const { w, h } = engine.st.view;
    engine.st.shadowCards = [];
    for (let i = 0; i < 24; i++) {
        engine.st.shadowCards.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 60 - 20, // drift leggermente verso sinistra/alto
            vy: (Math.random() - 0.5) * 60 + 10,
            rot: Math.random() * Math.PI * 2,
            vr: (Math.random() - 0.5) * 1.5,
            scale: 0.45 + Math.random() * 0.45,
            type: "brx",
            col: ["#a855f7", "#6366f1", dependencies.P.gold, "#ec4899", "#14b8a6", "#22c55e", "#ef4444", "#f97316", "#06b6d4", "#f43f5e", "#3b82f6"][Math.floor(Math.random() * 11)]
        });
    }
    engine.showBubble("🌌 …Qualcosa si è incrinato. Benvenuta nel Reame.", 4);
};
}
