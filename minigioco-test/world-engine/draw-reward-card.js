// Motore Asso World: draw reward card.
import * as dependencies from "./dependencies";

export function drawRewardCard(engine, frame) {
    frame.k = dependencies.clamp(frame.progress, 0, 1);
    frame.pop = 0.88 + 0.12 * dependencies.easeOutBack(frame.k);
    frame.s = frame.uiScale * frame.pop;
    frame.shown = dependencies.slotCreditValue(frame.creditsBefore, frame.creditsAfter, frame.k);
    frame.counting = frame.k > 0.1 && frame.k < 0.94;
    frame.delta = frame.creditsAfter - frame.creditsBefore;
    frame.deltaK = dependencies.clamp((frame.k - 0.46) / 0.32, 0, 1);
    frame.c.save();
    frame.c.translate(frame.dx, frame.dy);
    frame.c.scale(frame.s, frame.s);
    ({ w: frame.tw, h: frame.th, btnW: frame.btnW, btnH: frame.btnH, btnCy: frame.btnCy } = dependencies.CREDITS_REWARD_CARD);
    frame.top = -frame.th / 2;
    frame.EB_GOLD = "#F3C76A";
    /* ombra card */
    frame.c.fillStyle = "rgba(0,0,0,0.38)";
    engine.rr(frame.c, -frame.tw / 2 + 8, frame.top + 10, frame.tw - 16, frame.th, 18);
    frame.c.fill();
    frame.tg = frame.c.createLinearGradient(0, frame.top, 0, frame.top + frame.th);
    frame.tg.addColorStop(0, "#1a2440");
    frame.tg.addColorStop(0.5, "#0F172A");
    frame.tg.addColorStop(1, "#090b12");
    frame.c.fillStyle = frame.tg;
    engine.rr(frame.c, -frame.tw / 2, frame.top, frame.tw, frame.th, 16);
    frame.c.fill();
    /* bordo oro + interno */
    frame.c.strokeStyle = frame.EB_GOLD;
    frame.c.lineWidth = 2;
    frame.c.stroke();
    frame.c.strokeStyle = "rgba(255,255,255,0.14)";
    frame.c.lineWidth = 1;
    engine.rr(frame.c, -frame.tw / 2 + 8, frame.top + 8, frame.tw - 16, frame.th - 16, 12);
    frame.c.stroke();
    frame.c.textAlign = "center";
    frame.c.textBaseline = "middle";
    /* — brand EBARTEX + divisore oro — */
    frame.c.fillStyle = frame.EB_GOLD;
    frame.c.font = "800 10px 'Segoe UI', system-ui, sans-serif";
    frame.c.fillText("EBARTEX", 0, frame.top + 18);
    frame.c.strokeStyle = "rgba(243, 199, 106, 0.45)";
    frame.c.lineWidth = 1;
    frame.c.beginPath();
    frame.c.moveTo(-44, frame.top + 26);
    frame.c.lineTo(44, frame.top + 26);
    frame.c.stroke();
    /* — titolo — */
    frame.c.fillStyle = "rgba(255,245,216,0.96)";
    frame.c.font = "900 18px 'Segoe UI', system-ui, sans-serif";
    frame.c.fillText("Payout torneo", 0, frame.top + 48);
    /* — nome torneo — */
    frame.c.font = "700 14px 'Segoe UI', system-ui, sans-serif";
    frame.c.fillStyle = "#ffb347";
    frame.name = frame.tournamentName.length > 26 ? frame.tournamentName.slice(0, 24) + "..." : frame.tournamentName;
    frame.c.fillText(frame.name + "!", 0, frame.top + 72);
    /* — label crediti — */
    frame.c.fillStyle = "rgba(255,255,255,0.55)";
    frame.c.font = "700 10px 'Segoe UI', system-ui, sans-serif";
    frame.c.fillText("I tuoi crediti", 0, frame.top + 98);
    frame.counterCy = frame.top + 132;
    frame.kSpin = dependencies.clamp((frame.k - 0.1) / 0.84, 0, 1);
    frame.spinPos = 6 * dependencies.easeOutCubic(frame.kSpin);
    frame.phaseFade = 1 - dependencies.easeInCubic(dependencies.clamp((frame.kSpin - 0.85) / 0.15, 0, 1));
    frame.fast = frame.counting && frame.kSpin < 0.7;
    frame.glowA = frame.counting ? 0.3 + 0.16 * Math.sin(frame.animT * 16) : 0.24;
    frame.stopFlash = frame.k > 0.94 ? (1 - dependencies.clamp((frame.k - 0.94) / 0.06, 0, 1)) * 0.55 : 0;
    frame.cg = frame.c.createRadialGradient(0, frame.counterCy, 10, 0, frame.counterCy, 86);
    frame.cg.addColorStop(0, "rgba(243, 199, 106, " + (frame.glowA + frame.stopFlash).toFixed(3) + ")");
    frame.cg.addColorStop(0.55, "rgba(204, 126, 74, 0.12)");
    frame.cg.addColorStop(1, "rgba(243, 199, 106, 0)");
    frame.c.fillStyle = frame.cg;
    frame.c.beginPath();
    frame.c.ellipse(0, frame.counterCy, 106, 42, 0, 0, Math.PI * 2);
    frame.c.fill();
    frame.slotW = 214, frame.slotH = 52;
    frame.c.fillStyle = "#05070d";
    engine.rr(frame.c, -frame.slotW / 2, frame.counterCy - frame.slotH / 2, frame.slotW, frame.slotH, 10);
    frame.c.fill();
    frame.slotG = frame.c.createLinearGradient(0, frame.counterCy - frame.slotH / 2, 0, frame.counterCy + frame.slotH / 2);
    frame.slotG.addColorStop(0, "rgba(255,255,255,0.12)");
    frame.slotG.addColorStop(0.45, "rgba(255,255,255,0.02)");
    frame.slotG.addColorStop(0.52, "rgba(0,0,0,0.35)");
    frame.slotG.addColorStop(1, "rgba(243, 199, 106, 0.08)");
    frame.c.fillStyle = frame.slotG;
    engine.rr(frame.c, -frame.slotW / 2 + 3, frame.counterCy - frame.slotH / 2 + 3, frame.slotW - 6, frame.slotH - 6, 8);
    frame.c.fill();
    frame.c.strokeStyle = "rgba(243, 199, 106, " + (0.6 + frame.stopFlash * 0.4).toFixed(3) + ")";
    frame.c.lineWidth = 1.4 + frame.stopFlash * 1.2;
    frame.c.stroke();
    frame.gloss = frame.c.createLinearGradient(0, frame.counterCy - frame.slotH / 2, 0, frame.counterCy - frame.slotH / 2 + 14);
    frame.gloss.addColorStop(0, "rgba(255,255,255,0.18)");
    frame.gloss.addColorStop(1, "rgba(255,255,255,0)");
    frame.c.fillStyle = frame.gloss;
    engine.rr(frame.c, -frame.slotW / 2 + 4, frame.counterCy - frame.slotH / 2 + 4, frame.slotW - 8, 14, 6);
    frame.c.fill();
    frame.c.save();
    frame.c.beginPath();
    engine.rr(frame.c, -frame.slotW / 2 + 7, frame.counterCy - frame.slotH / 2 + 7, frame.slotW - 14, frame.slotH - 14, 6);
    frame.c.clip();
    frame.value = dependencies.formatCredits(frame.shown);
    frame.chars = frame.value.split("");
    frame.totalW = frame.chars.reduce((sum, ch) => sum + (ch === "." ? 9 : 25), 0) + (frame.chars.length - 1) * 3;
    frame.x = -frame.totalW / 2;
    frame.c.font = "900 28px 'Segoe UI', system-ui, sans-serif";
    for (let i = 0; i < frame.chars.length; i++) {
        const ch = frame.chars[i];
        const cw = ch === "." ? 9 : 25;
        if (ch === ".") {
            frame.c.fillStyle = "rgba(255,235,178,0.75)";
            frame.c.fillText(".", frame.x + cw / 2, frame.counterCy + 9);
        }
        else {
            const bx = frame.x + cw / 2;
            /* box digit singolo con bordino */
            frame.c.fillStyle = "rgba(255,255,255,0.06)";
            engine.rr(frame.c, frame.x, frame.counterCy - 18, cw, 36, 5);
            frame.c.fill();
            frame.c.strokeStyle = "rgba(243, 199, 106, 0.18)";
            frame.c.lineWidth = 0.8;
            frame.c.stroke();
            /* spin: posizione cumulativa che decelera + offset che sfuma a 0 in coda */
            const spin = frame.counting ? (frame.spinPos + i * 0.31 * frame.phaseFade) % 1 : 0;
            const off = dependencies.easeOutCubic(spin) * 36;
            const digitCol = frame.counting ? "#fff8df" : "#ffd978";
            frame.c.shadowColor = "rgba(243, 199, 106, 0.9)";
            frame.c.shadowBlur = frame.counting ? 8 : 5;
            /* motion blur: 2 ghost quando gira veloce */
            if (frame.fast) {
                frame.c.globalAlpha = 0.22;
                frame.c.fillStyle = digitCol;
                frame.c.fillText(ch, bx, frame.counterCy + 9 - off + 16);
                frame.c.fillText(ch, bx, frame.counterCy + 9 - off - 16);
                frame.c.globalAlpha = 1;
            }
            frame.c.fillStyle = digitCol;
            frame.c.fillText(ch, bx, frame.counterCy + 9 - off);
            if (frame.counting)
                frame.c.fillText(String((Number(ch) + 1) % 10), bx, frame.counterCy + 45 - off);
            frame.c.shadowBlur = 0;
        }
        frame.x += cw + 3;
    }
    frame.c.restore();
    /* — badge +X crediti (verde) — */
    if (frame.deltaK > 0) {
        const dPop = dependencies.easeOutBack(frame.deltaK);
        frame.c.save();
        frame.c.translate(0, frame.top + 182);
        frame.c.scale(dPop, dPop);
        frame.c.fillStyle = "rgba(78, 222, 142, 0.16)";
        engine.rr(frame.c, -88, -17, 176, 34, 14);
        frame.c.fill();
        frame.c.strokeStyle = "rgba(110,231,168,0.55)";
        frame.c.lineWidth = 1;
        frame.c.stroke();
        frame.c.fillStyle = "#6ee7a8";
        frame.c.font = "900 16px 'Segoe UI', system-ui, sans-serif";
        frame.c.fillText("+" + dependencies.formatCredits(frame.delta) + " crediti", 0, 0);
        frame.c.restore();
    }
    /* — scintille orbitanti durante il count — */
    if (frame.counting) {
        for (let i = 0; i < 10; i++) {
            const a = frame.animT * 2.8 + i * 0.72;
            const rad = 86 + 12 * Math.sin(frame.animT * 3 + i);
            const px = Math.cos(a) * rad;
            const py = frame.counterCy + Math.sin(a) * rad * 0.34;
            frame.c.globalAlpha = 0.35 + 0.35 * Math.sin(frame.animT * 5 + i);
            frame.c.fillStyle = i % 2 ? "#F3C76A" : "#ff8a2a";
            frame.c.beginPath();
            frame.c.arc(px, py, 2.2 + (i % 3) * 0.6, 0, Math.PI * 2);
            frame.c.fill();
        }
        frame.c.globalAlpha = 1;
    }
}
