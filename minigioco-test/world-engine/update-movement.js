// Motore Asso World: update movement.
import * as dependencies from "./dependencies";

export function updateMovement(engine, frame) {
    if (frame.av.to) {
        frame.av.t += frame.dt * dependencies.SPEED;
        frame.av.wt += frame.dt * 8.5;
        if (engine.st.shadow && engine.fx.shadowEffects) {
            if (Math.random() < frame.dt * 16) {
                const ap = dependencies.tileTop(frame.av.fx, frame.av.fy);
                const shadowLift = Math.sin(engine.st.t * 3.5) * 4 - 5;
                engine.st.fx.push({
                    ch: Math.random() < 0.35 ? "✦" : (Math.random() < 0.6 ? "✧" : "•"),
                    col: Math.random() < 0.5 ? "#c084fc" : "#818cf8",
                    size: 5 + Math.random() * 4,
                    rise: 4 + Math.random() * 6,
                    dur: 0.6 + Math.random() * 0.4,
                    x: ap.x + (Math.random() - 0.5) * 8,
                    y: ap.y + dependencies.HTH + shadowLift + (Math.random() - 0.5) * 6,
                    t0: engine.st.t,
                    ph: Math.random() * 6.28
                });
            }
        }
        if (frame.av.t >= 1) {
            const carry = frame.av.t - 1;
            frame.av.from = frame.av.to;
            frame.av.to = null;
            frame.av.t = 0;
            frame.av.stepN++;
            engine.sfx.step(frame.av.stepN);
            if (engine.st.room === "piazza" && engine.apiRef.current.sendMove) {
                frame.av.localEchoes.push({ ...frame.av.from });
                if (frame.av.localEchoes.length > 8)
                    frame.av.localEchoes.shift();
                engine.apiRef.current.sendMove({ x: frame.av.from.cx, y: frame.av.from.cy });
            }
            if (engine.onRug(frame.av.from.cx, frame.av.from.cy) && engine.fx.prints) {
                const fp = dependencies.tileTop(frame.av.from.cx, frame.av.from.cy);
                engine.st.prints.push({ x: fp.x + (frame.av.stepN % 2 ? 5 : -5), y: fp.y + dependencies.HTH, t0: engine.st.t, s: 1 });
                if (engine.st.prints.length > 40)
                    engine.st.prints.shift();
            }
            if (frame.av.queue.length && !engine.st.lock) {
                engine.shiftStep();
                frame.av.t = carry;
            }
            else {
                // arrivo
                if (!engine.st.introDone && !engine.st.tut.active) {
                    engine.st.introDone = true;
                    engine.showBubble("Benvenuto! Prova i tasti: 1 PC · 2 Tavolo · 3 Bacheca 👀", 5);
                }
                if (engine.st.pending) {
                    const p = engine.st.pending;
                    engine.st.pending = null;
                    if (p.approach.some(([x, y]) => x === frame.av.from.cx && y === frame.av.from.cy)) {
                        if (p.id === "pc") {
                            // prima di aprire il PC ci si siede sulla sedia
                            engine.st.standBack = { cx: frame.av.from.cx, cy: frame.av.from.cy };
                            engine.st.sitTarget = true;
                            frame.av.queue = [{ cx: engine.CHAIR[0], cy: engine.CHAIR[1] }];
                        }
                        else if (p.id === "music")
                            engine.doMusicToggle();
                        else
                            engine.startInteract(p);
                    }
                }
                else if (engine.st.afkGoing) {
                    // arrivato sul tappeto: inizia la meditazione
                    engine.st.afkGoing = false;
                    engine.st.afk = true;
                    frame.av.dir = "nw";
                }
                else if (engine.st.afkShuffleGoing) {
                    // arrivato al tavolo: inizia lo smazzamento carte AFK
                    engine.st.afkShuffleGoing = false;
                    engine.st.afkShuffle = { t0: engine.st.t, lastShuffle: 0 };
                    frame.av.dir = "ne";
                }
                else if (engine.st.sitTarget) {
                    engine.st.sitTarget = false;
                    frame.av.seated = true;
                    frame.av.dir = "nw";
                    engine.sfx.pin();
                    engine.startInteract(engine.inter.pc);
                }
            }
        }
    }
    else if (!engine.st.introDone && !engine.st.tut.active && engine.st.t > 3) {
        engine.st.introDone = true;
        engine.showBubble("Benvenuto! Prova i tasti: 1 PC · 2 Tavolo · 3 Bacheca 👀", 5);
    }
    frame.k = frame.av.to && !frame.av.queue.length ? dependencies.easeOutQuad(frame.av.t) : frame.av.t;
    frame.av.fx = frame.av.to ? dependencies.lerp(frame.av.from.cx, frame.av.to.cx, frame.k) : frame.av.from.cx;
    frame.av.fy = frame.av.to ? dependencies.lerp(frame.av.from.cy, frame.av.to.cy, frame.k) : frame.av.from.cy;
    // blinking
    if (engine.st.t > frame.av.nextBlink) {
        frame.av.blinkUntil = engine.st.t + 0.13;
        frame.av.nextBlink = engine.st.t + 2.2 + Math.random() * 3;
    }
    frame.t0 = frame.av.to || frame.av.from;
    frame.near = null;
    for (const o of Object.values(engine.inter)) {
        const onAp = o.approach.some(([x, y]) => x === frame.t0.cx && y === frame.t0.cy);
        const nearFoot = o.footTiles.some(([x, y]) => Math.abs(x - frame.t0.cx) <= 1 && Math.abs(y - frame.t0.cy) <= 1);
        if (onAp || nearFoot) {
            frame.near = o;
            break;
        }
    }
    if ((frame.near && frame.near.id) !== (engine.st.nearObj && engine.st.nearObj.id))
        engine.st.nearSince = engine.st.t;
    engine.st.nearObj = frame.near;
    // flicker monitor
    if (engine.st.t > engine.st.flicker.next) {
        engine.st.flicker.until = engine.st.t + 0.12;
        engine.st.flicker.next = engine.st.t + 1.2 + Math.random() * 2.8;
    }
    // flicker lampada (raro e breve)
    if (engine.st.t > engine.st.lampF.next) {
        engine.st.lampF.until = engine.st.t + 0.05 + Math.random() * 0.12;
        engine.st.lampF.next = engine.st.t + 2.4 + Math.random() * 4.5;
    }
    // pulviscolo
    if (engine.fx.motes)
        for (const m of engine.st.motes) {
            m.v += m.sp * frame.dt * 4;
            if (m.v > 1) {
                m.v -= 1;
                m.u = Math.random();
            }
        }
    // ripples
    engine.st.ripples = engine.st.ripples.filter((r) => engine.st.t - r.t0 < 0.45);
    // bolla (le battute "sticky" del tutorial non svaniscono da sole)
    if (engine.st.bubble && !engine.st.bubble.sticky && engine.st.t - engine.st.bubble.t0 > engine.st.bubble.dur)
        engine.st.bubble = null;
    /* — idle/AFK: dopo 45s di inattività si va a meditare sul tappeto o a smazzare carte al tavolo — */
    if (frame.isTour && !engine.st.afk && !engine.st.afkGoing && !engine.st.afkShuffle && !engine.st.afkShuffleGoing && !engine.st.modal && !engine.st.lock && !frame.av.seated &&
        !frame.av.to && !frame.av.queue.length && engine.st.t - engine.st.lastAct > 45 && engine.st.introDone && !engine.st.tut.active && !engine.st.cinematic && !engine.st.hype && !engine.letterOverlayActive()) {
        engine.st.pending = null;
        engine.st.sitTarget = false;
        if (Math.random() < 0.5) {
            if (engine.walkToTile({ cx: 5, cy: 6 }))
                engine.st.afkGoing = true;
            else
                engine.st.afk = true; // già lì (o tile occupato): medita sul posto
        }
        else {
            const t00 = frame.av.to || frame.av.from;
            let best = null;
            for (const [x, y] of engine.inter.decks.approach) {
                const p = dependencies.findPath(t00, { cx: x, cy: y }, engine.blocked);
                if (p && (!best || p.length < best.length))
                    best = p;
            }
            if (best && best.length) {
                frame.av.queue = best;
                engine.st.afkShuffleGoing = true;
                engine.shiftStep();
            }
            else {
                if (engine.walkToTile({ cx: 5, cy: 6 }))
                    engine.st.afkGoing = true;
                else
                    engine.st.afk = true;
            }
        }
    }
    if (engine.st.afk && engine.fx.particles && Math.random() < frame.dt * 0.8) {
        const ap = dependencies.tileTop(frame.av.fx, frame.av.fy);
        engine.spawnFx(Math.random() < 0.5 ? "spark" : "zzz", ap.x, ap.y - 30);
    }
    if (engine.st.afkShuffle) {
        if (engine.st.t - engine.st.afkShuffle.lastShuffle > 6.0) {
            engine.st.afkShuffle.lastShuffle = engine.st.t;
            engine.sfx.shuffle();
        }
        if (engine.fx.particles && Math.random() < frame.dt * 0.8) {
            const ap = dependencies.tileTop(frame.av.fx, frame.av.fy);
            engine.spawnFx("spark", ap.x, ap.y - 30);
        }
    }
    /* — test citofono programmato: parte la Sequenza di Hype (mock) — */
    if (engine.integrationMode !== "site" && engine.st.ringTest && engine.st.t > engine.st.ringTest) {
        engine.st.ringTest = null;
        engine.startHype("Drakmor92");
    }
}
