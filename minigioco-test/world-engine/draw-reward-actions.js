// Motore Asso World: draw reward actions.
import * as dependencies from "./dependencies";

export function drawRewardActions(engine, frame) {
    /* — footer info + bottone (solo a sequenza conclusa) — */
    if (frame.showActions) {
        frame.c.fillStyle = "rgba(255,255,255,0.42)";
        frame.c.font = "500 11px 'Segoe UI', system-ui, sans-serif";
        frame.c.fillText("Saldo aggiornato: " + dependencies.formatCredits(frame.creditsAfter), 0, frame.top + 210);
        /* riga link: "Credito pronto sul portale Ebartex." con "Ebartex" arancione cliccabile */
        const footY = frame.top + 230;
        const footFont = "600 11px 'Segoe UI', system-ui, sans-serif";
        frame.c.font = footFont;
        const prefix = "Credito pronto sul portale ";
        const linkText = "Ebartex";
        const suffix = ".";
        const wPrefix = frame.c.measureText(prefix).width;
        const wLink = frame.c.measureText(linkText).width;
        const wSuffix = frame.c.measureText(suffix).width;
        const wTotal = wPrefix + wLink + wSuffix;
        const startX = -wTotal / 2;
        const prevAlign = frame.c.textAlign;
        frame.c.textAlign = "left";
        /* prefisso bianco */
        frame.c.fillStyle = "rgba(255,255,255,0.78)";
        frame.c.fillText(prefix, startX, footY);
        /* link "Ebartex" arancione + sottolineatura (più forte se hover) */
        const linkX = startX + wPrefix;
        frame.c.fillStyle = dependencies.EB_LINK_ORANGE;
        frame.c.fillText(linkText, linkX, footY);
        frame.c.strokeStyle = dependencies.EB_LINK_ORANGE;
        frame.c.lineWidth = frame.opts.ebartexHover ? 1.4 : 0.9;
        frame.c.globalAlpha = frame.opts.ebartexHover ? 1 : 0.7;
        frame.c.beginPath();
        frame.c.moveTo(linkX, footY + 3);
        frame.c.lineTo(linkX + wLink, footY + 3);
        frame.c.stroke();
        frame.c.globalAlpha = 1;
        /* suffix */
        frame.c.fillStyle = "rgba(255,255,255,0.78)";
        frame.c.fillText(suffix, linkX + wLink, footY);
        frame.c.textAlign = prevAlign;
        const btnTop = frame.btnCy - frame.btnH / 2;
        const bg = frame.c.createLinearGradient(0, btnTop, 0, btnTop + frame.btnH);
        bg.addColorStop(0, "#ff7a32");
        bg.addColorStop(1, "#c83935");
        frame.c.fillStyle = bg;
        engine.rr(frame.c, -frame.btnW / 2, btnTop, frame.btnW, frame.btnH, 10);
        frame.c.fill();
        frame.c.strokeStyle = "rgba(255,255,255,0.72)";
        frame.c.lineWidth = 1.2;
        frame.c.stroke();
        frame.c.fillStyle = "#ffffff";
        frame.c.font = "900 13px 'Segoe UI', system-ui, sans-serif";
        frame.c.fillText("CHIUDI", 0, frame.btnCy);
    }
    frame.c.textAlign = "left";
    frame.c.textBaseline = "alphabetic";
    frame.c.restore();
}
