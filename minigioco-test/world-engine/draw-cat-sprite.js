// Motore Asso World: draw cat sprite.


export function installDrawCatSprite(engine) {
  engine.drawCatSprite = function() {
    const cat = engine.st.cat;
    const pt = engine.petFootPoint(cat);
    const cxp = pt.x, cyp = pt.y;
    const moving = !!cat.to;
    const perched = !!cat.perch;
    // ombra a terra
    const shadowAlpha = perched ? 0.16 : 0.22;
    engine.wctx.fillStyle = "rgba(25,22,40," + shadowAlpha + ")";
    engine.wctx.beginPath();
    engine.wctx.ellipse(cxp, cyp + 4, perched ? 7.5 : 9, perched ? 2.6 : 3.5, 0, 0, Math.PI * 2);
    engine.wctx.fill();
    const flip = cat.dir === "nw" || cat.dir === "sw" ? 2 : 0;
    let fr;
    if (moving)
        fr = engine.catSp.walk[flip + (Math.floor(engine.st.t * 7) % 2)];
    else if (cat.state === "sleep")
        fr = engine.catSp.sleep[flip + (Math.floor(engine.st.t * 0.9) % 2)];
    else
        fr = engine.catSp.sit[flip + (Math.floor(engine.st.t * 1.4) % 2)];
    const bob = moving ? -Math.abs(Math.sin(cat.t * Math.PI * 2)) * 1 : 0;
    const perchBob = perched ? Math.sin((engine.st.t - cat.perch.t0) * 8) * Math.max(0, 1 - (engine.st.t - cat.perch.t0) * 2) : 0;
    engine.wctx.drawImage(fr.cv, Math.round(cxp - fr.feet.x), Math.round(cyp + 4 - fr.feet.y + bob + perchBob));
};
}
