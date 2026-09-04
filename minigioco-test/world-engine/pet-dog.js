// Motore Asso World: pet dog.


export function installPetDog(engine) {
  engine.petDog = function() {
    const dog = engine.st.dog;
    engine.sfx.pant();
    const cp = engine.petFootPoint(dog);
    engine.spawnFx("heart", cp.x, cp.y - 8, 3);
    if (dog.state === "sleep") {
        dog.state = "sit";
        dog.until = engine.st.t + 4;
    }
    dog.pets++;
    let isPendingChair = false;
    if (!dog.perch && !dog.to) {
        dog.pendingChairAt = engine.st.t + 1.5;
        isPendingChair = true;
    }
    if (dog.pets % 3 === 0) {
        if (!dog.forceChair && !isPendingChair) {
            dog.follow = 6;
            engine.sfx.bark();
            engine.showBubble("Cookie ti segue scodinzolando! 🐶", 2.6);
        }
    }
};
}
