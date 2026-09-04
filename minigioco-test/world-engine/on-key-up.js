// Motore Asso World: on key up.


export function installOnKeyUp(engine) {
  engine.onKeyUp = function(e) {
    engine.st.keys.delete(e.code);
};
}
