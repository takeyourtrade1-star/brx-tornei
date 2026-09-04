// Motore Asso World: update tournament alert.
import * as dependencies from "./dependencies";

export function updateTournamentAlert(engine, frame) {
    /* — gestione sequenza Hype (solo Sala Tornei) — */
    if (frame.isTour && engine.st.hype) {
        const hp = engine.st.hype;
        if (hp.phase === "alarm") {
            if (engine.st.t > hp.nextBeep) {
                hp.nextBeep = engine.st.t + 0.8;
                engine.sfx.alarm();
            }
            if (!hp.walking) {
                hp.walking = true;
                const t00 = frame.av.to || frame.av.from;
                let best = null;
                for (const [x, y] of engine.inter.decks.approach) {
                    const p = dependencies.findPath(t00, { cx: x, cy: y }, engine.blocked);
                    if (p && (!best || p.length < best.length))
                        best = p;
                }
                if (best && best.length) {
                    frame.av.queue = best;
                    engine.shiftStep();
                }
            }
            if (hp.walking && !frame.av.to && !frame.av.queue.length) {
                const elapsed = engine.st.t - hp.t0;
                if (elapsed > 2.0) {
                    frame.av.dir = "ne";
                    hp.phase = "nod";
                    hp.t0 = engine.st.t;
                }
            }
        }
        else if (hp.phase === "nod") {
            frame.av.dir = "sw";
            const elapsed = engine.st.t - hp.t0;
            if (elapsed > 0.4 && !hp.sparked) {
                hp.sparked = true;
                const ap = dependencies.tileTop(frame.av.fx, frame.av.fy);
                engine.spawnFx("spark", ap.x - 4, ap.y - 32, 3);
                engine.sfx.success();
                engine.showBubble("👍 Fatti sotto! Pronto al match!", 2.5);
            }
            if (elapsed > 1.8) {
                hp.phase = "split";
                hp.t0 = engine.st.t;
                engine.sfx.shuffle();
            }
        }
        else if (hp.phase === "split") {
            const elapsed = engine.st.t - hp.t0;
            if (elapsed > 1.0) {
                hp.phase = "deal";
                hp.t0 = engine.st.t;
                hp.deals = [];
                hp.nextDeal = 0;
            }
        }
        else if (hp.phase === "deal" && hp.deals) {
            const elapsed = engine.st.t - hp.t0;
            if (hp.deals.length < 4 && engine.st.t > hp.nextDeal) {
                hp.nextDeal = engine.st.t + 0.22;
                const angle = Math.random() * Math.PI * 2;
                const speed = 70 + Math.random() * 50;
                const tCenter = engine.tablePt(7.0, 3.0);
                hp.deals.push({
                    x: tCenter.x, y: tCenter.y,
                    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed * 0.6,
                    rot: 0, vr: (Math.random() - 0.5) * 12,
                    color: ["#d94f46", "#4a7fd6", "#9a6ad6", dependencies.P.gold][hp.deals.length]
                });
                engine.sfx.snap();
            }
            for (const card of hp.deals) {
                card.x += card.vx * frame.dt;
                card.y += card.vy * frame.dt;
                card.vx *= 0.90;
                card.vy *= 0.90;
                card.rot += card.vr * frame.dt;
                card.vr *= 0.90;
            }
            if (elapsed > 1.8) {
                hp.phase = "zoom";
                hp.t0 = engine.st.t;
                engine.sfx.whoosh();
            }
        }
        else if (hp.phase === "zoom") {
            const elapsed = engine.st.t - hp.t0;
            const k = dependencies.clamp(elapsed / 1.0, 0, 1);
            engine.st.cam.x = dependencies.lerp(dependencies.DEFAULT_CAM.x, engine.scrCenter.x, k);
            engine.st.cam.y = dependencies.lerp(dependencies.DEFAULT_CAM.y, engine.scrCenter.y, k);
            engine.st.cam.z = dependencies.lerp(1, 14, k * k);
            if (elapsed > 1.0) {
                engine.st.hype = null;
                engine.st.cinematic = false;
                engine.st.cam.x = dependencies.DEFAULT_CAM.x;
                engine.st.cam.y = dependencies.DEFAULT_CAM.y;
                engine.st.cam.z = 1;
                if (engine.apiRef.current.openModal)
                    engine.apiRef.current.openModal("pc");
            }
        }
    }
    /* — pulizia particelle e orme — */
    engine.st.fx = engine.st.fx.filter((p) => engine.st.t - p.t0 < p.dur);
    engine.st.prints = engine.st.prints.filter((p) => engine.st.t - p.t0 < 4);
}
