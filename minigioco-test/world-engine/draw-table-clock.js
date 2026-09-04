// Motore Asso World: draw table clock.
import * as dependencies from "./dependencies";

export function installDrawTableClock(engine) {
  engine.drawTableClock = function() {
    if (!engine.st.countdown)
        return;
    const rem = Math.max(0, engine.st.countdown - Date.now());
    const c = dependencies.tileTop(8.4, 3.6);
    const urgent = rem < 60000;
    const shake = urgent ? Math.round(Math.sin(engine.st.t * 30)) : 0;
    engine.wctx.save();
    engine.wctx.translate(Math.round(c.x) + shake, Math.round(c.y) - 56);
    engine.wctx.fillStyle = dependencies.P.red;
    engine.wctx.fillRect(-6, -11, 4, 3);
    engine.wctx.fillRect(2, -11, 4, 3); // campanelle
    engine.wctx.fillStyle = "#2e2a3a";
    engine.wctx.fillRect(-15, -9, 30, 14);
    engine.wctx.fillStyle = "#10142a";
    engine.wctx.fillRect(-13, -7, 26, 10);
    const mm = Math.floor(rem / 60000), ss = Math.floor((rem % 60000) / 1000);
    engine.wctx.fillStyle = urgent ? "#ff8a5c" : "#8fe0ef";
    engine.wctx.font = "bold 8px 'Courier New', monospace";
    engine.wctx.textAlign = "center";
    engine.wctx.fillText(mm + ":" + String(ss).padStart(2, "0"), 0, 1);
    engine.wctx.restore();
    engine.wctx.textAlign = "left";
};
}
