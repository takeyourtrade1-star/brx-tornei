// Motore Asso World: update pet idle.
import * as dependencies from "./dependencies";

export function updatePetIdle(engine, frame) {
    frame.cat = engine.st.cat;
    if (frame.cat.pendingChairAt && engine.st.t > frame.cat.pendingChairAt) {
        frame.cat.pendingChairAt = null;
        if (!frame.cat.perch && !frame.cat.to) {
            frame.cat.until = 0;
            frame.cat.forceChair = true;
        }
    }
    if (frame.cat.perch) {
        const pc = frame.cat.perch;
        if (pc.key === "table" && !pc.scattered && engine.st.t - pc.t0 > 0.6) {
            pc.scattered = true;
            engine.sfx.shuffle();
            const o = engine.tablePt(7.18, 3.46);
            for (let i = 0; i < 8; i++) {
                const a = -0.45 + Math.random() * 3.7;
                const speed = 34 + Math.random() * 82;
                engine.st.scatter.push({
                    x: o.x + (Math.random() - 0.5) * 16,
                    y: o.y + (Math.random() - 0.5) * 7,
                    vx: Math.cos(a) * speed,
                    vy: Math.sin(a) * speed * 0.42 - 10,
                    rot: Math.random() * 6.28,
                    vr: (Math.random() - 0.5) * 10,
                    col: [dependencies.P.red, "#4a7fd6", "#9a6ad6", dependencies.P.gold][i % 4], t0: engine.st.t, snapped: false,
                });
            }
            engine.showBubble("Missy! Le mie carte! 🙀", 2.6);
        }
        if (pc.key === "desk" && frame.cat.state === "sleep" && engine.st.t > frame.cat.nextZ && engine.fx.petParticles) {
            frame.cat.nextZ = engine.st.t + 1.8;
            const cp2 = engine.petFootPoint(frame.cat);
            engine.spawnFx("zzz", cp2.x + 6, cp2.y - 6);
        }
        if (engine.st.t > pc.until) {
            const spot = engine.CAT_PERCH_SPOTS[pc.key] || engine.CAT_PERCH_SPOTS.chair;
            const land = spot.land;
            frame.cat.perch = null;
            frame.cat.from = land;
            frame.cat.to = null;
            frame.cat.t = 0;
            frame.cat.queue = [];
            frame.cat.state = "sit";
            frame.cat.until = engine.st.t + 2 + Math.random() * 3;
            engine.sfx.step(1);
        }
    }
    else if (frame.cat.to) {
        frame.cat.t += frame.dt * 2.4;
        if (frame.cat.t >= 1) {
            frame.cat.from = frame.cat.to;
            frame.cat.to = null;
            frame.cat.t = 0;
            if (engine.onRug(frame.cat.from.cx, frame.cat.from.cy) && engine.fx.prints) {
                const fp = dependencies.tileTop(frame.cat.from.cx, frame.cat.from.cy);
                engine.st.prints.push({ x: fp.x + (Math.random() < 0.5 ? 3 : -3), y: fp.y + dependencies.HTH, t0: engine.st.t, s: 0.55 });
                if (engine.st.prints.length > 40)
                    engine.st.prints.shift();
            }
            if (frame.cat.queue.length) {
                frame.cat.to = frame.cat.queue.shift();
                const dx = frame.cat.to.cx - frame.cat.from.cx, dy = frame.cat.to.cy - frame.cat.from.cy;
                frame.cat.dir = dx === 1 ? "se" : dx === -1 ? "nw" : dy === 1 ? "sw" : "ne";
            }
            else {
                if (frame.cat.goal && frame.cat.goal.startsWith("perch_")) {
                    const key = frame.cat.goal.split("_")[1];
                    const spot = engine.CAT_PERCH_SPOTS[key] || engine.CAT_PERCH_SPOTS.table;
                    frame.cat.perch = { key, tx: spot.tx, ty: spot.ty, lift: spot.lift, t0: engine.st.t, until: engine.st.t + 15 + Math.random() * 20, scattered: false };
                    frame.cat.from = { cx: spot.tx, cy: spot.ty };
                    frame.cat.fx = spot.tx;
                    frame.cat.fy = spot.ty;
                    frame.cat.dir = spot.dir;
                    frame.cat.state = spot.state;
                    frame.cat.goal = null;
                    if (key === "chair") {
                        engine.st.chairSpin = engine.st.t;
                        engine.sfx.click();
                        const card = dependencies.MTG_CARDS[Math.floor(Math.random() * dependencies.MTG_CARDS.length)];
                        const template = dependencies.MTG_TEMPLATES[Math.floor(Math.random() * dependencies.MTG_TEMPLATES.length)];
                        engine.showBubble(template(card), 3.5, "cat");
                    }
                }
                else {
                    frame.cat.state = frame.cat.goal || "sit";
                    frame.cat.goal = null;
                    frame.cat.until = engine.st.t + (frame.cat.state === "sleep" ? 18 + Math.random() * 22 : 3 + Math.random() * 5);
                }
            }
        }
    }
    else if (engine.st.t > frame.cat.until) {
        const catGo = (goal, target) => {
            const path = dependencies.findPath(frame.cat.from, target, engine.blocked);
            if (path && path.length) {
                frame.cat.queue = path;
                frame.cat.to = frame.cat.queue.shift();
                const dx = frame.cat.to.cx - frame.cat.from.cx, dy = frame.cat.to.cy - frame.cat.from.cy;
                frame.cat.dir = dx === 1 ? "se" : dx === -1 ? "nw" : dy === 1 ? "sw" : "ne";
                frame.cat.goal = goal;
            }
            else {
                frame.cat.state = "sit";
                frame.cat.until = engine.st.t + 4;
            }
        };
        const avT = engine.st.av.to || engine.st.av.from;
        const dCat = Math.abs(avT.cx - frame.cat.from.cx) + Math.abs(avT.cy - frame.cat.from.cy);
        if ((frame.cat.follow > 0 || engine.st.afk) && dCat > 1) {
            let best = null;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nx = avT.cx + dx, ny = avT.cy + dy;
                if (dependencies.inGrid(nx, ny) && !engine.blocked.has(dependencies.tkey(nx, ny))) {
                    best = { cx: nx, cy: ny };
                    break;
                }
            }
            if (best) {
                catGo("sit", best);
                frame.cat.follow = Math.max(0, frame.cat.follow - 1);
            }
            else
                frame.cat.until = engine.st.t + 3;
        }
        else {
            const r = Math.random();
            const atHome = frame.cat.from.cx === 4 && frame.cat.from.cy === 6;
            const force = frame.cat.forceChair;
            frame.cat.forceChair = false;
            if (force && !engine.st.av.seated && !engine.st.sitTarget) {
                catGo("perch_chair", engine.CAT_PERCH_SPOTS.chair.approach);
            }
            else if (r < 0.25) {
                const perches = ["chair", "table", "desk"];
                const choice = perches[Math.floor(Math.random() * perches.length)];
                if (choice === "chair" && !engine.st.av.seated && !engine.st.sitTarget) {
                    catGo("perch_chair", engine.CAT_PERCH_SPOTS.chair.approach);
                }
                else if (choice === "table") {
                    catGo("perch_table", engine.CAT_PERCH_SPOTS.table.approach);
                }
                else if (choice === "desk") {
                    catGo("perch_desk", engine.CAT_PERCH_SPOTS.desk.approach);
                }
                else {
                    frame.cat.state = "sit";
                    frame.cat.until = engine.st.t + 3;
                }
            }
            else if (r < 0.55) {
                if (atHome) {
                    frame.cat.state = "sleep";
                    frame.cat.until = engine.st.t + 18 + Math.random() * 22;
                }
                else
                    catGo("sleep", { cx: 4, cy: 6 });
            }
            else if (r < 0.85) {
                let tgt = null;
                for (let tries = 0; tries < 8 && !tgt; tries++) {
                    const nx = Math.floor(Math.random() * dependencies.COLS), ny = Math.floor(Math.random() * dependencies.ROWS);
                    if (!engine.blocked.has(dependencies.tkey(nx, ny)))
                        tgt = { cx: nx, cy: ny };
                }
                if (tgt)
                    catGo("sit", tgt);
                else
                    frame.cat.until = engine.st.t + 4;
            }
            else {
                frame.cat.state = "sit";
                frame.cat.until = engine.st.t + 3 + Math.random() * 5;
            }
        }
    }
    frame.cat.fx = frame.cat.to ? dependencies.lerp(frame.cat.from.cx, frame.cat.to.cx, frame.cat.t) : frame.cat.from.cx;
    frame.cat.fy = frame.cat.to ? dependencies.lerp(frame.cat.from.cy, frame.cat.to.cy, frame.cat.t) : frame.cat.from.cy;
    if (frame.cat.state === "sleep" && !frame.cat.to && engine.st.t > frame.cat.nextZ && engine.fx.petParticles) {
        frame.cat.nextZ = engine.st.t + 1.8;
        const cp = engine.petFootPoint(frame.cat);
        engine.spawnFx("zzz", cp.x + 6, cp.y - 6);
    }
    frame.dog = engine.st.dog;
}
