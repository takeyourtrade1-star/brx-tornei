// Motore Asso World: draw dog sprite.


export function installDrawDogSprite(engine) {
  engine.drawDogSprite = function() {
    const dog = engine.st.dog;
    const pt = engine.petFootPoint(dog);
    const cxp = pt.x, cyp = pt.y;
    const moving = !!dog.to;
    const lift = dog.perch ? dog.perch.lift : 0;
    // ombra a terra
    const shadowAlpha = lift > 0 ? 0.12 : 0.22;
    engine.wctx.fillStyle = "rgba(25,22,40," + shadowAlpha + ")";
    engine.wctx.beginPath();
    engine.wctx.ellipse(cxp, cyp + 4, lift > 0 ? 6.5 : 9, lift > 0 ? 2.5 : 3.5, 0, 0, Math.PI * 2);
    engine.wctx.fill();
    const flip = dog.dir === "nw" || dog.dir === "sw" ? 2 : 0;
    let fr;
    if (moving)
        fr = engine.dogSp.walk[flip + (Math.floor(engine.st.t * 7) % 2)];
    else if (dog.state === "sleep")
        fr = engine.dogSp.sleep[flip + (Math.floor(engine.st.t * 0.9) % 2)];
    else
        fr = engine.dogSp.sit[flip + (Math.floor(engine.st.t * 1.4) % 2)];
    const bob = moving ? -Math.abs(Math.sin(dog.t * Math.PI * 2)) * 1 : 0;
    engine.wctx.drawImage(fr.cv, Math.round(cxp - fr.feet.x), Math.round(cyp + 4 - fr.feet.y + bob - lift));
};
}
