// Motore Asso World: update world events.
import * as dependencies from "./dependencies";

export function updateWorldEvents(engine, frame) {
    /* — note musicali dal giradischi — */
    if (engine.sfx.musicOn() && engine.st.t > engine.st.nextNote && engine.fx.particles) {
        engine.st.nextNote = engine.st.t + 0.7;
        engine.spawnFx("note", engine.turnTop.x, engine.turnTop.y);
    }
    /* — countdown del torneo (sveglia sul tavolo) — */
    if (engine.st.countdown) {
        const rem = engine.st.countdown - Date.now();
        if (rem <= 0) {
            engine.st.countdown = null;
            engine.st.cdRang = false;
            engine.sfx.success();
            engine.st.alert = engine.st.t + 6;
            engine.showBubble("🔔 Si comincia! Il torneo è LIVE!", 4);
        }
        else if (rem < 60000 && !engine.st.cdRang) {
            engine.st.cdRang = true;
            engine.sfx.ding();
            engine.showBubble("⏰ Il torneo inizia tra 1 minuto!", 4);
        }
    }
    /* — gestione Shadow Realm — */
    if (engine.st.shadow) {
        if (engine.st.t > engine.st.shadow.until) {
            engine.exitShadow();
        }
        else {
            for (const col of engine.st.matrix) {
                col.y += frame.dt * col.sp * 0.8;
                if (col.y > 1.2) {
                    col.y = -0.2;
                    col.u = Math.random();
                    col.sp = 0.25 + Math.random() * 0.5;
                }
            }
            if (engine.st.shadowCards) {
                const w = engine.st.view ? engine.st.view.w : dependencies.WW;
                const h = engine.st.view ? engine.st.view.h : dependencies.WH;
                for (const card of engine.st.shadowCards) {
                    card.x += card.vx * frame.dt;
                    card.y += card.vy * frame.dt;
                    card.rot += card.vr * frame.dt;
                    if (card.x < -60)
                        card.x = w + 60;
                    else if (card.x > w + 60)
                        card.x = -60;
                    if (card.y < -85)
                        card.y = h + 85;
                    else if (card.y > h + 85)
                        card.y = -85;
                }
            }
        }
    }
    /* — busta lettere: spawn ogni 40-50s (solo Sala Tornei) — */
    if (engine.integrationMode !== "site" && frame.isTour && !engine.st.letter && engine.st.t > engine.st.letterNextAt && engine.st.introDone && !engine.st.modal && !engine.st.lock && !engine.st.cinematic && !engine.st.hype) {
        engine.spawnLetter();
    }
    /* — gestione sequenza busta lettere — */
    if (engine.st.letter) {
        const lt = engine.st.letter;
        if (lt.phase === "slide") {
            const elapsed = engine.st.t - lt.t0;
            const k = dependencies.easeOutBack(dependencies.clamp(elapsed / 1.2, 0, 1));
            lt.x = dependencies.lerp(engine.LETTER_START.x, engine.LETTER_REST.x, k);
            lt.y = dependencies.lerp(engine.LETTER_START.y, engine.LETTER_REST.y, k);
            lt.rot = dependencies.lerp(-0.14, 0, k);
            if (elapsed >= 1.2) {
                lt.phase = "idle";
                lt.x = engine.LETTER_REST.x;
                lt.y = engine.LETTER_REST.y;
                lt.rot = 0;
                lt.t0 = engine.st.t;
            }
        }
        else if (lt.phase === "lift") {
            if (engine.st.t - lt.t0 > 1.05) {
                lt.phase = "open";
                lt.t0 = engine.st.t;
                engine.sfx.open();
            }
        }
        else if (lt.phase === "open") {
            const openElapsed = engine.st.t - lt.t0;
            if (openElapsed > 0.22 && !lt.sealSfx) {
                lt.sealSfx = true;
                engine.st.shake = 8;
            }
            if (openElapsed > 1.35 && !lt.flapBurst)
                engine.advanceLetterToReveal();
        }
        else if (lt.phase === "reveal") {
            const elapsed = engine.st.t - lt.t0;
            const revealK = dependencies.clamp(elapsed / 1.35, 0, 1);
            const shown = dependencies.slotCreditValue(lt.creditsBefore, lt.creditsAfter, revealK);
            if (shown !== lt.lastCreditTick && revealK > 0.12 && revealK < 0.93) {
                lt.lastCreditTick = shown;
                if (Math.random() < 0.35)
                    engine.sfx.click();
            }
            if (elapsed > 1.35) {
                lt.phase = "done";
                lt.t0 = engine.st.t;
                lt.lastCreditTick = lt.creditsAfter;
                engine.sfx.ding();
                engine.sfx.success();
            }
        }
    }
}
