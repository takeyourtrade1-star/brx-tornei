// Motore Asso World: pointer pos.


export function installPointerPos(engine) {
  engine.pointerPos = function(e) {
    const r = engine.canvas.getBoundingClientRect();
    return { x: e.clientX - (r.left || 0), y: e.clientY - (r.top || 0) };
};
}
