// Motore Asso World: shift step.


export function installShiftStep(engine) {
  engine.shiftStep = function() {
    const av = engine.st.av;
    av.seated = false; // alzandosi dalla sedia
    av.to = av.queue.shift();
    const dx = av.to.cx - av.from.cx, dy = av.to.cy - av.from.cy;
    av.dir = dx === 1 ? "se" : dx === -1 ? "nw" : dy === 1 ? "sw" : "ne";
};
}
