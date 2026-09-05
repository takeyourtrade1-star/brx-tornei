// Motore Asso World: initialize state.
import * as dependencies from "./dependencies";

export function initializeState(engine) {
    engine.eggs = [
        { key: "plant", rect: engine.rectOf(engine.findEnt("plant")), cv: engine.spriteCvOf(engine.findEnt("plant")) },
        { key: "lamp", rect: engine.rectOf(engine.lampEnt), cv: engine.spriteCvOf(engine.lampEnt) },
        { key: "cam", rect: engine.rectOf(engine.findEnt("cam")), cv: engine.spriteCvOf(engine.findEnt("cam")) },
        { key: "cam2", rect: engine.rectOf(engine.findEnt("cam2")), cv: engine.spriteCvOf(engine.findEnt("cam2")) },
        { key: "chair", rect: engine.rectOf(engine.findEnt("chair")), cv: engine.spriteCvOf(engine.findEnt("chair")) },
        { key: "stool", rect: engine.rectOf(engine.findEnt("stool")), cv: engine.spriteCvOf(engine.findEnt("stool")) },
        { key: "stool", rect: engine.rectOf(engine.findEnt("stool2")), cv: engine.spriteCvOf(engine.findEnt("stool2")) },
        { key: "window", rect: engine.rectFromPts([dependencies.wallL(7.7, 92), dependencies.wallL(5.7, 92), dependencies.wallL(5.7, 24), dependencies.wallL(7.7, 24)]) },
        { key: "posterBrand", rect: engine.rectFromPts([dependencies.wallL(1.0, 96), dependencies.wallL(2.7, 96), dependencies.wallL(2.7, 48), dependencies.wallL(1.0, 48)]) },
        { key: "mirror", rect: engine.rectFromPts([dependencies.wallL(8.05, 98), dependencies.wallL(9.85, 98), dependencies.wallL(9.85, 10), dependencies.wallL(8.05, 10)]) },
        { key: "stats", rect: engine.rectFromPts([dependencies.wallL(3.3, 88), dependencies.wallL(4.7, 88), dependencies.wallL(4.7, 50), dependencies.wallL(3.3, 50)]) },
    ];
    if (engine.posters && engine.posters.week)
        engine.eggs.push({ key: "posterWeek", rect: engine.rectFromPts([dependencies.wallR(0.55, 92), dependencies.wallR(1.6, 92), dependencies.wallR(1.6, 42), dependencies.wallR(0.55, 42)]) });
    if (engine.posters && engine.posters.ban)
        engine.eggs.push({ key: "posterBan", rect: engine.rectFromPts([dependencies.wallR(1.8, 92), dependencies.wallR(2.85, 92), dependencies.wallR(2.85, 42), dependencies.wallR(1.8, 42)]) });
    engine.tablePt = (tx, ty) => { const p = dependencies.tileTop(tx, ty); return { x: p.x, y: p.y + dependencies.HTH - 22 }; };
    engine.CAT_PERCH_SPOTS = {
        chair: { approach: { cx: 2, cy: 4 }, tx: 1.0, ty: 4.0, lift: 21, land: { cx: 2, cy: 4 }, dir: "nw", state: "sit" },
        table: { approach: { cx: 7, cy: 5 }, tx: 7.05, ty: 3.28, lift: 22, land: { cx: 7, cy: 5 }, dir: "sw", state: "sit" },
        desk: { approach: { cx: 1, cy: 5 }, tx: 0.45, ty: 4.42, lift: 27, land: { cx: 1, cy: 5 }, dir: "se", state: "sleep" },
    };
    engine.scrCenter = {
        x: (engine.screenQuad[0].x + engine.screenQuad[2].x) / 2,
        y: (engine.screenQuad[0].y + engine.screenQuad[2].y) / 2,
    };
    engine.LETTER_START = (() => {
        const p = dependencies.tileTop(9.4, 0.3);
        return { x: p.x - 4, y: p.y + dependencies.HTH - 8 };
    })();
    engine.LETTER_REST = (() => {
        const p = dependencies.tileTop(8.9, 1.5);
        return { x: p.x, y: p.y + dependencies.HTH - 4 };
    })();
    engine.letterHitRect = (lt) => ({ x: lt.x - 14, y: lt.y - 18, w: 28, h: 20 });
    engine.tutDone = typeof localStorage !== "undefined" && localStorage.getItem("irg-tutorial-done") === "1";
    engine.initRoom = engine.opts.initialRoom || "tournament";
    engine.st = {
        t: 0, last: 0, raf: null, pauseTimer: null, destroyed: false,
        room: engine.initRoom, transition: null, navigationTarget: null,
        view: { w: 1, h: 1, dpr: 1, scale: 1 },
        cam: {
            x: engine.initRoom === "piazza" ? dependencies.PIAZZA_DEFAULT_CAM.x : engine.initRoom === "arcade" ? dependencies.ARC_DEFAULT_CAM.x : dependencies.DEFAULT_CAM.x,
            y: engine.initRoom === "piazza" ? dependencies.PIAZZA_DEFAULT_CAM.y : engine.initRoom === "arcade" ? dependencies.ARC_DEFAULT_CAM.y : dependencies.DEFAULT_CAM.y,
            z: 1, tween: null,
        },
        av: {
            from: engine.initRoom === "piazza" ? { cx: dependencies.PIAZZA_ENTRY_TILE.cx, cy: dependencies.PIAZZA_ENTRY_TILE.cy } : { cx: 10, cy: 9 },
            to: null, t: 0,
            fx: engine.initRoom === "piazza" ? dependencies.PIAZZA_ENTRY_TILE.cx : 10,
            fy: engine.initRoom === "piazza" ? dependencies.PIAZZA_ENTRY_TILE.cy : 9,
            queue: [], localEchoes: [], dir: "nw", wt: 0, stepN: 0, nextBlink: 2.6, blinkUntil: 0, seated: false,
        },
        pending: null, lock: false, modal: null, paused: engine.opts.paused === true,
        sitTarget: false, standBack: null,
        nearObj: null, nearSince: 0,
        hover: { tile: null, obj: null },
        ripples: [], bubble: null, motes: [],
        flicker: { next: 1.4, until: 0 },
        lampF: { next: 2.4, until: 0 },
        introDone: false, hintHidden: false,
        tut: { active: !engine.tutDone, i: 0, phase: "init", t: 0, announced: false }, // tutorial guidato (una volta sola)
        keys: new Set(), lastKey: null,
        /* nuove feature */
        fx: [], // particelle (cuori, zzz, note, scintille)
        alert: 0, // glow d'allerta sul PC fino a t=alert
        ring: null, // { until } citofono che suona
        ringTest: null, // timer del test citofono
        eggCd: 0, // cooldown easter egg
        lastAct: 0, afk: false, afkGoing: false, afkShuffle: null, afkShuffleGoing: false, shake: 0,
        nextNote: 0, phaseCheck: 30,
        countdown: null, cdRang: false, // sveglia torneo sul tavolo
        ghost: null, // username dell'avversario fantasma
        prints: [], // orme sul tappeto
        photoHide: false, flash: 0, // modalità foto
        avDraw: null, // ultimo sprite avatar (per il riflesso)
        cat: {
            from: { cx: 4, cy: 6 }, to: null, t: 0, fx: 4, fy: 6, queue: [],
            dir: "se", state: "sleep", until: 8 + Math.random() * 6, goal: null,
            pets: 0, follow: 0, nextZ: 0,
            perch: null, // { key, tx, ty, lift, until } gatta sugli arredi
            streak: 0, lastPet: -99, // carezze consecutive (per lo Shadow Realm)
            pendingChairAt: null, // timer per ritardare la salita sulla sedia
        },
        dog: {
            from: { cx: 5, cy: 7 }, to: null, t: 0, fx: 5, fy: 7, queue: [],
            dir: "se", state: "sleep", until: 6 + Math.random() * 8, goal: null,
            pets: 0, follow: 0, nextZ: 0,
            perch: null,
            streak: 0, lastPet: -99,
            pendingChairAt: null,
        },
        petInteraction: null, // { type: "chase"|"fight", stage: number, t0: number, runnerTarget?: {cx, cy}, until?: number }
        nextPetInteraction: 60 + Math.random() * 60, // primo check dopo 60-120s
        cinematic: false, // input bloccato durante le sequenze
        chairSpin: -99, // t dell'ultima "girata" della sedia
        scatter: [], // carte sparpagliate sul tavolo (fisica con attrito)
        shadow: null, // { until } modalità Shadow Realm
        matrix: [], // colonne della pioggia digitale alla finestra
        letterNextAt: 40 + Math.random() * 10, // busta lettere ogni 40-50s
        letter: null, // busta attiva / sequenza ricompensa crediti
        letterFx: [], // particelle confetti (screen-space)
        hype: null, // sequenza di hype pre-match in corso
        pointer: { x: 0.5, y: 0.5 }, // mouse normalizzato (riflessi olografici)
    };
    for (let i = 0; i < 14; i++) {
        engine.st.motes.push({ u: Math.random(), v: Math.random(), sp: 0.03 + Math.random() * 0.05, ph: Math.random() * 6.28, lift: 8 + Math.random() * 48 });
    }
    engine.tourData = { bg: engine.bg, blocked: engine.blocked, sprMap: engine.sprMap, entities: engine.entities, inter: engine.inter, sils: engine.sils, boardSp: engine.boardSp };
    if (engine.initRoom === "arcade") {
        engine.bg = engine.arcadeBg;
        engine.blocked = engine.arcadeBlocked;
        engine.sprMap = engine.arcadeSprMap;
        engine.entities = engine.arcadeEntities;
        engine.inter = engine.arcadeInter;
        engine.sils = engine.arcadeSils;
        engine.boardSp = engine.arcadeBoardSp;
        const entry = dependencies.ARC_ENTRY_TILE;
        engine.st.av.from = { cx: entry.cx, cy: entry.cy };
        engine.st.av.fx = entry.cx;
        engine.st.av.fy = entry.cy;
    }
    else if (engine.initRoom === "piazza") {
        engine.bg = engine.piazzaBg;
        engine.blocked = engine.piazzaBlocked;
        engine.sprMap = engine.piazzaSprMap;
        engine.entities = engine.piazzaEntities;
        engine.inter = engine.piazzaInter;
        engine.sils = engine.piazzaSils;
        engine.boardSp = engine.piazzaBoardSp;
        engine.st.av.queue = [];
    }
    else {
        // ingresso in scena
        engine.st.av.queue = dependencies.findPath({ cx: 10, cy: 9 }, { cx: 5, cy: 6 }, engine.blocked) || [];
    }
    engine.letterOverlayActive = () => engine.st.letter && ["lift", "open", "reveal", "done"].includes(engine.st.letter.phase);
    engine.camTo = (to, dur, cb) => {
        engine.st.cam.tween = { fx: engine.st.cam.x, fy: engine.st.cam.y, fz: engine.st.cam.z, tx: to.x, ty: to.y, tz: to.z, t: 0, dur: engine.fx.cssAnimations ? dur : dur * 0.35, cb };
    };
    engine.project = (wx, wy) => {
        const s = engine.st.view.scale * engine.st.cam.z;
        return { x: (wx - engine.st.cam.x) * s + engine.st.view.w / 2, y: (wy - engine.st.cam.y) * s + engine.st.view.h / 2 };
    };
    engine.unproject = (sx, sy) => {
        const s = engine.st.view.scale * engine.st.cam.z;
        return { x: (sx - engine.st.view.w / 2) / s + engine.st.cam.x, y: (sy - engine.st.view.h / 2) / s + engine.st.cam.y };
    };
    engine.showBubble = (text, dur, target) => { engine.st.bubble = { text, t0: engine.st.t, dur, target }; };
    engine.hideHintOnce = () => {
        if (!engine.st.hintHidden) {
            engine.st.hintHidden = true;
            engine.apiRef.current.hideHint && engine.apiRef.current.hideHint();
        }
    };
    engine.worldNavigation = dependencies.createWorldNavigation({
        getRoom: () => engine.st.room,
        getPosition: () => engine.st.av.to || engine.st.av.from,
        getBlocked: () => engine.blocked,
        getInteractives: () => engine.inter,
        setQueue: (path) => { engine.st.av.queue = path; engine.st.sitTarget = false; },
        setPending: (plan) => { engine.st.pending = engine.inter[plan.id] || { id: plan.id, ...plan.definition }; },
        onArrive: (plan) => {
            const target = engine.inter[plan.id];
            if (target)
                engine.clickObject(target);
        },
    });
    engine.avIdle = () => !engine.st.av.to && !engine.st.av.queue.length && !engine.st.lock && !engine.st.cam.tween;
    engine.tutCaption = (text) => {
        if (engine.apiRef.current.setTutorialCaption)
            engine.apiRef.current.setTutorialCaption(text || null);
    };
    engine.tutIntro = (on) => {
        if (engine.apiRef.current.setTutorialIntro)
            engine.apiRef.current.setTutorialIntro(!!on);
    };
    engine.tutOutro = (on) => {
        if (engine.apiRef.current.setTutorialOutro)
            engine.apiRef.current.setTutorialOutro(!!on);
    };
    engine.inRect = (w, r) => w.x >= r.x && w.x <= r.x + r.w && w.y >= r.y && w.y <= r.y + r.h;
    engine.ALWAYS_FX = new Set(["heart"]);
    engine.spawnFx = (kind, x, y, n = 1) => {
        if (!engine.fx.particles && !engine.ALWAYS_FX.has(kind))
            return;
        const DEF = {
            heart: { ch: "♥", col: "#ff6b8a", size: 9, rise: 26, dur: 1.3 },
            zzz: { ch: "z", col: "#cfd6f5", size: 9, rise: 22, dur: 1.8 },
            note: { ch: "♪", col: "#ffd76e", size: 10, rise: 30, dur: 1.6 },
            spark: { ch: "✦", col: "#ffe9b0", size: 9, rise: 24, dur: 1.2 },
            dust: { ch: "💨", col: "#d4d8e5", size: 10, rise: 15, dur: 0.8 },
            clash: { ch: "💥", col: "#ffb454", size: 11, rise: 18, dur: 0.6 },
        };
        const d = DEF[kind];
        for (let i = 0; i < n; i++) {
            engine.st.fx.push({ ...d, x: x + (Math.random() - 0.5) * 14, y: y - Math.random() * 6, t0: engine.st.t + i * 0.12, ph: Math.random() * 6.28 });
        }
    };
    engine.CHAIR = (dependencies.FURN.find((f) => f.key === "chair") || { tiles: [[1, 4]] }).tiles[0];
}
