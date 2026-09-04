// Motore Asso World: take photo.


export function installTakePhoto(engine) {
  engine.takePhoto = function() {
    if (engine.st.destroyed)
        return;
    engine.st.photoHide = true;
    try {
        engine.render();
        engine.ctx.setTransform(engine.st.view.dpr, 0, 0, engine.st.view.dpr, 0, 0);
        engine.drawWatermark(engine.ctx, engine.st.view.w, engine.st.view.h);
        const url = engine.canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = "ebartex-room.png";
        a.click();
        engine.st.flash = engine.st.t;
        engine.sfx.click();
        engine.showBubble("📸 Scatto salvato!", 2.5);
    }
    catch (err) {
        console.error("[IsoRoomGame] foto non riuscita:", err);
    }
    engine.st.photoHide = false;
};
}
