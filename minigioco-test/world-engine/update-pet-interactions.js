// Motore Asso World: update pet interactions.
import * as dependencies from "./dependencies";
import { updatePetIdle } from "./update-pet-idle";
import { updateDog } from "./update-dog";

export function updatePetInteractions(engine, frame) {
    if (frame.isTour && engine.st.petInteraction) {
        const pi = engine.st.petInteraction;
        if (pi.type === "chase") {
            if (pi.stage === 0) {
                if (engine.st.t > pi.t0 + 0.1) {
                    engine.sfx.bark();
                    engine.showBubble("Cookie: Bau! Ti prendo! 🐶", 2.2, "dog");
                    engine.sfx.meow();
                    engine.showBubble("Missy: Miao! 🙀", 2.2, "cat");
                    pi.stage = 1;
                    pi.t0 = engine.st.t + 1.2;
                }
            }
            else if (pi.stage === 1) {
                if (engine.st.t > pi.t0) {
                    // Missy decide dove scappare
                    let tgt = null;
                    for (let i = 0; i < 15 && !tgt; i++) {
                        const x = Math.floor(Math.random() * dependencies.COLS);
                        const y = Math.floor(Math.random() * dependencies.ROWS);
                        if (!engine.blocked.has(dependencies.tkey(x, y)) && (Math.abs(x - engine.st.dog.from.cx) + Math.abs(y - engine.st.dog.from.cy) > 1)) {
                            tgt = { cx: x, cy: y };
                        }
                    }
                    if (!tgt) {
                        for (let i = 0; i < 15 && !tgt; i++) {
                            const x = Math.floor(Math.random() * dependencies.COLS);
                            const y = Math.floor(Math.random() * dependencies.ROWS);
                            if (!engine.blocked.has(dependencies.tkey(x, y)))
                                tgt = { cx: x, cy: y };
                        }
                    }
                    if (tgt) {
                        const path = dependencies.findPath(engine.st.cat.from, tgt, engine.blocked);
                        if (path && path.length) {
                            engine.st.cat.queue = path;
                            engine.st.cat.to = engine.st.cat.queue.shift();
                            const dx = engine.st.cat.to.cx - engine.st.cat.from.cx, dy = engine.st.cat.to.cy - engine.st.cat.from.cy;
                            engine.st.cat.dir = dx === 1 ? "se" : dx === -1 ? "nw" : dy === 1 ? "sw" : "ne";
                            pi.runnerTarget = tgt;
                            pi.stage = 2;
                        }
                        else {
                            pi.type = "fight";
                            pi.stage = 0;
                            pi.t0 = engine.st.t;
                            pi.until = engine.st.t + 2.8;
                        }
                    }
                    else {
                        pi.type = "fight";
                        pi.stage = 0;
                        pi.t0 = engine.st.t;
                        pi.until = engine.st.t + 2.8;
                    }
                }
            }
            else if (pi.stage === 2) {
                if (!engine.st.cat.to) {
                    engine.showBubble("Scappa! 🐈", 1.5, "cat");
                    const path = dependencies.findPath(engine.st.dog.from, pi.runnerTarget, engine.blocked);
                    if (path && path.length) {
                        engine.st.dog.queue = path;
                        engine.st.dog.to = engine.st.dog.queue.shift();
                        const dx = engine.st.dog.to.cx - engine.st.dog.from.cx, dy = engine.st.dog.to.cy - engine.st.dog.from.cy;
                        engine.st.dog.dir = dx === 1 ? "se" : dx === -1 ? "nw" : dy === 1 ? "sw" : "ne";
                        pi.stage = 3;
                    }
                    else {
                        pi.type = "fight";
                        pi.stage = 0;
                        pi.t0 = engine.st.t;
                        pi.until = engine.st.t + 2.8;
                    }
                }
            }
            else if (pi.stage === 3) {
                if (!engine.st.dog.to) {
                    pi.type = "fight";
                    pi.stage = 0;
                    pi.t0 = engine.st.t;
                    pi.until = engine.st.t + 2.8;
                    engine.sfx.bark();
                    engine.sfx.meow();
                    engine.showBubble("Zuffa! 💥", 2.0, "cat");
                    engine.showBubble("Bau! 💨", 2.0, "dog");
                }
            }
        }
        else if (pi.type === "fight") {
            engine.st.cat.state = "sit";
            engine.st.dog.state = "sit";
            const dx = engine.st.dog.from.cx - engine.st.cat.from.cx;
            const dy = engine.st.dog.from.cy - engine.st.cat.from.cy;
            engine.st.cat.fx = engine.st.cat.from.cx + Math.sin(engine.st.t * 35) * 0.15;
            engine.st.cat.fy = engine.st.cat.from.cy + Math.cos(engine.st.t * 30) * 0.15;
            engine.st.dog.fx = engine.st.cat.from.cx + (dx * 0.5) + Math.sin(engine.st.t * 32 + 1.2) * 0.15;
            engine.st.dog.fy = engine.st.cat.from.cy + (dy * 0.5) + Math.cos(engine.st.t * 28 + 1.2) * 0.15;
            if (Math.random() < frame.dt * 6) {
                const cp = dependencies.tileTop(engine.st.cat.fx, engine.st.cat.fy);
                engine.spawnFx(Math.random() < 0.5 ? "clash" : "dust", cp.x, cp.y + dependencies.HTH);
            }
            if (Math.random() < frame.dt * 1.5) {
                if (Math.random() < 0.5)
                    engine.sfx.bark();
                else
                    engine.sfx.meow();
            }
            if (engine.st.t > pi.until) {
                engine.st.cat.from = { cx: engine.st.cat.from.cx, cy: engine.st.cat.from.cy };
                engine.st.cat.fx = engine.st.cat.from.cx;
                engine.st.cat.fy = engine.st.cat.from.cy;
                // Trova una cella adiacente libera per Cookie
                let dogTile = { cx: engine.st.cat.from.cx, cy: engine.st.cat.from.cy };
                for (const [adx, ady] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    const nx = engine.st.cat.from.cx + adx, ny = engine.st.cat.from.cy + ady;
                    if (dependencies.inGrid(nx, ny) && !engine.blocked.has(dependencies.tkey(nx, ny))) {
                        dogTile = { cx: nx, cy: ny };
                        break;
                    }
                }
                engine.st.dog.from = dogTile;
                engine.st.dog.fx = dogTile.cx;
                engine.st.dog.fy = dogTile.cy;
                engine.st.cat.state = "sit";
                engine.st.cat.until = engine.st.t + 4;
                engine.st.dog.state = "sit";
                engine.st.dog.until = engine.st.t + 4;
                engine.showBubble("Purr... 🐾", 2.2, "cat");
                engine.showBubble("Pant pant! 👅", 2.2, "dog");
                engine.sfx.pant();
                engine.st.petInteraction = null;
            }
        }
        if (engine.st.cat.to) {
            engine.st.cat.t += frame.dt * 3.5;
            if (engine.st.cat.t >= 1) {
                engine.st.cat.from = engine.st.cat.to;
                engine.st.cat.to = null;
                engine.st.cat.t = 0;
                if (engine.st.cat.queue.length) {
                    engine.st.cat.to = engine.st.cat.queue.shift();
                    const dx = engine.st.cat.to.cx - engine.st.cat.from.cx, dy = engine.st.cat.to.cy - engine.st.cat.from.cy;
                    engine.st.cat.dir = dx === 1 ? "se" : dx === -1 ? "nw" : dy === 1 ? "sw" : "ne";
                }
            }
            engine.st.cat.fx = engine.st.cat.to ? dependencies.lerp(engine.st.cat.from.cx, engine.st.cat.to.cx, engine.st.cat.t) : engine.st.cat.from.cx;
            engine.st.cat.fy = engine.st.cat.to ? dependencies.lerp(engine.st.cat.from.cy, engine.st.cat.to.cy, engine.st.cat.t) : engine.st.cat.from.cy;
        }
        if (engine.st.dog.to) {
            engine.st.dog.t += frame.dt * 3.5;
            if (engine.st.dog.t >= 1) {
                engine.st.dog.from = engine.st.dog.to;
                engine.st.dog.to = null;
                engine.st.dog.t = 0;
                if (engine.st.dog.queue.length) {
                    engine.st.dog.to = engine.st.dog.queue.shift();
                    const dx = engine.st.dog.to.cx - engine.st.dog.from.cx, dy = engine.st.dog.to.cy - engine.st.dog.from.cy;
                    engine.st.dog.dir = dx === 1 ? "se" : dx === -1 ? "nw" : dy === 1 ? "sw" : "ne";
                }
            }
            engine.st.dog.fx = engine.st.dog.to ? dependencies.lerp(engine.st.dog.from.cx, engine.st.dog.to.cx, engine.st.dog.t) : engine.st.dog.from.cx;
            engine.st.dog.fy = engine.st.dog.to ? dependencies.lerp(engine.st.dog.from.cy, engine.st.dog.to.cy, engine.st.dog.t) : engine.st.dog.from.cy;
        }
    }
    else if (frame.isTour) {
        if (updatePetIdle(engine, frame))
            return true;
        if (updateDog(engine, frame))
            return true;
    }
    /* — update carte sparpagliate — */
    for (const card of engine.st.scatter) {
        if (Math.abs(card.vx) > 0.1 || Math.abs(card.vy) > 0.1) {
            card.x += card.vx * frame.dt;
            card.y += card.vy * frame.dt;
            card.vx *= 0.90;
            card.vy *= 0.90;
            card.rot += card.vr * frame.dt;
            card.vr *= 0.90;
        }
        else if (!card.snapped) {
            card.snapped = true;
            engine.sfx.snap();
        }
    }
    engine.st.scatter = engine.st.scatter.filter((card) => engine.st.t - card.t0 < 12);
}
