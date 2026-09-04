// Motore Asso World: update spettro.


export function installUpdateSpettro(engine) {
  engine.updateSpettro = function() {
    const av = engine.st.av;
    if (!engine.st.spet)
        engine.st.spet = { fx: av.fx, fy: av.fy };
    const DIRV = { se: { x: 1, y: 0 }, nw: { x: -1, y: 0 }, sw: { x: 0, y: 1 }, ne: { x: 0, y: -1 } };
    const dest = av.to || (av.queue && av.queue.length ? av.queue[av.queue.length - 1] : null);
    let lx, ly, lead;
    if (dest && (Math.abs(dest.cx - av.fx) > 0.05 || Math.abs(dest.cy - av.fy) > 0.05)) {
        const dx = dest.cx - av.fx, dy = dest.cy - av.fy, len = Math.hypot(dx, dy) || 1;
        lx = av.fx + (dx / len) * 1.6; // ~1,6 caselle davanti, verso la meta
        ly = av.fy + (dy / len) * 1.6;
        lead = 0.11; // insegue spedito per restare davanti
    }
    else {
        const d = DIRV[av.dir] || { x: 0, y: -1 };
        lx = av.fx + d.x * 1.05; // da fermo aleggia poco davanti (non incollato)
        ly = av.fy + d.y * 1.05;
        lead = 0.05; // avvicinamento morbido
    }
    const pfx = engine.st.spet.fx, pfy = engine.st.spet.fy;
    engine.st.spet.fx += (lx - engine.st.spet.fx) * lead;
    engine.st.spet.fy += (ly - engine.st.spet.fy) * lead;
    engine.st.spet.vx = (engine.st.spet.vx || 0) * 0.82 + (engine.st.spet.fx - pfx) * 0.18;
    engine.st.spet.vy = (engine.st.spet.vy || 0) * 0.82 + (engine.st.spet.fy - pfy) * 0.18;
    return engine.st.spet;
};
}
