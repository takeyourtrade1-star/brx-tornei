import { releaseDetailedScene } from "../high-detail/scene-cache";
import { disposeWorld } from "./dispose-world";
// Motore Asso World: initialize api.
import * as dependencies from "./dependencies";

export function initializeApi(engine) {
    engine.api = {
        sfx: engine.sfx,
        navigateTo: engine.navigateTo,
        interact: engine.interact,
        openWardrobe() {
            if (engine.st.destroyed || engine.st.paused || engine.st.modal || engine.st.cinematic || engine.st.lock)
                return;
            engine.st.keys.clear();
            engine.st.navigationTarget = null;
            engine.sfx.ensure();
            engine.openMirror();
        },
        setPaused(value) {
            if (engine.st.destroyed)
                return;
            engine.st.paused = Boolean(value);
            engine.st.keys.clear();
            engine.frameLimiter.pause(performance.now());
        },
        setStats(value) {
            if (engine.st.destroyed)
                return;
            const next = dependencies.normalizeStats(value, engine.integrationMode);
            if (next.giocati === engine.stats.giocati && next.vinti === engine.stats.vinti)
                return;
            Object.assign(engine.stats, next);
            engine.tourData.bg = dependencies.buildBackground(engine.phase, engine.stats, engine.posters);
            if (engine.st.room === "tournament")
                engine.bg = engine.tourData.bg;
        },
        setMuted: (v) => engine.sfx.setMuted(v),
        setQuality(q) {
            if (engine.st.destroyed)
                return;
            engine.fx = dependencies.getFxFlags(q);
            if (!engine.fx.highDetail) releaseDetailedScene(engine);
            engine.remoteRenderOptions.reducedMotion = engine.fx.reducedMotion;
            engine.frameLimiter.setTargetFps(engine.fx.targetFps);
            engine.resize();
        },
        /* eventi diegetici dall'esterno (cambi nei tornei, sfide, ecc.) */
        notify() { if (!engine.st.destroyed) {
            engine.st.alert = engine.st.t + 6;
            engine.sfx.success();
        } },
        ring(msg) { if (!engine.st.destroyed)
            engine.doRing(msg || "C'è qualcuno al citofono!"); },
        setCountdown(epochMs) { engine.st.countdown = epochMs || null; engine.st.cdRang = false; },
        setGhost(name) { engine.st.ghost = name || null; },
        setBracket(on) {
            if (engine.st.destroyed || engine.st.room !== "tournament")
                return;
            if (engine.bracketOn === on)
                return;
            engine.bracketOn = on;
            engine.boardSp = dependencies.buildBoard(on);
            engine.tourData.boardSp = engine.boardSp;
            engine.inter.board.hitRect = { x: engine.boardSp.wx, y: engine.boardSp.wy, w: engine.boardSp.cv.width, h: engine.boardSp.cv.height * 0.64 };
            engine.sils.board = dependencies.makeSil({ cv: engine.boardSp.cv });
        },
        takePhoto: engine.takePhoto,
        skipTutorial() { if (!engine.st.destroyed)
            engine.endTutorial(); },
        restartTutorial() { if (!engine.st.destroyed)
            engine.tutRestart(); },
        /* — specchio: applica il look scelto ricostruendo gli sprite dell'avatar — */
        setLook(look) {
            if (engine.st.destroyed || !look)
                return;
            engine.currentLook = { ...engine.currentLook, ...look };
            engine.avatar = dependencies.buildAvatar(engine.currentLook);
        },
        getLook() { return { ...engine.currentLook }; },
        /* anteprima statica (vista frontale) su un canvas fornito dalla modale */
        drawLookPreview(canvasEl, look) {
            if (engine.st.destroyed || !canvasEl)
                return;
            try {
                const av = dependencies.buildAvatar({ ...engine.currentLook, ...(look || {}) });
                const sp = av.se.idle[0];
                const cx = canvasEl.getContext("2d");
                cx.imageSmoothingEnabled = false;
                cx.clearRect(0, 0, canvasEl.width, canvasEl.height);
                const s = Math.max(1, Math.floor(Math.min(canvasEl.width / sp.cv.width, canvasEl.height / sp.cv.height)));
                const dw = sp.cv.width * s, dh = sp.cv.height * s;
                cx.drawImage(sp.cv, Math.round((canvasEl.width - dw) / 2), Math.round((canvasEl.height - dh) / 2), dw, dh);
            }
            catch (e) { /* canvas non pronto */ }
        },
        setRemotePlayers(list) {
            if (engine.st.destroyed)
                return;
            dependencies.syncRemotePlayers(engine.remotePlayers, list, dependencies.buildAvatar, engine.remoteRenderOptions);
        },
        setLocalPosition(value) {
            if (engine.st.destroyed || engine.st.room !== "piazza")
                return;
            const cx = Number(value && value.x), cy = Number(value && value.y);
            if (!Number.isSafeInteger(cx) || !Number.isSafeInteger(cy))
                return;
            if (!dependencies.inGrid(cx, cy) || engine.blocked.has(dependencies.tkey(cx, cy)))
                return;
            if (!dependencies.shouldApplyLocalPosition(engine.st.av, value))
                return;
            engine.st.av.from = { cx, cy };
            engine.st.av.to = null;
            engine.st.av.queue = [];
            engine.st.av.fx = cx;
            engine.st.av.fy = cy;
            engine.st.pending = null;
            engine.st.sitTarget = false;
        },
        showBubble(text, dur) {
            if (engine.st.destroyed)
                return;
            engine.showBubble(text, dur || 4.5);
        },
        /* stessa azione dei tasti 1/2/3/4/P, ma cliccando i badge a schermo */
        hotkey(which) {
            if (engine.st.destroyed || engine.st.paused || engine.st.modal || engine.st.cinematic || engine.st.lock)
                return;
            engine.sfx.ensure();
            engine.st.lastAct = engine.st.t;
            engine.wakeAfk();
            if (which === "P") {
                engine.takePhoto();
                return;
            }
            const target = engine.st.room === "arcade"
                ? (which === 1 ? engine.inter.arcade1 : which === 2 ? engine.inter.arcade2 : which === 3 ? engine.inter.arcade3 : which === 4 ? engine.inter.kakegurui : null)
                : engine.st.room === "piazza"
                    ? (which === 1 ? engine.inter.piazzaCab1 : which === 2 ? engine.inter.piazzaCab2 : which === 3 ? engine.inter.piazzaCab3 : which === 4 ? engine.inter.piazzaTable1 : null)
                    : (which === 1 ? engine.inter.pc : which === 2 ? engine.inter.decks : which === 3 ? engine.inter.board : null);
            if (!target)
                return;
            engine.teleportInteract(target);
            engine.hideHintOnce();
        },
        powerOff() { if (!engine.st.destroyed)
            engine.sfx.close(); },
        zoomOut() {
            if (engine.st.destroyed)
                return;
            engine.sfx.close();
            engine.st.modal = null;
            engine.st.lastAct = engine.st.t;
            engine.st.lock = true;
            const cam = engine.st.room === "arcade" ? dependencies.ARC_DEFAULT_CAM : engine.st.room === "piazza" ? dependencies.PIAZZA_DEFAULT_CAM : dependencies.DEFAULT_CAM;
            engine.camTo(cam, 0.55, () => {
                engine.st.lock = false;
                if (engine.st.av.seated) {
                    const back = engine.st.standBack || { cx: engine.CHAIR[0], cy: engine.CHAIR[1] + 1 };
                    engine.st.standBack = null;
                    engine.st.av.queue = [back];
                }
            });
        },
        destroy() {
            disposeWorld(engine);
        },
    };
    if (typeof engine.dbg === "function") {
        engine.dbg({
            st: engine.st,
            inter: engine.inter,
            project: engine.project,
            unproject: engine.unproject,
            screenOfTile: (cx, cy) => { const c = dependencies.tileTop(cx, cy); return engine.project(c.x, c.y + dependencies.HTH); },
            objScreenPoint: (id) => { const r = engine.inter[id].hitRect; return engine.project(r.x + r.w / 2, r.y + r.h * 0.4); },
        });
    }
}
