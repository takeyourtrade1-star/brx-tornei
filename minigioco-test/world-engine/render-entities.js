// Motore Asso World: render entities.
import * as dependencies from "./dependencies";

export function renderEntities(engine, frame) {
    for (const e of frame.sorted) {
        if (e.avatar) {
            engine.drawAvatarSprite();
            continue;
        }
        if (e.remotePlayer) {
            dependencies.drawRemotePlayer(engine.wctx, e.remotePlayer, dependencies.tileTop, dependencies.HTH, engine.st.t, engine.remoteRenderOptions);
            continue;
        }
        if (e.cat) {
            engine.drawCatSprite();
            continue;
        }
        if (e.dog) {
            engine.drawDogSprite();
            continue;
        }
        if (e.ghost) {
            engine.drawGhostSprite();
            continue;
        }
        if (e.spettro) {
            engine.drawSpettroCompanion();
            continue;
        }
        const spr = e.frames ? e.frames[e.key === "turn" ? frame.turnIdx : frame.plantIdx] : e.spr;
        const x = Math.round(e.anchor.x - spr.ax), y = Math.round(e.anchor.y - spr.ay);
        if (e.inter && ((engine.st.nearObj && engine.st.nearObj.id === e.inter) || (e.inter === "pc" && frame.pcAlert)) && !engine.st.modal) {
            engine.drawGlow(engine.sils[e.inter], x, y, e.inter === "pc" && frame.pcAlert ? 1.9 : 1);
        }
        if (e.key === "turn" && (engine.st.hover.decor === "music" || engine.sfx.musicOn()))
            engine.drawGlow(engine.turnSil, x, y, engine.sfx.musicOn() ? 0.6 : 1);
        // Sedia rotante (oscillazione ammortizzata se urtata)
        let angle = 0;
        if (e.key === "chair" && engine.fx.chairSpin && engine.st.chairSpin > 0 && engine.st.t - engine.st.chairSpin < 2.5) {
            const elapsed = engine.st.t - engine.st.chairSpin;
            angle = Math.sin(elapsed * 10) * 0.16 * Math.exp(-elapsed * 1.5);
        }
        engine.wctx.save();
        if (angle !== 0) {
            const cx = e.anchor.x;
            const cy = e.anchor.y - 12;
            engine.wctx.translate(cx, cy);
            engine.wctx.rotate(angle);
            engine.wctx.translate(-cx, -cy);
        }
        engine.wctx.drawImage(spr.cv, x, y);
        engine.wctx.restore();
        if (e.key === "chair" && frame.drawCatOnFurniture && engine.st.cat.perch.key === "chair")
            engine.drawCatSprite();
        if (e.key === "desk") {
            engine.drawMonitorScreen(engine.fx.flicker && (frame.flick || frame.pcAlert));
            if (frame.drawCatOnFurniture && engine.st.cat.perch.key === "desk")
                engine.drawCatSprite();
        }
        if (e.key === "table") {
            engine.drawTableClock();
            // Disegna le carte sparpagliate da Missy
            if (engine.fx.scatter)
                for (const card of engine.st.scatter) {
                    const age = engine.st.t - card.t0;
                    engine.wctx.save();
                    engine.wctx.translate(card.x, card.y);
                    engine.wctx.rotate(card.rot);
                    engine.wctx.globalAlpha = dependencies.clamp((12 - age) * 0.5, 0, 1);
                    engine.wctx.fillStyle = "#10142a";
                    engine.wctx.fillRect(-4, -6, 8, 12);
                    engine.wctx.fillStyle = "#f5f0e2";
                    engine.wctx.fillRect(-3, -5, 6, 10);
                    engine.wctx.fillStyle = card.col;
                    engine.wctx.fillRect(-2, -3, 4, 6);
                    engine.wctx.restore();
                }
            engine.wctx.globalAlpha = 1;
            // Disegna l'animazione di smazzata se siamo AFK al tavolo
            if (engine.st.afkShuffle && engine.fx.cssAnimations) {
                const tCenter = engine.tablePt(7.0, 3.0);
                const drawMiniDeck = (dx, dy, col, n = 4) => {
                    for (let i = 0; i < n; i++) {
                        engine.wctx.fillStyle = "#10142a";
                        engine.wctx.fillRect(dx - 5, dy - 7 - i * 1.5, 10, 14);
                        engine.wctx.fillStyle = col;
                        engine.wctx.fillRect(dx - 4, dy - 6 - i * 1.5, 8, 12);
                    }
                };
                const elapsed = engine.st.t - engine.st.afkShuffle.t0;
                const p1 = { x: tCenter.x - 26, y: tCenter.y };
                const p2 = { x: tCenter.x + 26, y: tCenter.y };
                const midX = (p1.x + p2.x) / 2;
                drawMiniDeck(p1.x, p1.y, "#d94f46", 2);
                drawMiniDeck(p2.x, p2.y, "#4a7fd6", 2);
                const nCards = 6;
                for (let i = 0; i < nCards; i++) {
                    const tCard = (elapsed * 2.5 - (i / nCards)) % 1;
                    if (tCard < 0 || tCard > 1)
                        continue;
                    const side = i % 2 === 0 ? -1 : 1;
                    const startX = midX + side * 26;
                    const x = dependencies.lerp(startX, midX, tCard);
                    const h = Math.sin(tCard * Math.PI) * 16;
                    const y = tCenter.y - h;
                    engine.wctx.save();
                    engine.wctx.translate(x, y);
                    engine.wctx.rotate(tCard * side * 0.8);
                    engine.wctx.fillStyle = i % 2 === 0 ? "#d94f46" : "#4a7fd6";
                    engine.wctx.fillRect(-4, -6, 8, 12);
                    engine.wctx.fillStyle = "#fff";
                    engine.wctx.fillRect(-3, -5, 6, 10);
                    engine.wctx.restore();
                }
                drawMiniDeck(midX, tCenter.y, dependencies.P.gold, Math.floor((elapsed * 4) % 12));
            }
            // Disegna le fasi di Hype (split, deal) sul tavolo
            if (engine.st.hype) {
                const tCenter = engine.tablePt(7.0, 3.0);
                const drawMiniDeck = (dx, dy, col, n = 4) => {
                    for (let i = 0; i < n; i++) {
                        engine.wctx.fillStyle = "#10142a";
                        engine.wctx.fillRect(dx - 5, dy - 7 - i * 1.5, 10, 14);
                        engine.wctx.fillStyle = col;
                        engine.wctx.fillRect(dx - 4, dy - 6 - i * 1.5, 8, 12);
                    }
                };
                if (engine.st.hype.phase === "split") {
                    const elapsed = engine.st.t - engine.st.hype.t0;
                    const k = dependencies.clamp(elapsed / 1.0, 0, 1);
                    const dx = k * 12;
                    const lift = Math.sin(k * Math.PI) * 4;
                    drawMiniDeck(tCenter.x - 14 - dx, tCenter.y - lift, "#d94f46");
                    drawMiniDeck(tCenter.x + 14 + dx, tCenter.y - lift, "#4a7fd6");
                }
                else if (engine.st.hype.phase === "deal" && engine.st.hype.deals) {
                    for (const card of engine.st.hype.deals) {
                        engine.wctx.save();
                        engine.wctx.translate(card.x, card.y);
                        engine.wctx.rotate(card.rot);
                        engine.wctx.fillStyle = "#10142a";
                        engine.wctx.fillRect(-5, -7.5, 10, 15);
                        engine.wctx.fillStyle = "#f5f0e2";
                        engine.wctx.fillRect(-4, -6.5, 8, 13);
                        engine.wctx.fillStyle = card.color;
                        engine.wctx.fillRect(-2.5, -4.5, 5, 9);
                        engine.wctx.restore();
                    }
                }
            }
            if (frame.drawCatOnFurniture && engine.st.cat.perch.key === "table")
                engine.drawCatSprite();
        }
    }
    /* — busta lettere sul pavimento (slide / idle) — */
    if (frame.isTour && engine.st.letter && (engine.st.letter.phase === "slide" || engine.st.letter.phase === "idle")) {
        const lt = engine.st.letter;
        engine.wctx.save();
        const glow = lt.phase === "idle" ? 0.35 + 0.15 * Math.sin(engine.st.t * 8) : 0.2;
        const pgG = engine.wctx.createRadialGradient(lt.x, lt.y, 2, lt.x, lt.y, 18);
        pgG.addColorStop(0, "rgba(243, 199, 106, " + glow + ")");
        pgG.addColorStop(1, "rgba(243, 199, 106, 0)");
        engine.wctx.fillStyle = pgG;
        engine.wctx.beginPath();
        engine.wctx.ellipse(lt.x, lt.y + 6, 14, 5, 0, 0, Math.PI * 2);
        engine.wctx.fill();
        engine.drawLetterEnvelope(engine.wctx, lt.x, lt.y, { rot: lt.rot || 0 });
        engine.wctx.restore();
    }
    /* — riflesso notturno dell'avatar nella finestra — */
    if (frame.isTour && engine.phase.id === "night" && engine.st.avDraw && engine.fx.reflections) {
        engine.wctx.save();
        engine.wctx.beginPath();
        const g0 = dependencies.wallL(5.82, 86), g1 = dependencies.wallL(7.58, 86), g2 = dependencies.wallL(7.58, 34), g3 = dependencies.wallL(5.82, 34);
        engine.wctx.moveTo(g0.x, g0.y);
        engine.wctx.lineTo(g1.x, g1.y);
        engine.wctx.lineTo(g2.x, g2.y);
        engine.wctx.lineTo(g3.x, g3.y);
        engine.wctx.closePath();
        engine.wctx.clip();
        const rp = dependencies.wallL(dependencies.clamp(engine.st.av.fy, 5.95, 7.45), 30);
        const sp = engine.st.avDraw;
        engine.wctx.globalAlpha = 0.16;
        engine.wctx.translate(rp.x, rp.y);
        engine.wctx.scale(-0.8, 0.8);
        engine.wctx.drawImage(sp.cv, -sp.feet.x, -sp.feet.y);
        engine.wctx.restore();
    }
    /* — tinta ambiente (giorno/notte), prima dei bagliori — */
    if (frame.isTour && engine.phase.amb) {
        engine.wctx.fillStyle = engine.phase.amb;
        engine.wctx.fillRect(0, 0, dependencies.WW, dependencies.WH);
    }
}
