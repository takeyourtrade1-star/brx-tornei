// Motore Asso World: initialize letter art.
import * as dependencies from "./dependencies";

export function initializeLetterArt(engine) {
    engine.drawLetterEnvelope = (c, dx, dy, opts = {}) => {
        const flapOpen = opts.flapOpen || 0;
        const sealBreak = opts.sealBreak || 0;
        const rot = opts.rot || 0;
        const scale = opts.scale != null ? opts.scale : 1;
        const glow = opts.glow || 0;
        const bw = 50, bh = 34, hinge = -10;
        /* Palette premium Ebartex: dark + oro foil */
        const EB_DARK = "#0F172A", EB_DARK2 = "#111827", EB_GOLD = "#F3C76A", EB_GOLD_D = "#c98f2b";
        c.save();
        c.translate(dx, dy);
        c.rotate(rot);
        c.scale(scale, scale);
        if (glow > 0) {
            const pg = c.createRadialGradient(0, 0, 4, 0, 0, 52);
            pg.addColorStop(0, "rgba(243, 199, 106, " + (0.6 * glow).toFixed(3) + ")");
            pg.addColorStop(0.45, "rgba(243, 199, 106, " + (0.18 * glow).toFixed(3) + ")");
            pg.addColorStop(1, "rgba(243, 199, 106, 0)");
            c.fillStyle = pg;
            c.beginPath();
            c.arc(0, 0, 52, 0, Math.PI * 2);
            c.fill();
        }
        c.fillStyle = "rgba(0,0,0,0.32)";
        c.beginPath();
        c.ellipse(0, 19, 30, 9, 0, 0, Math.PI * 2);
        c.fill();
        /* pannello posteriore scuro (sporge 2px come lembo dietro) */
        c.fillStyle = "#080b14";
        engine.rr(c, -bw / 2 - 2, -bh / 2 + 4, bw + 4, bh + 5, 4);
        c.fill();
        /* corpo busta: gradient dark Ebartex */
        const body = c.createLinearGradient(0, -bh / 2, 0, bh / 2 + 4);
        body.addColorStop(0, "#1a2440");
        body.addColorStop(0.55, EB_DARK);
        body.addColorStop(1, EB_DARK2);
        c.fillStyle = body;
        engine.rr(c, -bw / 2, -bh / 2, bw, bh, 3);
        c.fill();
        /* bordo oro */
        c.strokeStyle = EB_GOLD;
        c.lineWidth = 1.4;
        c.strokeRect(-bw / 2, -bh / 2, bw, bh);
        /* banda accent gradient-card2 (oro→viola Ebartex) diagonale faint */
        c.save();
        c.beginPath();
        engine.rr(c, -bw / 2 + 1, -bh / 2 + 1, bw - 2, bh - 2, 2.5);
        c.clip();
        const band = c.createLinearGradient(-bw / 2, -bh / 2, bw / 2, bh / 2);
        band.addColorStop(0, "rgba(204, 126, 74, 0.22)");
        band.addColorStop(0.5, "rgba(41, 20, 66, 0)");
        band.addColorStop(1, "rgba(243, 199, 106, 0.14)");
        c.fillStyle = band;
        c.fillRect(-bw / 2, -bh / 2, bw, bh);
        /* wordmark EBARTEX oro sul corpo busta (visibile su sfondo dark) */
        c.fillStyle = "rgba(243, 199, 106, 0.38)";
        c.font = "800 6.5px 'Segoe UI', system-ui, sans-serif";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("EBARTEX", 0, 6);
        /* sottolineatura mini brand */
        c.strokeStyle = "rgba(243, 199, 106, 0.3)";
        c.lineWidth = 0.6;
        c.beginPath();
        c.moveTo(-10, 11);
        c.lineTo(10, 11);
        c.stroke();
        c.textBaseline = "alphabetic";
        c.restore();
        /* lembi laterali ombreggiati (effetto piega) */
        c.fillStyle = "rgba(0,0,0,0.22)";
        c.beginPath();
        c.moveTo(-bw / 2, -bh / 2);
        c.lineTo(-bw / 2 + 11, 2);
        c.lineTo(-bw / 2, bh / 2);
        c.closePath();
        c.fill();
        c.beginPath();
        c.moveTo(bw / 2, -bh / 2);
        c.lineTo(bw / 2 - 11, 2);
        c.lineTo(bw / 2, bh / 2);
        c.closePath();
        c.fill();
        /* interno: camera scura + fascio di luce oro che cresce col flap */
        if (flapOpen > 0.04) {
            c.fillStyle = "#070a12";
            engine.rr(c, -bw / 2 + 6, -bh / 2 + 5, bw - 12, bh - 10, 2);
            c.fill();
            const ig = c.createRadialGradient(0, hinge + 4, 2, 0, hinge + 4, 30);
            ig.addColorStop(0, "rgba(255, 233, 160, " + (0.85 * flapOpen).toFixed(3) + ")");
            ig.addColorStop(0.42, "rgba(243, 199, 106, " + (0.3 * flapOpen).toFixed(3) + ")");
            ig.addColorStop(1, "rgba(243, 199, 106, 0)");
            c.fillStyle = ig;
            c.fillRect(-bw / 2 + 6, -bh / 2 + 6, bw - 12, bh - 12);
            /* lettera interna che emerge col flap: carta chiara con gradient + bordo + piega + scritta */
            const lY = -7 - flapOpen * 3;
            const lA = dependencies.clamp(flapOpen * 1.2, 0, 1);
            c.save();
            c.globalAlpha = lA;
            const lgrad = c.createLinearGradient(0, lY, 0, lY + 22);
            lgrad.addColorStop(0, "#fffdf4");
            lgrad.addColorStop(0.55, "#f7f1dd");
            lgrad.addColorStop(1, "#ece3c2");
            c.fillStyle = lgrad;
            engine.rr(c, -14, lY, 28, 22, 2);
            c.fill();
            c.strokeStyle = "rgba(90, 58, 24, 0.45)";
            c.lineWidth = 0.8;
            c.stroke();
            /* piega centrale verticale faint */
            c.strokeStyle = "rgba(90, 58, 24, 0.18)";
            c.lineWidth = 0.6;
            c.beginPath();
            c.moveTo(0, lY + 2);
            c.lineTo(0, lY + 20);
            c.stroke();
            /* intestazione "EBARTEX" in dark sopra la lettera (visibile su carta chiara) */
            c.fillStyle = "#3a2a1a";
            c.font = "800 5px 'Segoe UI', system-ui, sans-serif";
            c.textAlign = "center";
            c.textBaseline = "middle";
            c.fillText("EBARTEX", 0, lY + 5);
            /* piccolo simbolo € sotto la scritta */
            c.fillStyle = "#c98f2b";
            c.font = "900 8px 'Segoe UI', system-ui, sans-serif";
            c.fillText("€", 0, lY + 14);
            c.textBaseline = "alphabetic";
            c.restore();
        }
        /* flap superiore: dark + bordo oro, apertura con squama Y + rotazione + luce */
        c.save();
        c.translate(0, hinge);
        c.scale(1, Math.max(0.16, 1 - flapOpen * 0.8));
        c.translate(0, -flapOpen * 7);
        c.rotate(-flapOpen * 0.28);
        c.translate(0, -hinge);
        const flap = c.createLinearGradient(0, hinge - 23, 0, hinge + 4);
        flap.addColorStop(0, "#1a2440");
        flap.addColorStop(0.6, EB_DARK);
        flap.addColorStop(1, "#080b14");
        c.fillStyle = flap;
        c.beginPath();
        c.moveTo(-bw / 2, hinge);
        c.lineTo(0, hinge - 23);
        c.lineTo(bw / 2, hinge);
        c.closePath();
        c.fill();
        c.strokeStyle = EB_GOLD;
        c.lineWidth = 1.3;
        c.stroke();
        /* sottile highlight dorato sul bordo alto del flap */
        c.strokeStyle = "rgba(255, 233, 160, 0.5)";
        c.lineWidth = 0.8;
        c.beginPath();
        c.moveTo(-bw / 2 + 2, hinge - 1);
        c.lineTo(0, hinge - 21);
        c.lineTo(bw / 2 - 2, hinge - 1);
        c.stroke();
        c.restore();
        /* sigillo cera → foil oro Ebartex con "E" embossed */
        if (sealBreak < 0.92) {
            const sealA = 1 - sealBreak;
            const sealS = 1 - sealBreak * 0.75;
            const sy = hinge + 3;
            c.save();
            c.translate(0, sy);
            c.scale(sealS, sealS);
            /* disco oro foil con anello interno */
            const sg = c.createRadialGradient(-2, -2, 1, 0, 0, 9);
            sg.addColorStop(0, "#ffe6a8");
            sg.addColorStop(0.5, EB_GOLD);
            sg.addColorStop(1, EB_GOLD_D);
            c.fillStyle = sg;
            c.beginPath();
            c.arc(0, 0, 8, 0, Math.PI * 2);
            c.fill();
            c.strokeStyle = "rgba(120, 80, 20, " + sealA + ")";
            c.lineWidth = 1;
            c.stroke();
            c.strokeStyle = "rgba(255, 245, 200, " + (0.7 * sealA) + ")";
            c.lineWidth = 0.6;
            c.beginPath();
            c.arc(0, 0, 5.5, 0, Math.PI * 2);
            c.stroke();
            /* "E" embossed scuro + highlight */
            c.fillStyle = "rgba(40, 24, 8, " + sealA + ")";
            c.font = "900 9px 'Segoe UI', system-ui, sans-serif";
            c.textAlign = "center";
            c.textBaseline = "middle";
            c.fillText("E", 0, 0.5);
            c.fillStyle = "rgba(255, 245, 200, " + (0.35 * sealA) + ")";
            c.fillText("E", -0.4, 0.1);
            c.textBaseline = "alphabetic";
            c.restore();
            /* schegge di rottura oro (12 vs 7) */
            if (sealBreak > 0.35) {
                for (let i = 0; i < 12; i++) {
                    const a = (i / 12) * Math.PI * 2 + sealBreak * 2;
                    const dist = sealBreak * (11 + i * 1.1);
                    c.fillStyle = "rgba(243, 199, 106, " + (sealA * 0.85) + ")";
                    c.fillRect(Math.cos(a) * dist - 1.3, sy + Math.sin(a) * dist - 1.3, 2.6, 2.6);
                }
            }
        }
        c.restore();
    };
}
