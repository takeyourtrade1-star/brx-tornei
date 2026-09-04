// Motore Asso World: on pointer down.
import * as dependencies from "./dependencies";

export function installOnPointerDown(engine) {
  engine.onPointerDown = function(e) {
    if (engine.st.paused)
        return;
    engine.canvas.focus({ preventScroll: true });
    engine.st.navigationTarget = null;
    engine.sfx.ensure();
    if (engine.st.destroyed)
        return;
    // Intercetta i click se la sequenza busta lettere è attiva (overlay)
    if (engine.letterOverlayActive()) {
        const p = engine.pointerPos(e);
        const hx = p.x;
        const hy = p.y;
        const centerX = engine.st.view.w / 2;
        const centerY = engine.st.view.h / 2;
        const lt = engine.st.letter;
        if (lt.phase === "lift") {
            lt.phase = "open";
            lt.t0 = engine.st.t - 1.1;
            engine.st.shake = 6;
            return;
        }
        if (lt.phase === "open") {
            engine.advanceLetterToReveal();
            return;
        }
        if (lt.phase === "done") {
            const uiS = Math.min(engine.st.view.w / 340, engine.st.view.h / 330, 2.8);
            const rewardY = centerY - 8;
            const scale = uiS;
            const btnCy = rewardY + dependencies.CREDITS_REWARD_CARD.btnCy * scale;
            const btnW = dependencies.CREDITS_REWARD_CARD.btnW * scale;
            const btnH = dependencies.CREDITS_REWARD_CARD.btnH * scale;
            /* click sul link "Ebartex" → apre la sezione crediti del portale */
            if (lt.ebartexHitRect) {
                const r = lt.ebartexHitRect;
                if (hx >= r.x && hx <= r.x + r.w && hy >= r.y && hy <= r.y + r.h) {
                    engine.sfx.click();
                    try {
                        window.open(dependencies.EBARTEX_CREDITO_URL, "_blank", "noopener,noreferrer");
                    }
                    catch (_) { /* ignore */ }
                    return;
                }
            }
            if (Math.abs(hx - centerX) < btnW / 2 + 8 && Math.abs(hy - btnCy) < btnH / 2 + 8) {
                engine.closeLetterReward();
            }
            return;
        }
        return;
    }
    if (engine.st.modal || engine.st.lock || engine.st.cinematic)
        return;
    engine.st.lastAct = engine.st.t;
    engine.wakeAfk();
    const p = engine.pointerPos(e);
    const dec = engine.st.room === "tournament" ? engine.hitDecor(p.x, p.y) : null;
    if (dec) {
        if (dec.kind === "letter") {
            engine.startLetterOpening();
            return;
        }
        if (dec.kind === "music") {
            engine.clickObject({ ...dependencies.MUSIC_OBJ });
            return;
        }
        if (dec.kind === "cat") {
            engine.petCat();
            return;
        }
        if (dec.kind === "dog") {
            engine.petDog();
            return;
        }
        if (dec.kind === "intercom") {
            engine.sfx.click();
            if (engine.integrationMode !== "site" && !engine.st.ringTest && !(engine.st.ring && engine.st.t < engine.st.ring.until)) {
                engine.st.ringTest = engine.st.t + 3;
                engine.showBubble("📯 Citofono: test in corso… resta in ascolto!", 2.6);
            }
            return;
        }
        if (dec.kind === "egg") {
            if (dec.egg.key === "mirror") {
                engine.openMirror();
                return;
            }
            engine.eggClick(dec.egg);
            return;
        }
    }
    const obj = engine.hitObject(p.x, p.y);
    if (obj) {
        engine.clickObject(obj);
        return;
    }
    const wpt = engine.unproject(p.x, p.y);
    const tl = dependencies.worldToTile(wpt.x, wpt.y);
    if (dependencies.inGrid(tl.cx, tl.cy) && !engine.blocked.has(dependencies.tkey(tl.cx, tl.cy))) {
        engine.st.pending = null;
        engine.st.sitTarget = false;
        if (engine.walkToTile(tl)) {
            engine.st.ripples.push({ cx: tl.cx, cy: tl.cy, t0: engine.st.t });
            engine.hideHintOnce();
        }
    }
};
}
