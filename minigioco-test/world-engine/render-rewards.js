// Motore Asso World: render rewards.
import * as dependencies from "./dependencies";

export function renderRewards(engine, frame) {
    /* — busta lettere: overlay ricompensa crediti fullscreen — */
    if (engine.letterOverlayActive()) {
        const lt = engine.st.letter;
        engine.ctx.save();
        if (engine.st.shake > 0) {
            const sx = (Math.random() - 0.5) * engine.st.shake;
            const sy = (Math.random() - 0.5) * engine.st.shake;
            engine.ctx.translate(sx, sy);
        }
        engine.ctx.fillStyle = "rgba(10, 12, 22, 0.88)";
        engine.ctx.fillRect(0, 0, frame.w, frame.h);
        const centerX = frame.w / 2;
        const centerY = frame.h / 2;
        const uiS = Math.min(frame.w / 340, frame.h / 330, 2.8);
        if (lt.phase === "lift") {
            const elapsed = engine.st.t - lt.t0;
            const k = dependencies.easeOutBack(dependencies.clamp(elapsed / 1.05, 0, 1));
            const envS = dependencies.lerp(0.6, 5.2, dependencies.easeOutQuad(k));
            const yOff = dependencies.lerp(frame.h * 0.18, -24, k);
            const rot = (1 - k) * 0.22 * Math.sin(elapsed * 9);
            const glow = k * 0.35;
            /* scia di particelle oro durante la salita */
            if (Math.random() < 0.6) {
                engine.st.letterFx.push({
                    x: centerX + (Math.random() - 0.5) * 26 * envS,
                    y: centerY + yOff + 14 * envS,
                    vx: (Math.random() - 0.5) * 24, vy: 18 + Math.random() * 22,
                    col: Math.random() < 0.6 ? "#F3C76A" : "#ffe6a8",
                    size: 1.6 + Math.random() * 2.2,
                    dur: 0.5 + Math.random() * 0.35, t0: engine.st.t, grav: 30,
                });
            }
            engine.drawLetterEnvelope(engine.ctx, centerX, centerY + yOff, {
                scale: envS, rot, glow, flapOpen: 0, sealBreak: 0,
            });
        }
        else if (lt.phase === "open") {
            const elapsed = engine.st.t - lt.t0;
            const openK = dependencies.clamp(elapsed / 1.35, 0, 1);
            const sealBreak = dependencies.easeOutQuad(dependencies.clamp(openK / 0.32, 0, 1));
            const flapOpen = dependencies.easeOutCubic(dependencies.clamp((openK - 0.18) / 0.72, 0, 1));
            const glow = flapOpen > 0.55 ? (flapOpen - 0.55) * 2.2 : sealBreak * 0.4;
            const wobble = Math.sin(elapsed * 14) * (1 - flapOpen) * 2.5;
            /* fascio di luce oro sopra il flap che cresce con l'apertura */
            if (flapOpen > 0.05) {
                engine.ctx.save();
                engine.ctx.globalCompositeOperation = "lighter";
                const beamY = centerY - 28 - 52;
                const beamA = 0.18 * flapOpen;
                const bg = engine.ctx.createRadialGradient(centerX + wobble, beamY, 4, centerX + wobble, beamY, 120 * flapOpen + 30);
                bg.addColorStop(0, "rgba(255, 233, 160, " + beamA.toFixed(3) + ")");
                bg.addColorStop(0.5, "rgba(243, 199, 106, " + (beamA * 0.5).toFixed(3) + ")");
                bg.addColorStop(1, "rgba(243, 199, 106, 0)");
                engine.ctx.fillStyle = bg;
                engine.ctx.beginPath();
                engine.ctx.ellipse(centerX + wobble, beamY, 90 * flapOpen + 24, 140 * flapOpen + 30, 0, 0, Math.PI * 2);
                engine.ctx.fill();
                engine.ctx.restore();
            }
            /* one-shot: piccolo burst schegge oro al break del sigillo */
            if (sealBreak > 0.5 && !lt.sealBurstFx) {
                lt.sealBurstFx = true;
                const sx = centerX + wobble, sy = centerY - 28 - 36;
                engine.burstLetterFx(sx, sy, 18);
                engine.st.letterFx.push({ x: sx, y: sy, ring: true, maxRadius: 60, col: "#F3C76A", dur: 0.5, t0: engine.st.t });
            }
            engine.drawLetterEnvelope(engine.ctx, centerX + wobble, centerY - 28, {
                scale: 5.2, flapOpen, sealBreak, glow,
            });
            if (flapOpen < 0.95) {
                engine.ctx.fillStyle = "#F3C76A";
                engine.ctx.font = "bold 11px 'Press Start 2P', monospace";
                engine.ctx.textAlign = "center";
                engine.ctx.globalAlpha = 0.85 + 0.15 * Math.sin(engine.st.t * 6);
                engine.ctx.fillText("CLICCA PER APRIRE 📬", centerX, centerY + 100 * uiS);
                engine.ctx.globalAlpha = 1;
            }
        }
        else if (lt.phase === "reveal" || lt.phase === "done") {
            const elapsed = engine.st.t - lt.t0;
            const revealK = lt.phase === "done" ? 1 : dependencies.clamp(elapsed / 1.35, 0, 1);
            /* flash oro fullscreen breve all'inizio del reveal */
            if (elapsed < 0.25) {
                engine.ctx.fillStyle = "rgba(243, 199, 106, " + (0.18 * (1 - elapsed / 0.25)).toFixed(3) + ")";
                engine.ctx.fillRect(0, 0, frame.w, frame.h);
            }
            const envFade = 1 - dependencies.easeOutQuad(Math.min(revealK * 1.4, 1));
            const envY = centerY + dependencies.lerp(-28, 72, dependencies.easeOutQuad(revealK));
            const envS = dependencies.lerp(5.2, 2.8, dependencies.easeOutQuad(revealK));
            if (envFade > 0.05) {
                engine.ctx.globalAlpha = envFade * 0.75;
                engine.drawLetterEnvelope(engine.ctx, centerX, envY, {
                    scale: envS, flapOpen: 1, sealBreak: 1, glow: 0.15 * envFade,
                });
                engine.ctx.globalAlpha = 1;
            }
            const emerge = dependencies.easeOutBack(revealK);
            const rewardY = centerY + dependencies.lerp(48, -8, emerge);
            engine.drawCreditsReward(engine.ctx, centerX, rewardY, lt.tournamentName, lt.creditsBefore, lt.creditsAfter, revealK, uiS, engine.st.t, lt.phase === "done", { ebartexHover: !!lt.ebartexHover });
            /* hit rect del link "Ebartex" in coordinate screen (solo a done) per click/hover */
            if (lt.phase === "done") {
                engine.ctx.font = "600 11px 'Segoe UI', system-ui, sans-serif";
                const prefix = "Credito pronto sul portale ";
                const linkText = "Ebartex";
                const suffix = ".";
                const wPrefix = engine.ctx.measureText(prefix).width;
                const wLink = engine.ctx.measureText(linkText).width;
                const wSuffix = engine.ctx.measureText(suffix).width;
                const wTotal = wPrefix + wLink + wSuffix;
                const linkXstart = -wTotal / 2 + wPrefix;
                const linkCx = centerX + (linkXstart + wLink / 2) * uiS;
                const linkCy = rewardY + 80 * uiS;
                lt.ebartexHitRect = {
                    x: linkCx - (wLink * uiS) / 2 - 6,
                    y: linkCy - 9 * uiS,
                    w: wLink * uiS + 12,
                    h: 18 * uiS,
                };
            }
            if (engine.fx.holo && revealK > 0.15) {
                engine.ctx.save();
                engine.ctx.globalCompositeOperation = "lighter";
                engine.ctx.globalAlpha = 0.28 * revealK;
                const cardH = dependencies.CREDITS_REWARD_CARD.h * uiS * emerge;
                const sweepX = centerX - cardH + ((engine.st.t * 140) % (cardH * 2.2));
                const sg = engine.ctx.createLinearGradient(sweepX, rewardY - cardH / 2, sweepX + 50, rewardY + cardH / 2);
                sg.addColorStop(0, "rgba(255,255,255,0)");
                sg.addColorStop(0.5, "rgba(255,233,176,0.9)");
                sg.addColorStop(1, "rgba(255,255,255,0)");
                engine.ctx.fillStyle = sg;
                engine.ctx.fillRect(centerX - 140 * uiS, rewardY - cardH / 2, 280 * uiS, cardH);
                engine.ctx.restore();
            }
        }
        engine.ctx.restore();
    }
    /* — particelle confetti busta lettere (screen-space) — */
    engine.st.letterFx = engine.st.letterFx.filter((p) => engine.st.t - p.t0 < p.dur);
    for (const p of engine.st.letterFx) {
        const k = (engine.st.t - p.t0) / p.dur;
        engine.ctx.globalAlpha = Math.max(0, 1 - k);
        if (p.ring) {
            engine.ctx.strokeStyle = p.col;
            engine.ctx.lineWidth = 2.5 * (1 - k);
            engine.ctx.beginPath();
            engine.ctx.arc(p.x, p.y, p.maxRadius * k, 0, Math.PI * 2);
            engine.ctx.stroke();
        }
        else {
            engine.ctx.fillStyle = p.col;
            const gy = p.grav ? p.grav * k * k : 0;
            engine.ctx.fillRect(p.x + p.vx * k, p.y + p.vy * k + gy, p.size, p.size);
        }
    }
    engine.ctx.globalAlpha = 1;
    /* — flash della foto — */
    if (engine.st.flash && engine.st.t - engine.st.flash < 0.25) {
        engine.ctx.fillStyle = "rgba(255,255,255," + (0.5 * (1 - (engine.st.t - engine.st.flash) / 0.25)).toFixed(3) + ")";
        engine.ctx.fillRect(0, 0, frame.w, frame.h);
    }
    engine.ctx.textAlign = "left";
    engine.ctx.textBaseline = "alphabetic";
}
