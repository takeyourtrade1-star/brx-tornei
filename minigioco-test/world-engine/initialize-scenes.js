// Motore Asso World: initialize scenes.
import * as dependencies from "./dependencies";

export function initializeScenes(engine) {
    engine.ctx = engine.canvas.getContext("2d");
    engine.integrationMode = engine.opts.integrationMode === "site" ? "site" : "prototype";
    engine.stats = dependencies.normalizeStats(engine.opts.stats, engine.integrationMode);
    engine.posters = engine.opts.posters || null;
    engine.phase = dependencies.dayPhase();
    engine.bg = dependencies.buildBackground(engine.phase, engine.stats, engine.posters);
    engine.F = dependencies.buildFurniture();
    engine.catSp = dependencies.buildCat();
    engine.dogSp = dependencies.buildDog();
    engine.boardSp = dependencies.buildBoard(false);
    engine.bracketOn = false;
    engine.currentLook = { ...dependencies.DEFAULT_LOOK, ...(engine.opts.look || {}) };
    engine.avatar = dependencies.buildAvatar(engine.currentLook);
    engine.sfx = dependencies.makeAudio();
    engine.world = dependencies.mkCanvas(dependencies.WW, dependencies.WH);
    engine.wctx = engine.world.getContext("2d");
    engine.wctx.imageSmoothingEnabled = false;
    engine.fx = engine.opts.fx || dependencies.getFxFlags("high");
    engine.remoteRenderOptions = { reducedMotion: engine.fx.reducedMotion, lightMode: false };
    engine.frameLimiter = dependencies.createFrameLimiter(engine.fx.targetFps);
    engine.blocked = new Set();
    dependencies.FURN.forEach((f) => f.tiles.forEach(([x, y]) => engine.blocked.add(dependencies.tkey(x, y))));
    engine.sprMap = {
        desk: dependencies.outlined(engine.F.desk), cam: dependencies.outlined(engine.F.cam), cam2: dependencies.outlined(engine.F.camB), chair: dependencies.outlined(engine.F.chair),
        table: dependencies.outlined(engine.F.table), stool: dependencies.outlined(engine.F.stool), stool2: null, lamp: dependencies.outlined(engine.F.lamp),
    };
    engine.sprMap.stool2 = engine.sprMap.stool;
    engine.plantFrames = engine.F.plant.map((p) => dependencies.outlined(p));
    engine.turnFrames = engine.F.turn.map((p) => dependencies.outlined(p));
    engine.entities = dependencies.FURN.map((f) => {
        const xs = f.tiles.map((t) => t[0]), ys = f.tiles.map((t) => t[1]);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const anchor = dependencies.tileTop(minX, minY);
        return {
            key: f.key, inter: f.inter || null, minX, maxX, minY, maxY, anchor,
            spr: f.key === "plant" || f.key === "turn" ? null : engine.sprMap[f.key],
            frames: f.key === "plant" ? engine.plantFrames : f.key === "turn" ? engine.turnFrames : null,
        };
    });
    engine.inter = {};
    for (const [id, def] of Object.entries(dependencies.INTERACTIVES))
        engine.inter[id] = { id, ...def };
    engine.rectOf = (e) => {
        const spr = e.frames ? e.frames[0] : e.spr;
        return { x: e.anchor.x - spr.ax, y: e.anchor.y - spr.ay, w: spr.cv.width, h: spr.cv.height };
    };
    engine.inter.pc.hitRect = engine.rectOf(engine.entities.find((e) => e.key === "desk"));
    engine.inter.decks.hitRect = engine.rectOf(engine.entities.find((e) => e.key === "table"));
    engine.inter.board.hitRect = { x: engine.boardSp.wx, y: engine.boardSp.wy, w: engine.boardSp.cv.width, h: engine.boardSp.cv.height * 0.64 };
    // canvas sorgente per l'hit-test pixel-preciso (l'area cliccabile segue la sagoma reale)
    engine.inter.pc.hitCv = (engine.entities.find((e) => e.key === "desk").spr || {}).cv || null;
    engine.inter.decks.hitCv = (engine.entities.find((e) => e.key === "table").spr || {}).cv || null;
    engine.inter.board.hitCv = engine.boardSp.cv;
    engine.HIT_ALPHA = 24;
    engine.sils = {
        pc: dependencies.makeSil(engine.sprMap.desk),
        decks: dependencies.makeSil(engine.sprMap.table),
        board: dependencies.makeSil({ cv: engine.boardSp.cv }),
    };
    /* — porta Sala Arcade: disegnata nel background, hitRect statico — */
    engine.inter.door.hitRect = dependencies.tourDoorBounds().hit;
    engine.inter.door.hitCv = null;
    engine.inter.socialDoor.hitRect = dependencies.socialDoorBounds().hit;
    engine.inter.socialDoor.hitCv = null;
    engine.arcadeBg = dependencies.buildArcadeBackground();
    engine.arcadeF = dependencies.buildArcadeFurniture();
    engine.arcadeBlocked = new Set();
    dependencies.FURN_ARCADE.forEach((f) => f.tiles.forEach(([x, y]) => engine.arcadeBlocked.add(dependencies.tkey(x, y))));
    engine.arcadeSprMap = {
        cabinet1: dependencies.outlined(engine.arcadeF.cabinet1), cabinet2: dependencies.outlined(engine.arcadeF.cabinet2),
        cabinet3: dependencies.outlined(engine.arcadeF.cabinet3), kakeTable: dependencies.outlined(engine.arcadeF.kakeTable),
        sofa: dependencies.outlined(engine.arcadeF.sofa), ticket: dependencies.outlined(engine.arcadeF.ticket), popcorn: dependencies.outlined(engine.arcadeF.popcorn),
    };
    engine.arcadeEntities = dependencies.FURN_ARCADE.map((f) => {
        const xs = f.tiles.map((t) => t[0]), ys = f.tiles.map((t) => t[1]);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const anchor = dependencies.tileTop(minX, minY);
        return {
            key: f.key, inter: f.inter || null, minX, maxX, minY, maxY, anchor,
            spr: engine.arcadeSprMap[f.key], frames: null,
        };
    });
    engine.arcadeInter = {};
    for (const [id, def] of Object.entries(dependencies.INTERACTIVES_ARCADE))
        engine.arcadeInter[id] = { id, ...def };
    engine.arcRectOf = (k) => { const e = engine.arcadeEntities.find((x) => x.key === k); const s = e.spr; return { x: e.anchor.x - s.ax, y: e.anchor.y - s.ay, w: s.cv.width, h: s.cv.height }; };
    engine.arcadeInter.arcade1.hitRect = engine.arcRectOf("cabinet1");
    engine.arcadeInter.arcade1.hitCv = engine.arcadeSprMap.cabinet1.cv;
    engine.arcadeInter.arcade2.hitRect = engine.arcRectOf("cabinet2");
    engine.arcadeInter.arcade2.hitCv = engine.arcadeSprMap.cabinet2.cv;
    engine.arcadeInter.arcade3.hitRect = engine.arcRectOf("cabinet3");
    engine.arcadeInter.arcade3.hitCv = engine.arcadeSprMap.cabinet3.cv;
    engine.arcadeInter.kakegurui.hitRect = engine.arcRectOf("kakeTable");
    engine.arcadeInter.kakegurui.hitCv = engine.arcadeSprMap.kakeTable.cv;
    engine.arcadeInter.doorBack.hitRect = dependencies.arcadeDoorBounds().hit;
    engine.arcadeInter.doorBack.hitCv = null;
    engine.arcadeSils = {
        arcade1: dependencies.makeSil(engine.arcadeSprMap.cabinet1, "#05d9e8"),
        arcade2: dependencies.makeSil(engine.arcadeSprMap.cabinet2, "#39ff14"),
        arcade3: dependencies.makeSil(engine.arcadeSprMap.cabinet3, "#b026ff"),
        kakegurui: dependencies.makeSil(engine.arcadeSprMap.kakeTable, "#ff2a6d"),
        doorBack: null,
    };
    engine.arcadeBoardSp = { cv: dependencies.mkCanvas(1, 1), wx: 0, wy: 0 };
    engine.piazzaBg = dependencies.buildPiazzaBackground(engine.phase);
    engine.piazzaF = dependencies.buildPiazzaFurniture();
    engine.piazzaBlocked = new Set();
    dependencies.FURN_PIAZZA.forEach((f) => f.tiles.forEach(([x, y]) => engine.piazzaBlocked.add(dependencies.tkey(x, y))));
    engine.piazzaSprMap = {
        cabinet1: dependencies.outlined(engine.piazzaF.cabinet1), cabinet2: dependencies.outlined(engine.piazzaF.cabinet2),
        cabinet3: dependencies.outlined(engine.piazzaF.cabinet3), table1: dependencies.outlined(engine.piazzaF.table1),
        table2: dependencies.outlined(engine.piazzaF.table2), plant: dependencies.outlined(engine.piazzaF.plant),
        bench: dependencies.outlined(engine.piazzaF.bench),
    };
    engine.piazzaEntities = dependencies.FURN_PIAZZA.map((f) => {
        const xs = f.tiles.map((t) => t[0]), ys = f.tiles.map((t) => t[1]);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const anchor = dependencies.tileTop(minX, minY);
        return {
            key: f.key, inter: f.inter || null, minX, maxX, minY, maxY, anchor,
            spr: engine.piazzaSprMap[f.key], frames: null,
        };
    });
    engine.piazzaInter = {};
    for (const [id, def] of Object.entries(dependencies.INTERACTIVES_PIAZZA))
        engine.piazzaInter[id] = { id, ...def };
    engine.pzRectOf = (k) => { const e = engine.piazzaEntities.find((x) => x.key === k); const s = e.spr; return { x: e.anchor.x - s.ax, y: e.anchor.y - s.ay, w: s.cv.width, h: s.cv.height }; };
    engine.piazzaInter.piazzaCab1.hitRect = engine.pzRectOf("cabinet1");
    engine.piazzaInter.piazzaCab1.hitCv = engine.piazzaSprMap.cabinet1.cv;
    engine.piazzaInter.piazzaCab2.hitRect = engine.pzRectOf("cabinet2");
    engine.piazzaInter.piazzaCab2.hitCv = engine.piazzaSprMap.cabinet2.cv;
    engine.piazzaInter.piazzaCab3.hitRect = engine.pzRectOf("cabinet3");
    engine.piazzaInter.piazzaCab3.hitCv = engine.piazzaSprMap.cabinet3.cv;
    engine.piazzaInter.piazzaTable1.hitRect = engine.pzRectOf("table1");
    engine.piazzaInter.piazzaTable1.hitCv = engine.piazzaSprMap.table1.cv;
    engine.piazzaInter.piazzaTable2.hitRect = engine.pzRectOf("table2");
    engine.piazzaInter.piazzaTable2.hitCv = engine.piazzaSprMap.table2.cv;
    engine.piazzaInter.doorBack.hitRect = dependencies.piazzaDoorBounds().hit;
    engine.piazzaInter.doorBack.hitCv = null;
    engine.piazzaSils = {
        piazzaCab1: dependencies.makeSil(engine.piazzaSprMap.cabinet1, "#05d9e8"),
        piazzaCab2: dependencies.makeSil(engine.piazzaSprMap.cabinet2, "#39ff14"),
        piazzaCab3: dependencies.makeSil(engine.piazzaSprMap.cabinet3, "#b026ff"),
        piazzaTable1: dependencies.makeSil(engine.piazzaSprMap.table1, "#52b788"),
        piazzaTable2: dependencies.makeSil(engine.piazzaSprMap.table2, "#3a86ff"),
        doorBack: null,
    };
    engine.piazzaBoardSp = { cv: dependencies.mkCanvas(1, 1), wx: 0, wy: 0 };
    engine.remotePlayers = new Map();
    engine.tourData = null;
    engine.deskEnt = engine.entities.find((e) => e.key === "desk");
    engine.screenQuad = engine.F.meta.screenQuad.map((p) => ({ x: p.x + engine.deskEnt.anchor.x, y: p.y + engine.deskEnt.anchor.y }));
    engine.qlerp = (u, v) => {
        const q = engine.screenQuad;
        const tx = dependencies.lerp(q[0].x, q[1].x, u), ty = dependencies.lerp(q[0].y, q[1].y, u);
        const bx = dependencies.lerp(q[3].x, q[2].x, u), by = dependencies.lerp(q[3].y, q[2].y, u);
        return { x: dependencies.lerp(tx, bx, v), y: dependencies.lerp(ty, by, v) };
    };
    engine.camLeds = engine.entities.filter((e) => e.key.startsWith("cam")).map((e, i) => {
        const led = e.key === "cam" ? engine.F.meta.camLedA : engine.F.meta.camLedB;
        return { x: led.x + e.anchor.x, y: led.y + e.anchor.y, ph: i * 0.8 };
    });
    engine.lampEnt = engine.entities.find((e) => e.key === "lamp");
    engine.lampGlow = { x: engine.F.meta.lampGlow.x + engine.lampEnt.anchor.x, y: engine.F.meta.lampGlow.y + engine.lampEnt.anchor.y };
    engine.lampFloor = { x: engine.lampEnt.anchor.x, y: engine.lampEnt.anchor.y + dependencies.HTH + 2 };
    engine.turnEnt = engine.entities.find((e) => e.key === "turn");
    engine.turnRect = engine.rectOf(engine.turnEnt);
    engine.turnSil = dependencies.makeSil(engine.turnFrames[0]);
    engine.turnTop = { x: engine.turnEnt.anchor.x, y: engine.turnEnt.anchor.y - 34 };
    engine.GHOST_TILE = { cx: 9, cy: 3 };
    engine.ghostFrames = engine.avatar.sw.idle;
    engine.ghostSils = engine.ghostFrames.map((f) => dependencies.makeSil(f, "#9fc4ff"));
    engine.onRug = (cx, cy) => cx >= 3 && cx <= 6 && cy >= 5 && cy <= 7;
    engine.rectFromPts = (pts) => {
        const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
        const x0 = Math.min(...xs), y0 = Math.min(...ys);
        return { x: x0, y: y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0 };
    };
    engine.intercomRect = engine.rectFromPts([dependencies.wallR(10.5, 64), dependencies.wallR(11.2, 64), dependencies.wallR(11.2, 40), dependencies.wallR(10.5, 40)]);
    engine.intercomLed = dependencies.wallR(11.0, 60);
    engine.findEnt = (k) => engine.entities.find((e) => e.key === k);
    engine.spriteCvOf = (e) => (e ? (e.frames ? e.frames[0].cv : e.spr ? e.spr.cv : null) : null);
}
