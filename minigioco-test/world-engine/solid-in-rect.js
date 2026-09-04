// Motore Asso World: solid in rect.


export function installSolidInRect(engine) {
  engine.solidInRect = function(w, r, cv) {
    if (!(w.x >= r.x && w.x <= r.x + r.w && w.y >= r.y && w.y <= r.y + r.h))
        return false;
    if (!cv)
        return true;
    const m = engine.spriteMask(cv);
    if (!m || !m.data)
        return true; // fallback: comportamento a rettangolo
    const px = Math.floor(w.x - r.x);
    const py = Math.floor(w.y - r.y);
    if (px < 0 || py < 0 || px >= m.w || py >= m.h)
        return false;
    return m.data[(py * m.w + px) * 4 + 3] >= engine.HIT_ALPHA;
};
}
