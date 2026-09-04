// Motore Asso World: tut say.


export function installTutSay(engine) {
  engine.tutSay = function(text) {
    engine.showBubble(text, 999);
    if (engine.st.bubble)
        engine.st.bubble.sticky = true;
    engine.tutCaption(text);
};
}
