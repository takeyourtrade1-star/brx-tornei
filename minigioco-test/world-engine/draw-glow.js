// Motore Asso World: draw glow.


export function installDrawGlow(engine) {
  engine.drawGlow = function(sil, x, y, k = 1) {
    if (!sil || !engine.fx.glows)
        return;
    engine.wctx.save();
    engine.wctx.globalAlpha = Math.min(0.85, (0.26 + 0.16 * Math.sin(engine.st.t * 4.2)) * k);
    engine.wctx.globalCompositeOperation = "lighter";
    for (const [ox, oy] of [[-2, 0], [2, 0], [0, -2], [0, 2]])
        engine.wctx.drawImage(sil, x + ox, y + oy);
    engine.wctx.restore();
};
}
