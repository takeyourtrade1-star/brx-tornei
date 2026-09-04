// Motore Asso World: on pointer leave.


export function installOnPointerLeave(engine) {
  engine.onPointerLeave = function() {
    engine.st.hover.tile = null;
    engine.st.hover.obj = null;
};
}
