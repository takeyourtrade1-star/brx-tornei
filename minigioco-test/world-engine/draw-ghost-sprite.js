// Motore Asso World: draw ghost sprite.
import * as dependencies from "./dependencies";

export function installDrawGhostSprite(engine) {
  engine.drawGhostSprite = function() {
    const c = dependencies.tileTop(engine.GHOST_TILE.cx, engine.GHOST_TILE.cy);
    const cxp = c.x, cyp = c.y + dependencies.HTH;
    const fl = Math.sin(engine.st.t * 2) * 1.6; // fluttua
    const idx = Math.floor(engine.st.t * 1.2) % 2;
    const sp = engine.ghostFrames[idx];
    const x = Math.round(cxp - sp.feet.x), y = Math.round(cyp + 2 - sp.feet.y + fl);
    engine.wctx.fillStyle = "rgba(25,22,40,0.16)";
    engine.wctx.beginPath();
    engine.wctx.ellipse(cxp, cyp + 5, 11, 4, 0, 0, Math.PI * 2);
    engine.wctx.fill();
    engine.wctx.globalAlpha = 0.5;
    engine.wctx.drawImage(sp.cv, x, y);
    engine.wctx.globalAlpha = 0.22;
    engine.wctx.drawImage(engine.ghostSils[idx], x, y);
    engine.wctx.globalAlpha = 1;
    // nameplate
    engine.wctx.font = "bold 8px 'Segoe UI', sans-serif";
    const tw = engine.wctx.measureText(engine.st.ghost).width;
    engine.wctx.fillStyle = "rgba(16,18,32,0.75)";
    engine.wctx.fillRect(Math.round(cxp - tw / 2) - 4, y - 13, Math.round(tw) + 8, 11);
    engine.wctx.fillStyle = "#cfe0ff";
    engine.wctx.fillText(engine.st.ghost, Math.round(cxp - tw / 2), y - 5);
};
}
