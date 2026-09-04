// Motore Asso World: draw avatar sprite.
import * as dependencies from "./dependencies";

export function installDrawAvatarSprite(engine) {
  engine.drawAvatarSprite = function() {
    const av = engine.st.av;
    const c = dependencies.tileTop(av.fx, av.fy);
    const cxp = c.x, cyp = c.y + dependencies.HTH;
    const moving = !!av.to;
    const seated = (av.seated || engine.st.afk) && !moving;
    if (engine.st.shadow && (!seated || engine.st.afk)) {
        // aura scura/viola pulsante
        const pulse = 1 + 0.15 * Math.sin(engine.st.t * 3);
        const auraG = engine.wctx.createRadialGradient(cxp, cyp + 5, 2, cxp, cyp + 5, 16 * pulse);
        auraG.addColorStop(0, "rgba(128, 0, 255, 0.45)");
        auraG.addColorStop(1, "rgba(0, 0, 0, 0)");
        engine.wctx.fillStyle = auraG;
        engine.wctx.beginPath();
        engine.wctx.ellipse(cxp, cyp + 5, 16 * pulse, 6.5 * pulse, 0, 0, Math.PI * 2);
        engine.wctx.fill();
    }
    else if (!seated || engine.st.afk) {
        engine.wctx.fillStyle = "rgba(25,22,40,0.28)";
        engine.wctx.beginPath();
        engine.wctx.ellipse(cxp, cyp + 5, 12.5, 5, 0, 0, Math.PI * 2);
        engine.wctx.fill();
    }
    let sp;
    if (seated)
        sp = engine.avatar.sit[Math.floor(engine.st.t * 1.2) % 2];
    else {
        const D = engine.avatar[av.dir];
        if (moving && !engine.st.shadow)
            sp = D.walk[Math.floor(av.wt) % 4];
        else if (engine.st.t < av.blinkUntil && (av.dir === "se" || av.dir === "sw"))
            sp = D.blink;
        else
            sp = D.idle[Math.floor(engine.st.t * 1.3) % 2];
    }
    const bob = (moving && !engine.st.shadow) ? -Math.abs(Math.sin(av.t * Math.PI)) * 1.6
        : engine.st.afk ? Math.sin(engine.st.t * 1.6) * 1.2 : 0; // respiro lento in meditazione
    const shadowLift = engine.st.shadow && !seated ? Math.sin(engine.st.t * 3.5) * 4 - 5 : 0; // fluttua nello Shadow Realm
    const lift = seated ? (engine.st.afk ? 5 : 21) : 0; // sedia vs tappeto
    engine.wctx.drawImage(sp.cv, Math.round(cxp - sp.feet.x), Math.round(cyp + 6 - sp.feet.y + bob - lift + shadowLift));
    engine.st.avDraw = sp; // per il riflesso nella finestra
};
}
