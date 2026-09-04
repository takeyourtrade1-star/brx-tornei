// Motore Asso World: draw spettro companion.
import * as dependencies from "./dependencies";

export function installDrawSpettroCompanion(engine) {
  engine.drawSpettroCompanion = function() {
    const sp = engine.st.spet || engine.updateSpettro();
    const c = dependencies.tileTop(sp.fx, sp.fy);
    const t = engine.st.t;
    const fl = Math.sin(t * 2.0) * 2.6 + Math.sin(t * 0.9) * 1.2; // fluttuazione composita
    const cx = c.x;
    const cy = c.y + dependencies.HTH - 36 + fl;
    const groundY = c.y + dependencies.HTH + 4;
    // velocita schermo -> inclinazione + direzione dello sguardo
    const vsx = ((sp.vx || 0) - (sp.vy || 0)) * dependencies.HTW;
    const vsy = ((sp.vx || 0) + (sp.vy || 0)) * dependencies.HTH;
    const lean = Math.max(-0.30, Math.min(0.30, vsx * 0.10));
    const eyeDX = Math.max(-1.7, Math.min(1.7, vsx * 0.9));
    const eyeDY = Math.max(-1.2, Math.min(1.2, vsy * 0.9));
    engine.wctx.save();
    // ombra a terra (si stringe e schiarisce quando fluttua piu in alto)
    const hgt = groundY - cy;
    const shA = Math.max(0.05, 0.2 - hgt * 0.0035);
    const shR = Math.max(5, 11 - hgt * 0.055);
    engine.wctx.fillStyle = "rgba(30,20,10," + shA.toFixed(3) + ")";
    engine.wctx.beginPath();
    engine.wctx.ellipse(cx, groundY, shR, shR * 0.4, 0, 0, Math.PI * 2);
    engine.wctx.fill();
    // alone arancione pulsante
    const glowR = 21 + Math.sin(t * 2.4) * 3;
    const g = engine.wctx.createRadialGradient(cx, cy, 2, cx, cy, glowR);
    g.addColorStop(0, "rgba(255,150,60," + (0.30 + 0.08 * Math.sin(t * 2.4)).toFixed(3) + ")");
    g.addColorStop(1, "rgba(255,150,60,0)");
    engine.wctx.fillStyle = g;
    engine.wctx.beginPath();
    engine.wctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    engine.wctx.fill();
    // corpo in spazio locale: inclinato + respiro squash/stretch
    engine.wctx.translate(cx, cy);
    engine.wctx.rotate(lean);
    const breath = Math.sin(t * 2.6);
    engine.wctx.scale(1 + breath * 0.05, 1 - breath * 0.05);
    // — Asso in pixel-art (stessa griglia della mascotte del sito) —
    const blink = (t % 4.6) > 4.36 ? 0.14 : 1;
    const PXS = 1.55; // dimensione del pixel
    const oxg = -dependencies.ASSO_GW * PXS / 2; // angolo alto-sinistra
    const oyg = -dependencies.ASSO_GH * PXS / 2 + 1;
    const cellW = PXS + 0.45; // micro-overlap: niente fessure
    for (let gy = 0; gy < dependencies.ASSO_GH; gy++) {
        const row = dependencies.ASSO_GRID[gy];
        for (let gx = 0; gx < dependencies.ASSO_GW; gx++) {
            const col = dependencies.ASSO_BODY_COL[row[gx]];
            if (!col)
                continue; // salta vuoti, ombra, scintille, occhi
            engine.wctx.fillStyle = col;
            engine.wctx.fillRect(oxg + gx * PXS, oyg + gy * PXS, cellW, cellW);
        }
    }
    // occhi: guardano nella direzione di marcia e sbattono
    const eOX = Math.max(-1.2, Math.min(1.2, eyeDX * 0.55));
    const eOY = Math.max(-1.0, Math.min(1.0, eyeDY * 0.55));
    if (blink > 0.5) {
        for (const e of dependencies.ASSO_EYE_CELLS) {
            engine.wctx.fillStyle = e.w ? "#ffffff" : "#4a5548";
            engine.wctx.fillRect(oxg + e.x * PXS + eOX, oyg + e.y * PXS + eOY, cellW, cellW);
        }
    }
    else {
        engine.wctx.fillStyle = "#4a5548"; // occhi chiusi: due trattini
        engine.wctx.fillRect(oxg + 6 * PXS + eOX, oyg + 8.7 * PXS, 2 * PXS, PXS * 0.8);
        engine.wctx.fillRect(oxg + 10 * PXS + eOX, oyg + 8.7 * PXS, 2 * PXS, PXS * 0.8);
    }
    engine.wctx.restore();
    // scintille orbitanti
    for (let i = 0; i < 3; i++) {
        const a = t * 1.1 + i * 2.094;
        const rad = 17 + 2 * Math.sin(t * 2 + i);
        const sxp = cx + Math.cos(a) * rad * 1.15;
        const syp = cy + Math.sin(a) * rad * 0.62 - 2;
        const tw = 0.5 + 0.5 * Math.sin(t * 4 + i * 2.3);
        engine.wctx.globalAlpha = tw * 0.8;
        engine.wctx.fillStyle = "#ffd9a0";
        const r = 1.6 + tw * 0.8;
        engine.wctx.beginPath();
        engine.wctx.moveTo(sxp, syp - r);
        engine.wctx.lineTo(sxp + r * 0.5, syp);
        engine.wctx.lineTo(sxp, syp + r);
        engine.wctx.lineTo(sxp - r * 0.5, syp);
        engine.wctx.closePath();
        engine.wctx.fill();
    }
    engine.wctx.globalAlpha = 1;
};
}
