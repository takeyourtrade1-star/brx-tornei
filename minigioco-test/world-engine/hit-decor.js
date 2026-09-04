// Motore Asso World: hit decor.


export function installHitDecor(engine) {
  engine.hitDecor = function(sx, sy) {
    const w = engine.unproject(sx, sy);
    if (engine.st.letter && engine.st.letter.phase === "idle" && engine.inRect(w, engine.letterHitRect(engine.st.letter)))
        return { kind: "letter" };
    if (engine.solidInRect(w, engine.turnRect, engine.turnFrames[0] && engine.turnFrames[0].cv))
        return { kind: "music" };
    if (engine.inRect(w, engine.intercomRect))
        return { kind: "intercom" };
    // gatto: cerchio attorno alla sua posizione (anche quando è appollaiata)
    const cp = engine.petFootPoint(engine.st.cat);
    if (Math.abs(w.x - cp.x) < 18 && Math.abs(w.y - (cp.y - 8)) < 16)
        return { kind: "cat" };
    // cane Cookie
    const d_cp = engine.petFootPoint(engine.st.dog);
    if (Math.abs(w.x - d_cp.x) < 22 && Math.abs(w.y - (d_cp.y - 8)) < 20)
        return { kind: "dog" };
    for (const eg of engine.eggs)
        if (eg.cv ? engine.solidInRect(w, eg.rect, eg.cv) : engine.inRect(w, eg.rect))
            return { kind: "egg", egg: eg };
    return null;
};
}
