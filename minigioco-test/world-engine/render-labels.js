// Motore Asso World: render labels.
import * as dependencies from "./dependencies";

export function renderLabels(engine, frame) {
    /* — frecce guida + etichette sopra gli oggetti (sempre visibili, solo Sala Tornei) — */
    if (frame.isTour && !engine.st.photoHide) {
        const GUIDE = {
            pc: "Tornei live ufficiali",
            board: "Crea un nuovo torneo",
            decks: "Monta il tuo mazzo",
        };
        for (const id of ["pc", "decks", "board"]) {
            if (engine.st.modal === id)
                continue;
            // niente doppione: se il tooltip di hover è già su questo oggetto, salta l'etichetta
            if (engine.st.nearObj && engine.st.nearObj.id === id && !engine.st.modal && !engine.st.lock)
                continue;
            const sp = engine.project(dependencies.ICON_POS[id].x, dependencies.ICON_POS[id].y);
            const alertMe = id === "pc" && engine.st.alert > engine.st.t;
            const nearMe = engine.st.nearObj && engine.st.nearObj.id === id;
            const ph = id === "pc" ? 0 : id === "decks" ? 2.1 : 4.2;
            const bob = Math.sin(engine.st.t * (alertMe ? 6 : 2.4) + ph) * (alertMe ? 5 : 3);
            const accent = alertMe ? "#ff8a3d" : "#ffd76e";
            const emph = alertMe || nearMe;
            const tipY = sp.y + bob; // punta della freccia (poco sopra l'oggetto)
            // etichetta (un filo più grande e leggibile)
            engine.ctx.font = "700 14px 'Segoe UI', system-ui, sans-serif";
            const tw = engine.ctx.measureText(GUIDE[id]).width;
            const padX = 14, lh = 31, arrowH = 17, gap = 6;
            const lw = tw + padX * 2;
            const aBase = tipY - 4 - arrowH; // base della freccia
            let ly = aBase - gap - lh; // top etichetta
            let lx = dependencies.clamp(sp.x - lw / 2, 8, frame.w - lw - 8);
            if (ly < 6)
                ly = 6;
            // freccia (triangolo verso il basso) con bordo scuro
            engine.ctx.save();
            engine.ctx.shadowColor = "rgba(0,0,0,0.45)";
            engine.ctx.shadowBlur = 6;
            engine.ctx.shadowOffsetY = 2;
            engine.ctx.beginPath();
            engine.ctx.moveTo(sp.x - 11, aBase);
            engine.ctx.lineTo(sp.x + 11, aBase);
            engine.ctx.lineTo(sp.x, tipY - 4);
            engine.ctx.closePath();
            engine.ctx.fillStyle = accent;
            engine.ctx.fill();
            engine.ctx.shadowBlur = 0;
            engine.ctx.shadowOffsetY = 0;
            engine.ctx.lineWidth = 2;
            engine.ctx.strokeStyle = "rgba(20,16,30,0.85)";
            engine.ctx.stroke();
            engine.ctx.restore();
            // pillola etichetta
            engine.ctx.save();
            engine.ctx.shadowColor = "rgba(0,0,0,0.4)";
            engine.ctx.shadowBlur = 8;
            engine.ctx.shadowOffsetY = 2;
            engine.rr(engine.ctx, lx, ly, lw, lh, 10);
            engine.ctx.fillStyle = "rgba(18,20,36,0.94)";
            engine.ctx.fill();
            engine.ctx.shadowBlur = 0;
            engine.ctx.shadowOffsetY = 0;
            engine.ctx.lineWidth = emph ? 2 : 1.5;
            engine.ctx.strokeStyle = emph ? accent : "rgba(255,255,255,0.22)";
            engine.ctx.stroke();
            engine.ctx.restore();
            engine.ctx.fillStyle = "#fff3d6";
            engine.ctx.textAlign = "center";
            engine.ctx.textBaseline = "middle";
            engine.ctx.font = "700 14px 'Segoe UI', system-ui, sans-serif";
            engine.ctx.fillText(GUIDE[id], lx + lw / 2, ly + lh / 2 + 0.5);
            engine.ctx.textAlign = "left";
            engine.ctx.textBaseline = "alphabetic";
        }
        /* — etichetta specchio "Personalizza l'avatar" (stesso stile guide, screen-space) — */
        if (engine.st.modal !== "mirror") {
            const mEgg = engine.eggs.find((e) => e.key === "mirror");
            if (mEgg) {
                const mr = mEgg.rect;
                const mp = engine.project(mr.x + mr.w / 2, mr.y);
                const label = "Personalizza l'avatar";
                const bob = Math.sin(engine.st.t * 2.4 + 1.1) * 3;
                const accent = "#ffd76e";
                const tipY = mp.y + bob;
                engine.ctx.font = "700 14px 'Segoe UI', system-ui, sans-serif";
                const tw = engine.ctx.measureText(label).width;
                const padX = 14, lh = 31, arrowH = 17, gap = 6;
                const lw = tw + padX * 2;
                const aBase = tipY - 4 - arrowH;
                let ly = aBase - gap - lh;
                let lx = dependencies.clamp(mp.x - lw / 2, 8, frame.w - lw - 8);
                if (ly < 6)
                    ly = 6;
                engine.ctx.save();
                engine.ctx.shadowColor = "rgba(0,0,0,0.45)";
                engine.ctx.shadowBlur = 6;
                engine.ctx.shadowOffsetY = 2;
                engine.ctx.beginPath();
                engine.ctx.moveTo(mp.x - 11, aBase);
                engine.ctx.lineTo(mp.x + 11, aBase);
                engine.ctx.lineTo(mp.x, tipY - 4);
                engine.ctx.closePath();
                engine.ctx.fillStyle = accent;
                engine.ctx.fill();
                engine.ctx.shadowBlur = 0;
                engine.ctx.shadowOffsetY = 0;
                engine.ctx.lineWidth = 2;
                engine.ctx.strokeStyle = "rgba(20,16,30,0.85)";
                engine.ctx.stroke();
                engine.ctx.restore();
                engine.ctx.save();
                engine.ctx.shadowColor = "rgba(0,0,0,0.4)";
                engine.ctx.shadowBlur = 8;
                engine.ctx.shadowOffsetY = 2;
                engine.rr(engine.ctx, lx, ly, lw, lh, 10);
                engine.ctx.fillStyle = "rgba(18,20,36,0.94)";
                engine.ctx.fill();
                engine.ctx.shadowBlur = 0;
                engine.ctx.shadowOffsetY = 0;
                engine.ctx.lineWidth = 1.5;
                engine.ctx.strokeStyle = "rgba(255,255,255,0.22)";
                engine.ctx.stroke();
                engine.ctx.restore();
                engine.ctx.fillStyle = "#fff3d6";
                engine.ctx.textAlign = "center";
                engine.ctx.textBaseline = "middle";
                engine.ctx.font = "700 14px 'Segoe UI', system-ui, sans-serif";
                engine.ctx.fillText(label, lx + lw / 2, ly + lh / 2 + 0.5);
                engine.ctx.textAlign = "left";
                engine.ctx.textBaseline = "alphabetic";
            }
        }
    }
    if (engine.st.bubble && !engine.st.photoHide) {
        const age = engine.st.t - engine.st.bubble.t0;
        const pop = dependencies.easeOutBack(dependencies.clamp(age * 4, 0, 1));
        const fade = dependencies.clamp((engine.st.bubble.dur - age) * 2, 0, 1);
        const isCat = engine.st.bubble.target === "cat";
        const isDog = engine.st.bubble.target === "dog";
        const c = isCat ? dependencies.tileTop(engine.st.cat.fx, engine.st.cat.fy) : (isDog ? dependencies.tileTop(engine.st.dog.fx, engine.st.dog.fy) : dependencies.tileTop(engine.st.av.fx, engine.st.av.fy));
        const lift = (isCat && engine.st.cat.perch) ? engine.st.cat.perch.lift : ((isDog && engine.st.dog.perch) ? engine.st.dog.perch.lift : 0);
        const pt = engine.project(c.x, c.y + dependencies.HTH - 48 - lift);
        engine.ctx.font = "600 14px 'Segoe UI', system-ui, sans-serif";
        const tw2 = engine.ctx.measureText(engine.st.bubble.text).width;
        const bw = (tw2 + 26) * pop, bh = 32 * pop;
        const bx = dependencies.clamp(pt.x - bw / 2, 6, frame.w - bw - 6), by = pt.y - bh - 8;
        engine.ctx.globalAlpha = fade;
        engine.ctx.fillStyle = "#ffffff";
        engine.rr(engine.ctx, bx, by, bw, bh, 10 * pop);
        engine.ctx.fill();
        engine.ctx.strokeStyle = dependencies.P.outline;
        engine.ctx.lineWidth = 2;
        engine.ctx.stroke();
        engine.ctx.beginPath();
        engine.ctx.moveTo(pt.x - 5 * pop, by + bh - 1);
        engine.ctx.lineTo(pt.x + 5 * pop, by + bh - 1);
        engine.ctx.lineTo(pt.x, by + bh + 7 * pop);
        engine.ctx.closePath();
        engine.ctx.fillStyle = "#ffffff";
        engine.ctx.fill();
        engine.ctx.strokeStyle = dependencies.P.outline;
        engine.ctx.lineWidth = 1.5;
        engine.ctx.beginPath();
        engine.ctx.moveTo(pt.x - 5 * pop, by + bh + 1);
        engine.ctx.lineTo(pt.x, by + bh + 7 * pop);
        engine.ctx.moveTo(pt.x + 5 * pop, by + bh + 1);
        engine.ctx.lineTo(pt.x, by + bh + 7 * pop);
        engine.ctx.stroke();
        if (pop > 0.9) {
            engine.ctx.fillStyle = "#23263c";
            engine.ctx.font = "600 " + Math.round(14 * pop) + "px 'Segoe UI', system-ui, sans-serif";
            engine.ctx.fillText(engine.st.bubble.text, bx + 13, by + bh / 2 + 5);
        }
        engine.ctx.globalAlpha = 1;
    }
}
