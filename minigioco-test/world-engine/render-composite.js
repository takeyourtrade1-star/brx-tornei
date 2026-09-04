// Motore Asso World: render composite.
import * as dependencies from "./dependencies";

export function renderComposite(engine, frame) {
    /* — dinamici — */
    if (frame.isTour && engine.fx.glows) {
        // glow del monitor
        const sc = engine.qlerp(0.5, 0.5);
        const mg = engine.wctx.createRadialGradient(sc.x, sc.y, 2, sc.x, sc.y, 54);
        mg.addColorStop(0, "rgba(140,225,245," + (0.1 + (frame.flick ? 0.07 : 0) + 0.04 * Math.sin(engine.st.t * 3)) + ")");
        mg.addColorStop(1, "rgba(140,225,245,0)");
        engine.wctx.save();
        engine.wctx.globalCompositeOperation = "lighter";
        engine.wctx.fillStyle = mg;
        engine.wctx.fillRect(sc.x - 56, sc.y - 56, 112, 112);
        // led telecamere (REC lampeggiante)
        for (const led of engine.camLeds) {
            if ((engine.st.t + led.ph) % 1.6 < 0.9) {
                engine.wctx.fillStyle = "rgba(255,70,60,0.9)";
                engine.wctx.fillRect(Math.round(led.x), Math.round(led.y), 2, 2);
                const lg = engine.wctx.createRadialGradient(led.x + 1, led.y + 1, 0, led.x + 1, led.y + 1, 7);
                lg.addColorStop(0, "rgba(255,70,60,0.35)");
                lg.addColorStop(1, "rgba(255,70,60,0)");
                engine.wctx.fillStyle = lg;
                engine.wctx.fillRect(led.x - 6, led.y - 6, 14, 14);
            }
        }
        // lampada: alone + cono di luce + pozza sul pavimento, con flicker occasionale
        const lf = (engine.st.t < engine.st.lampF.until ? 0.4 : 1) * (engine.phase.lampBoost || 1);
        const lg2 = engine.wctx.createRadialGradient(engine.lampGlow.x, engine.lampGlow.y, 2, engine.lampGlow.x, engine.lampGlow.y, 46);
        lg2.addColorStop(0, "rgba(255,206,120," + ((0.13 + 0.04 * Math.sin(engine.st.t * 1.7)) * lf).toFixed(3) + ")");
        lg2.addColorStop(1, "rgba(255,206,120,0)");
        engine.wctx.fillStyle = lg2;
        engine.wctx.fillRect(engine.lampGlow.x - 48, engine.lampGlow.y - 48, 96, 96);
        const coneG = engine.wctx.createLinearGradient(0, engine.lampGlow.y, 0, engine.lampFloor.y);
        coneG.addColorStop(0, "rgba(255,206,120," + (0.11 * lf).toFixed(3) + ")");
        coneG.addColorStop(1, "rgba(255,206,120,0.015)");
        dependencies.quadFill(engine.wctx, [
            { x: engine.lampGlow.x - 8, y: engine.lampGlow.y + 2 }, { x: engine.lampGlow.x + 8, y: engine.lampGlow.y + 2 },
            { x: engine.lampGlow.x + 27, y: engine.lampFloor.y }, { x: engine.lampGlow.x - 27, y: engine.lampFloor.y },
        ], coneG);
        const pg = engine.wctx.createRadialGradient(engine.lampGlow.x, engine.lampFloor.y, 2, engine.lampGlow.x, engine.lampFloor.y, 32);
        pg.addColorStop(0, "rgba(255,206,120," + ((0.11 + 0.035 * Math.sin(engine.st.t * 1.7 + 1)) * lf).toFixed(3) + ")");
        pg.addColorStop(1, "rgba(255,206,120,0)");
        engine.wctx.fillStyle = pg;
        engine.wctx.beginPath();
        engine.wctx.ellipse(engine.lampGlow.x, engine.lampFloor.y, 32, 13, 0, 0, Math.PI * 2);
        engine.wctx.fill();
        engine.wctx.restore();
    }
    // pulviscolo nella luce
    if (frame.isTour && engine.fx.motes) {
        const A = dependencies.wallL(5.9, 0), B = dependencies.wallL(7.5, 0);
        for (const m of engine.st.motes) {
            const bx = dependencies.lerp(A.x, B.x, m.u), by = dependencies.lerp(A.y, B.y, m.u);
            const x = bx + m.v * 4.6 * dependencies.HTW + Math.sin(engine.st.t * 1.3 + m.ph) * 3;
            const y = by + m.v * 4.6 * dependencies.HTH - m.lift;
            const a = Math.max(0, Math.sin(Math.PI * m.v)) * (0.22 + 0.18 * Math.sin(engine.st.t * 2 + m.ph));
            if (a > 0.02) {
                engine.wctx.fillStyle = "rgba(255,250,225," + a.toFixed(3) + ")";
                engine.wctx.fillRect(Math.round(x), Math.round(y), 2, 2);
            }
        }
    }
    // frecce guida + etichette: disegnate in screen-space (testo nitido) più sotto
    /* — LED del citofono (verde fisso, rosso lampeggiante quando suona) — */
    if (frame.isTour) {
        const ringing = engine.st.ring && engine.st.t < engine.st.ring.until;
        const on = !ringing || Math.floor(engine.st.t * 6) % 2 === 0;
        engine.wctx.fillStyle = ringing ? (on ? "#ff5a4e" : "#5a1e1a") : "#51e3a4";
        engine.wctx.fillRect(Math.round(engine.intercomLed.x), Math.round(engine.intercomLed.y), 2, 2);
        if (ringing && on) {
            const ig = engine.wctx.createRadialGradient(engine.intercomLed.x + 1, engine.intercomLed.y + 1, 0, engine.intercomLed.x + 1, engine.intercomLed.y + 1, 9);
            ig.addColorStop(0, "rgba(255,90,78,0.5)");
            ig.addColorStop(1, "rgba(255,90,78,0)");
            engine.wctx.fillStyle = ig;
            engine.wctx.fillRect(engine.intercomLed.x - 8, engine.intercomLed.y - 8, 18, 18);
        }
    }
    /* — particelle (cuori, zzz, note, scintille) — */
    for (const p of engine.st.fx) {
        const age = engine.st.t - p.t0;
        if (age < 0)
            continue;
        const k = age / p.dur;
        engine.wctx.globalAlpha = Math.max(0, 1 - k);
        engine.wctx.fillStyle = p.col;
        engine.wctx.font = "bold " + p.size + "px 'Segoe UI', sans-serif";
        engine.wctx.fillText(p.ch, Math.round(p.x + Math.sin((engine.st.t + p.ph) * 3) * 3), Math.round(p.y - k * p.rise));
    }
    engine.wctx.globalAlpha = 1;
    /* — compositing su schermo — */
    engine.ctx.setTransform(1, 0, 0, 1, 0, 0);
    engine.ctx.clearRect(0, 0, engine.canvas.width, engine.canvas.height);
    // Disegna le carte caotiche sullo schermo intero sotto la stanza
    if (engine.st.shadow && engine.st.shadowCards) {
        engine.ctx.setTransform(frame.dpr, 0, 0, frame.dpr, 0, 0);
        for (const card of engine.st.shadowCards) {
            engine.drawShadowCard(engine.ctx, card);
        }
    }
    frame.s = frame.scale * engine.st.cam.z * frame.dpr;
    engine.ctx.imageSmoothingEnabled = frame.scale * engine.st.cam.z < 1;
    frame.shX = engine.st.shake > 0 ? (Math.random() - 0.5) * engine.st.shake : 0;
    frame.shY = engine.st.shake > 0 ? (Math.random() - 0.5) * engine.st.shake : 0;
    engine.ctx.setTransform(frame.s, 0, 0, frame.s, engine.canvas.width / 2 - engine.st.cam.x * frame.s + frame.shX, engine.canvas.height / 2 - engine.st.cam.y * frame.s + frame.shY);
    engine.ctx.drawImage(engine.world, 0, 0);
    engine.ctx.setTransform(frame.dpr, 0, 0, frame.dpr, 0, 0);
    engine.ctx.imageSmoothingEnabled = true;
    /* — fade cambio stanza (neon pink, V-shape: 0→1 al midpoint, poi 1→0) — */
    if (engine.st.transition) {
        const p = engine.st.transition.t / 0.8;
        const alpha = p < 0.5 ? p * 2 : 2 - p * 2;
        engine.ctx.fillStyle = "rgba(13,13,26," + alpha.toFixed(3) + ")";
        engine.ctx.fillRect(0, 0, engine.canvas.width / frame.dpr, engine.canvas.height / frame.dpr);
        if (alpha > 0.5) {
            engine.ctx.fillStyle = "rgba(255,42,109," + ((alpha - 0.5) * 0.8).toFixed(3) + ")";
            engine.ctx.fillRect(0, 0, engine.canvas.width / frame.dpr, engine.canvas.height / frame.dpr);
        }
    }
    /* — layer schermo: tooltip + fumetto (testo nitido) — */
    engine.ctx.textAlign = "left";
    engine.ctx.textBaseline = "alphabetic";
    if (engine.st.nearObj && !engine.st.modal && !engine.st.lock && !engine.st.photoHide) {
        const o = engine.st.nearObj;
        const a = dependencies.clamp((engine.st.t - engine.st.nearSince) * 5, 0, 1);
        const r = o.hitRect;
        const pTop = engine.project(r.x + r.w / 2, r.y + (o.id === "board" ? -2 : 6));
        engine.ctx.font = "600 13px 'Segoe UI', system-ui, sans-serif";
        const l1 = o.icon + " " + o.name;
        const l2 = o.desc + " · clicca per aprire";
        const w1 = engine.ctx.measureText(l1).width;
        engine.ctx.font = "11px 'Segoe UI', system-ui, sans-serif";
        const w2 = engine.ctx.measureText(l2).width;
        const bw = Math.max(w1, w2) + 22, bh = 42;
        const bx = dependencies.clamp(pTop.x - bw / 2, 8, frame.w - bw - 8);
        const by = Math.max(8, pTop.y - bh - 12);
        engine.ctx.globalAlpha = a;
        engine.ctx.fillStyle = "rgba(18,20,36,0.92)";
        engine.rr(engine.ctx, bx, by, bw, bh, 9);
        engine.ctx.fill();
        engine.ctx.strokeStyle = "rgba(255,255,255,0.18)";
        engine.ctx.lineWidth = 1;
        engine.ctx.stroke();
        engine.ctx.beginPath();
        engine.ctx.moveTo(dependencies.clamp(pTop.x, bx + 12, bx + bw - 12) - 5, by + bh);
        engine.ctx.lineTo(dependencies.clamp(pTop.x, bx + 12, bx + bw - 12) + 5, by + bh);
        engine.ctx.lineTo(dependencies.clamp(pTop.x, bx + 12, bx + bw - 12), by + bh + 6);
        engine.ctx.closePath();
        engine.ctx.fillStyle = "rgba(18,20,36,0.92)";
        engine.ctx.fill();
        engine.ctx.fillStyle = "#ffe9b0";
        engine.ctx.font = "600 13px 'Segoe UI', system-ui, sans-serif";
        engine.ctx.fillText(l1, bx + 11, by + 17);
        engine.ctx.fillStyle = "#c8d0e8";
        engine.ctx.font = "11px 'Segoe UI', system-ui, sans-serif";
        engine.ctx.fillText(l2, bx + 11, by + 33);
        engine.ctx.globalAlpha = 1;
    }
}
