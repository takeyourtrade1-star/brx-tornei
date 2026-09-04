// Motore Asso World: draw watermark.


export function installDrawWatermark(engine) {
  engine.drawWatermark = function(c2, w, h) {
    const x = w - 14, y = h - 14;
    c2.save();
    c2.fillStyle = "rgba(13,17,28,0.72)";
    engine.rr(c2, x - 124, y - 28, 124, 28, 14);
    c2.fill();
    c2.strokeStyle = "rgba(255,255,255,0.18)";
    c2.lineWidth = 1;
    c2.stroke();
    // wordmark
    c2.fillStyle = "#ffffff";
    c2.font = "900 14px 'Segoe UI', system-ui, sans-serif";
    c2.textAlign = "left";
    c2.textBaseline = "alphabetic";
    c2.fillText("ebartex", x - 112, y - 9);
    // swoosh arancione con punta
    c2.strokeStyle = "#FF7300";
    c2.lineWidth = 2;
    c2.beginPath();
    c2.moveTo(x - 113, y - 6);
    c2.quadraticCurveTo(x - 80, y + 1, x - 52, y - 8);
    c2.stroke();
    c2.fillStyle = "#FF7300";
    c2.beginPath();
    c2.moveTo(x - 56, y - 4);
    c2.lineTo(x - 48, y - 11);
    c2.lineTo(x - 52, y - 2);
    c2.closePath();
    c2.fill();
    // cuore
    c2.beginPath();
    c2.arc(x - 36, y - 17, 4, 0, Math.PI * 2);
    c2.arc(x - 29, y - 17, 4, 0, Math.PI * 2);
    c2.fill();
    c2.beginPath();
    c2.moveTo(x - 40, y - 15.5);
    c2.lineTo(x - 32.5, y - 6);
    c2.lineTo(x - 25, y - 15.5);
    c2.closePath();
    c2.fill();
    c2.restore();
};
}
