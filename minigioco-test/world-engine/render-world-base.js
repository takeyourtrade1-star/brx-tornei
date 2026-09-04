// Motore Asso World: render world base.
import * as dependencies from "./dependencies";

export function renderWorldBase(engine, frame) {
    ({ w: frame.w, h: frame.h, dpr: frame.dpr, scale: frame.scale } = engine.st.view);
    frame.isTour = engine.st.room === "tournament";
    /* — mondo — */
    engine.wctx.clearRect(0, 0, dependencies.WW, dependencies.WH);
    engine.wctx.drawImage(engine.bg, 0, 0);
    /* — Shadow Realm: finestra dinamica + poster glifi — */
    if (frame.isTour && engine.st.shadow && engine.fx.shadowEffects) {
        engine.wctx.save();
        engine.wctx.beginPath();
        const g0 = dependencies.wallL(5.82, 86), g1 = dependencies.wallL(7.58, 86), g2 = dependencies.wallL(7.58, 34), g3 = dependencies.wallL(5.82, 34);
        engine.wctx.moveTo(g0.x, g0.y);
        engine.wctx.lineTo(g1.x, g1.y);
        engine.wctx.lineTo(g2.x, g2.y);
        engine.wctx.lineTo(g3.x, g3.y);
        engine.wctx.closePath();
        engine.wctx.clip();
        // Sfondo scuro
        engine.wctx.fillStyle = "#0c0214";
        engine.wctx.fillRect(0, 0, dependencies.WW, dependencies.WH);
        // Nebula viola dello spazio profondo
        const nebulaX = dependencies.WW / 2 + Math.sin(engine.st.t * 0.3) * 60;
        const nebulaY = dependencies.WH / 2 + Math.cos(engine.st.t * 0.2) * 30;
        const radG = engine.wctx.createRadialGradient(nebulaX, nebulaY, 10, nebulaX, nebulaY, 80);
        radG.addColorStop(0, "rgba(128,0,255,0.45)");
        radG.addColorStop(0.5, "rgba(64,0,128,0.22)");
        radG.addColorStop(1, "rgba(0,0,0,0)");
        engine.wctx.fillStyle = radG;
        engine.wctx.fillRect(0, 0, dependencies.WW, dependencies.WH);
        // Pioggia matrix verde
        engine.wctx.fillStyle = "#39ff14";
        for (let i = 0; i < engine.st.matrix.length; i++) {
            const col = engine.st.matrix[i];
            const wx = dependencies.lerp(g0.x, g1.x, col.u);
            const wy = dependencies.lerp(g0.y, g3.y, col.y);
            for (let j = 0; j < 5; j++) {
                engine.wctx.globalAlpha = (1 - j * 0.2) * 0.85;
                engine.wctx.fillRect(wx, wy - j * 9, 2, 6);
            }
        }
        engine.wctx.restore();
        engine.wctx.globalAlpha = 1;
        // Disegna i glifi esoterici sui poster
        const drawPosterGlyph = (rect, col) => {
            const cx = rect.x + rect.w / 2;
            const cy = rect.y + rect.h / 2;
            engine.wctx.save();
            engine.wctx.strokeStyle = col;
            engine.wctx.lineWidth = 1.5;
            engine.wctx.shadowColor = col;
            engine.wctx.shadowBlur = 6;
            engine.wctx.globalAlpha = 0.5 + 0.3 * Math.sin(engine.st.t * 6);
            engine.wctx.beginPath();
            engine.wctx.moveTo(cx, cy - 10);
            engine.wctx.lineTo(cx - 8, cy + 6);
            engine.wctx.lineTo(cx + 8, cy + 6);
            engine.wctx.closePath();
            engine.wctx.stroke();
            engine.wctx.beginPath();
            engine.wctx.arc(cx, cy + 1, 3, 0, Math.PI * 2);
            engine.wctx.fillStyle = col;
            engine.wctx.fill();
            engine.wctx.restore();
        };
        const brandEgg = engine.eggs.find((eg) => eg.key === "posterBrand");
        const mirrorEgg = engine.eggs.find((eg) => eg.key === "mirror");
        if (brandEgg)
            drawPosterGlyph(brandEgg.rect, "#ff00ff");
        if (mirrorEgg)
            drawPosterGlyph(mirrorEgg.rect, "#00ffff");
    }
    // orme sul tappeto (svaniscono in 4s)
    if (engine.fx.prints)
        for (const pr of engine.st.prints) {
            const k = (engine.st.t - pr.t0) / 4;
            if (k >= 1)
                continue;
            engine.wctx.globalAlpha = (1 - k) * 0.2;
            engine.wctx.fillStyle = "#3a2a22";
            engine.wctx.fillRect(Math.round(pr.x - 4 * pr.s), Math.round(pr.y - 2 * pr.s), Math.max(1, Math.round(3 * pr.s)), Math.max(1, Math.round(2 * pr.s)));
            engine.wctx.fillRect(Math.round(pr.x + 1 * pr.s), Math.round(pr.y), Math.max(1, Math.round(3 * pr.s)), Math.max(1, Math.round(2 * pr.s)));
        }
    engine.wctx.globalAlpha = 1;
    // tile evidenziato
    if (engine.st.hover.tile && !engine.st.modal && !engine.st.lock) {
        const tp = dependencies.tileTop(engine.st.hover.tile.cx, engine.st.hover.tile.cy);
        engine.wctx.globalAlpha = 0.1 + 0.05 * Math.sin(engine.st.t * 5);
        dependencies.quadFill(engine.wctx, [tp, { x: tp.x + dependencies.HTW, y: tp.y + dependencies.HTH }, { x: tp.x, y: tp.y + 2 * dependencies.HTH }, { x: tp.x - dependencies.HTW, y: tp.y + dependencies.HTH }], "#ffffff");
        engine.wctx.globalAlpha = 1;
        dependencies.quadFill(engine.wctx, [tp, { x: tp.x + dependencies.HTW, y: tp.y + dependencies.HTH }, { x: tp.x, y: tp.y + 2 * dependencies.HTH }, { x: tp.x - dependencies.HTW, y: tp.y + dependencies.HTH }], false, "rgba(255,255,255,0.55)", 1.5);
    }
    // ripple click
    for (const r of engine.st.ripples) {
        const kk = (engine.st.t - r.t0) / 0.45;
        const c = dependencies.tileTop(r.cx, r.cy);
        const cy2 = c.y + dependencies.HTH;
        engine.wctx.globalAlpha = (1 - kk) * 0.8;
        dependencies.quadFill(engine.wctx, [
            { x: c.x, y: cy2 - dependencies.HTH * kk }, { x: c.x + dependencies.HTW * kk, y: cy2 }, { x: c.x, y: cy2 + dependencies.HTH * kk }, { x: c.x - dependencies.HTW * kk, y: cy2 },
        ], false, "#ffffff", 2);
        engine.wctx.globalAlpha = 1;
    }
    // bacheca (sempre dietro alle entità, solo Sala Tornei)
    if (frame.isTour) {
        if (engine.st.nearObj && engine.st.nearObj.id === "board" && !engine.st.modal)
            engine.drawGlow(engine.sils.board, engine.boardSp.wx, engine.boardSp.wy);
        engine.wctx.drawImage(engine.boardSp.cv, engine.boardSp.wx, engine.boardSp.wy);
    }
    frame.avDepthX = engine.st.av.seated && !engine.st.av.to ? engine.st.av.fx - 0.31 : engine.st.av.fx;
    frame.avBox = { avatar: true, minX: frame.avDepthX - 0.01, maxX: frame.avDepthX + 0.01, minY: engine.st.av.fy - 0.01, maxY: engine.st.av.fy + 0.01 };
    frame.catBox = frame.isTour ? { cat: true, minX: engine.st.cat.fx - 0.01, maxX: engine.st.cat.fx + 0.01, minY: engine.st.cat.fy - 0.01, maxY: engine.st.cat.fy + 0.01 } : null;
    frame.dogBox = frame.isTour ? { dog: true, minX: engine.st.dog.fx - 0.01, maxX: engine.st.dog.fx + 0.01, minY: engine.st.dog.fy - 0.01, maxY: engine.st.dog.fy + 0.01 } : null;
    frame.drawCatOnFurniture = frame.isTour && !!(engine.st.cat.perch && engine.CAT_PERCH_SPOTS[engine.st.cat.perch.key]);
    frame.dyn = frame.isTour ? (frame.drawCatOnFurniture ? [frame.avBox, frame.dogBox] : [frame.avBox, frame.catBox, frame.dogBox]) : [frame.avBox];
    if (frame.isTour && engine.st.ghost)
        frame.dyn.push({ ghost: true, minX: engine.GHOST_TILE.cx - 0.01, maxX: engine.GHOST_TILE.cx + 0.01, minY: engine.GHOST_TILE.cy - 0.01, maxY: engine.GHOST_TILE.cy + 0.01 });
    if (frame.isTour && engine.st.tut.active) {
        const sp = engine.updateSpettro();
        frame.dyn.push({ spettro: true, minX: sp.fx - 0.01, maxX: sp.fx + 0.01, minY: sp.fy - 0.01, maxY: sp.fy + 0.01 });
    }
    if (engine.st.room === "piazza") {
        for (const rp of engine.remotePlayers.values()) {
            frame.dyn.push({ remotePlayer: rp, minX: rp.fx - 0.01, maxX: rp.fx + 0.01, minY: rp.fy - 0.01, maxY: rp.fy + 0.01 });
        }
    }
    frame.sorted = engine.entities.concat(frame.dyn).sort(dependencies.cmpDepth);
    frame.plantIdx = [0, 1, 2, 1][Math.floor(engine.st.t * 1.4) % 4];
    frame.turnIdx = engine.sfx.musicOn() ? Math.floor(engine.st.t * 7) % 4 : 0;
    frame.flick = engine.st.t < engine.st.flicker.until;
    frame.pcAlert = frame.isTour && engine.st.alert > engine.st.t && !engine.st.modal;
}
