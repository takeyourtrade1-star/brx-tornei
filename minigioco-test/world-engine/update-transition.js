// Motore Asso World: update transition.
import * as dependencies from "./dependencies";

export function updateTransition(engine, frame) {
    if (engine.st.shake > 0) {
        engine.st.shake = Math.max(0, engine.st.shake - frame.dt * 26);
    }
    /* — transizione cambio stanza (fade 0.8s, swap al midpoint) — */
    if (engine.st.transition) {
        engine.st.transition.t += frame.dt;
        if (!engine.st.transition.swapped && engine.st.transition.t >= 0.4) {
            engine.st.transition.swapped = true;
            if (engine.st.transition.target === "arcade") {
                if (engine.st.room === "tournament")
                    engine.tourData = { bg: engine.bg, blocked: engine.blocked, sprMap: engine.sprMap, entities: engine.entities, inter: engine.inter, sils: engine.sils, boardSp: engine.boardSp };
                engine.bg = engine.arcadeBg;
                engine.blocked = engine.arcadeBlocked;
                engine.sprMap = engine.arcadeSprMap;
                engine.entities = engine.arcadeEntities;
                engine.inter = engine.arcadeInter;
                engine.sils = engine.arcadeSils;
                engine.boardSp = engine.arcadeBoardSp;
                engine.st.room = "arcade";
                engine.st.av.from = { cx: dependencies.ARC_ENTRY_TILE.cx, cy: dependencies.ARC_ENTRY_TILE.cy };
                engine.st.av.fx = dependencies.ARC_ENTRY_TILE.cx;
                engine.st.av.fy = dependencies.ARC_ENTRY_TILE.cy;
            }
            else if (engine.st.transition.target === "piazza") {
                if (engine.st.room === "tournament")
                    engine.tourData = { bg: engine.bg, blocked: engine.blocked, sprMap: engine.sprMap, entities: engine.entities, inter: engine.inter, sils: engine.sils, boardSp: engine.boardSp };
                engine.bg = engine.piazzaBg;
                engine.blocked = engine.piazzaBlocked;
                engine.sprMap = engine.piazzaSprMap;
                engine.entities = engine.piazzaEntities;
                engine.inter = engine.piazzaInter;
                engine.sils = engine.piazzaSils;
                engine.boardSp = engine.piazzaBoardSp;
                engine.st.room = "piazza";
                engine.st.av.from = { cx: dependencies.PIAZZA_ENTRY_TILE.cx, cy: dependencies.PIAZZA_ENTRY_TILE.cy };
                engine.st.av.fx = dependencies.PIAZZA_ENTRY_TILE.cx;
                engine.st.av.fy = dependencies.PIAZZA_ENTRY_TILE.cy;
            }
            else {
                engine.bg = dependencies.buildBackground(engine.phase, engine.stats, engine.posters);
                engine.blocked = engine.tourData.blocked;
                engine.sprMap = engine.tourData.sprMap;
                engine.entities = engine.tourData.entities;
                engine.inter = engine.tourData.inter;
                engine.sils = engine.tourData.sils;
                engine.boardSp = engine.tourData.boardSp;
                engine.st.room = "tournament";
                engine.st.av.from = { cx: dependencies.TOUR_ENTRY_TILE.cx, cy: dependencies.TOUR_ENTRY_TILE.cy };
                engine.st.av.fx = dependencies.TOUR_ENTRY_TILE.cx;
                engine.st.av.fy = dependencies.TOUR_ENTRY_TILE.cy;
            }
            engine.st.av.to = null;
            engine.st.av.queue = [];
            engine.st.av.t = 0;
            engine.st.av.seated = false;
            engine.st.av.dir = "se";
            engine.st.av.wt = 0;
            engine.st.av.stepN = 0;
            engine.st.av.nextBlink = 2.6;
            engine.st.av.blinkUntil = 0;
            const cam = engine.st.room === "arcade" ? dependencies.ARC_DEFAULT_CAM : engine.st.room === "piazza" ? dependencies.PIAZZA_DEFAULT_CAM : dependencies.DEFAULT_CAM;
            engine.st.cam.x = cam.x;
            engine.st.cam.y = cam.y;
            engine.st.cam.z = cam.z;
            engine.st.cam.tween = null;
            engine.st.nearObj = null;
            engine.st.pending = null;
            engine.st.sitTarget = false;
            engine.st.standBack = null;
            engine.sfx.open();
            if (engine.apiRef.current.setRoom)
                engine.apiRef.current.setRoom(engine.st.room);
        }
        if (engine.st.transition.t >= 0.8) {
            engine.st.transition = null;
            engine.st.lock = false;
            if (engine.st.navigationTarget === engine.st.room) {
                engine.st.navigationTarget = null;
            }
            else if (engine.st.navigationTarget) {
                const nextPlan = engine.worldNavigation.navigateTo(engine.st.navigationTarget);
                if (!nextPlan)
                    engine.st.navigationTarget = null;
            }
        }
        return true;
    }
    frame.isTour = engine.st.room === "tournament";
    if (engine.st.room === "piazza")
        dependencies.tickRemotePlayers(engine.remotePlayers, frame.dt, engine.remoteRenderOptions);
    frame.av = engine.st.av;
    frame.tw = engine.st.cam.tween;
    if (frame.tw) {
        frame.tw.t += frame.dt;
        const k = dependencies.easeInOutCubic(dependencies.clamp(frame.tw.t / frame.tw.dur, 0, 1));
        engine.st.cam.x = dependencies.lerp(frame.tw.fx, frame.tw.tx, k);
        engine.st.cam.y = dependencies.lerp(frame.tw.fy, frame.tw.ty, k);
        engine.st.cam.z = dependencies.lerp(frame.tw.fz, frame.tw.tz, k);
        if (frame.tw.t >= frame.tw.dur) {
            engine.st.cam.tween = null;
            engine.st.cam.x = frame.tw.tx;
            engine.st.cam.y = frame.tw.ty;
            engine.st.cam.z = frame.tw.tz;
            frame.tw.cb && frame.tw.cb();
        }
    }
    // tutorial guidato (pilota cammino/modali, blocca input via st.cinematic)
    if (frame.isTour && engine.st.tut.active)
        engine.tutTick(frame.dt);
    // tastiera
    if (!frame.av.to && !frame.av.queue.length && !engine.st.lock && !engine.st.modal && !engine.st.cinematic && engine.st.keys.size) {
        const KMAP = {
            KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1],
            KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0],
        };
        const code = engine.st.keys.has(engine.st.lastKey) ? engine.st.lastKey : engine.st.keys.values().next().value;
        const d = KMAP[code];
        if (d) {
            const nx = frame.av.from.cx + d[0], ny = frame.av.from.cy + d[1];
            if (dependencies.inGrid(nx, ny) && !engine.blocked.has(dependencies.tkey(nx, ny))) {
                frame.av.queue = [{ cx: nx, cy: ny }];
                engine.st.pending = null;
                engine.st.sitTarget = false;
                engine.hideHintOnce();
            }
        }
    }
    // movimento
    if (!frame.av.to && frame.av.queue.length && !engine.st.lock)
        engine.shiftStep();
}
