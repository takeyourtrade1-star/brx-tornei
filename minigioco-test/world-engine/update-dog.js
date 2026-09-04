// Motore Asso World: update dog.
import * as dependencies from "./dependencies";

export function updateDog(engine, frame) {
    if (frame.dog.to) {
        frame.dog.t += frame.dt * 2.2;
        if (frame.dog.t >= 1) {
            frame.dog.from = frame.dog.to;
            frame.dog.to = null;
            frame.dog.t = 0;
            if (engine.onRug(frame.dog.from.cx, frame.dog.from.cy) && engine.fx.prints) {
                const fp = dependencies.tileTop(frame.dog.from.cx, frame.dog.from.cy);
                engine.st.prints.push({ x: fp.x + (Math.random() < 0.5 ? 2 : -2), y: fp.y + dependencies.HTH, t0: engine.st.t, s: 0.6 });
                if (engine.st.prints.length > 40)
                    engine.st.prints.shift();
            }
            if (frame.dog.queue.length) {
                frame.dog.to = frame.dog.queue.shift();
                const dx = frame.dog.to.cx - frame.dog.from.cx, dy = frame.dog.to.cy - frame.dog.from.cy;
                frame.dog.dir = dx === 1 ? "se" : dx === -1 ? "nw" : dy === 1 ? "sw" : "ne";
            }
            else {
                frame.dog.state = frame.dog.goal || "sit";
                frame.dog.goal = null;
                frame.dog.until = engine.st.t + (frame.dog.state === "sleep" ? 15 + Math.random() * 20 : 4 + Math.random() * 6);
                if (frame.dog.state === "sit" && Math.random() < 0.3) {
                    engine.sfx.pant();
                }
            }
        }
    }
    else if (engine.st.t > frame.dog.until) {
        const dogGo = (goal, target) => {
            const path = dependencies.findPath(frame.dog.from, target, engine.blocked);
            if (path && path.length) {
                frame.dog.queue = path;
                frame.dog.to = frame.dog.queue.shift();
                const dx = frame.dog.to.cx - frame.dog.from.cx, dy = frame.dog.to.cy - frame.dog.from.cy;
                frame.dog.dir = dx === 1 ? "se" : dx === -1 ? "nw" : dy === 1 ? "sw" : "ne";
                frame.dog.goal = goal;
            }
            else {
                frame.dog.state = "sit";
                frame.dog.until = engine.st.t + 3;
            }
        };
        const avT = engine.st.av.to || engine.st.av.from;
        const dDog = Math.abs(avT.cx - frame.dog.from.cx) + Math.abs(avT.cy - frame.dog.from.cy);
        if ((frame.dog.follow > 0 || engine.st.afk) && dDog > 1) {
            let best = null;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nx = avT.cx + dx, ny = avT.cy + dy;
                if (dependencies.inGrid(nx, ny) && !engine.blocked.has(dependencies.tkey(nx, ny))) {
                    best = { cx: nx, cy: ny };
                    break;
                }
            }
            if (best) {
                dogGo("sit", best);
                frame.dog.follow = Math.max(0, frame.dog.follow - 1);
            }
            else
                frame.dog.until = engine.st.t + 3;
        }
        else {
            const r = Math.random();
            const atHome = frame.dog.from.cx === 5 && frame.dog.from.cy === 7;
            if (r < 0.45) {
                if (atHome) {
                    frame.dog.state = "sleep";
                    frame.dog.until = engine.st.t + 15 + Math.random() * 20;
                }
                else
                    dogGo("sleep", { cx: 5, cy: 7 });
            }
            else if (r < 0.8) {
                let tgt = null;
                for (let tries = 0; tries < 8 && !tgt; tries++) {
                    const nx = Math.floor(Math.random() * dependencies.COLS), ny = Math.floor(Math.random() * dependencies.ROWS);
                    if (!engine.blocked.has(dependencies.tkey(nx, ny)))
                        tgt = { cx: nx, cy: ny };
                }
                if (tgt)
                    dogGo("sit", tgt);
                else
                    frame.dog.until = engine.st.t + 4;
            }
            else {
                frame.dog.state = "sit";
                frame.dog.until = engine.st.t + 3 + Math.random() * 5;
            }
        }
    }
    frame.dog.fx = frame.dog.to ? dependencies.lerp(frame.dog.from.cx, frame.dog.to.cx, frame.dog.t) : frame.dog.from.cx;
    frame.dog.fy = frame.dog.to ? dependencies.lerp(frame.dog.from.cy, frame.dog.to.cy, frame.dog.t) : frame.dog.from.cy;
    if (frame.dog.state === "sleep" && !frame.dog.to && engine.st.t > frame.dog.nextZ && engine.fx.petParticles) {
        frame.dog.nextZ = engine.st.t + 2.0;
        const cp = dependencies.tileTop(frame.dog.fx, frame.dog.fy);
        engine.spawnFx("zzz", cp.x + 6, cp.y - 6);
    }
}
