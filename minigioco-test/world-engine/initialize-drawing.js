// Motore Asso World: initialize drawing.


export function initializeDrawing(engine) {
    engine.rr = (c, x, y, w, h, r) => {
        const rad = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2)); // mai negativo né oltre metà lato
        c.beginPath();
        c.moveTo(x + rad, y);
        c.arcTo(x + w, y, x + w, y + h, rad);
        c.arcTo(x + w, y + h, x, y + h, rad);
        c.arcTo(x, y + h, x, y, rad);
        c.arcTo(x, y, x + w, y, rad);
        c.closePath();
    };
    engine.drawShadowCard = (c, card) => {
        c.save();
        c.translate(card.x, card.y);
        c.rotate(card.rot);
        c.scale(card.scale, card.scale);
        // Ombra/glow soffusa viola dietro la carta
        const cardGlow = c.createRadialGradient(0, 0, 2, 0, 0, 16);
        cardGlow.addColorStop(0, "rgba(128, 0, 255, 0.35)");
        cardGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        c.fillStyle = cardGlow;
        c.beginPath();
        c.arc(0, 0, 16, 0, Math.PI * 2);
        c.fill();
        // Corpo carta
        c.fillStyle = "#120a1c"; // sfondo scuro esoterico
        engine.rr(c, -11, -17, 22, 34, 3);
        c.fill();
        // Bordo colorato
        c.strokeStyle = card.col;
        c.lineWidth = 1;
        engine.rr(c, -10, -16, 20, 32, 2.5);
        c.stroke();
        // Logo "E" o "BRX"
        c.fillStyle = card.col;
        c.textAlign = "center";
        c.textBaseline = "middle";
        if (card.type === "ebartex") {
            c.font = "bold 9px 'Segoe UI', system-ui, sans-serif";
            c.fillText("E", 0, -1);
        }
        else {
            c.font = "bold 6px 'Press Start 2P', monospace";
            c.fillText("BRX", 0, 0);
        }
        // Piccoli dettagli decorativi retro carta
        c.fillStyle = "rgba(255, 255, 255, 0.12)";
        c.fillRect(-7, -13, 14, 1);
        c.fillRect(-7, 12, 14, 1);
        c.restore();
    };
}
