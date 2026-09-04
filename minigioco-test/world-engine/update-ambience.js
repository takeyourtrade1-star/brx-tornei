// Motore Asso World: update ambience.
import * as dependencies from "./dependencies";

export function updateAmbience(engine, frame) {
    /* — ricontrolla la fase del giorno (ogni 30s, solo Sala Tornei) — */
    if (frame.isTour && engine.st.t > engine.st.phaseCheck) {
        engine.st.phaseCheck = engine.st.t + 30;
        const ph = dependencies.dayPhase();
        if (ph.id !== engine.phase.id) {
            engine.phase = ph;
            engine.bg = dependencies.buildBackground(engine.phase, engine.stats, engine.posters);
            engine.tourData.bg = engine.bg;
        }
    }
    /* — gatto: stati e movimento — */
    /* — pet interaction check (solo Sala Tornei) — */
    if (frame.isTour && !engine.st.petInteraction && engine.st.t > engine.st.nextPetInteraction) {
        engine.st.nextPetInteraction = engine.st.t + 110 + Math.random() * 90; // tra 1.8 e 3.3 minuti
        const catEligible = !engine.st.cat.perch && engine.st.cat.follow === 0 && (engine.st.t - engine.st.cat.lastPet > 6);
        const dogEligible = !engine.st.dog.perch && engine.st.dog.follow === 0 && (engine.st.t - engine.st.dog.lastPet > 6);
        if (catEligible && dogEligible && Math.random() < 0.6) {
            // iniziamo un inseguimento!
            engine.st.petInteraction = {
                type: "chase",
                stage: 0,
                t0: engine.st.t,
                runner: "cat",
                chaser: "dog"
            };
            // Reset normal states and align positions to grid cells
            engine.st.cat.state = "sit";
            engine.st.cat.to = null;
            engine.st.cat.queue = [];
            engine.st.cat.t = 0;
            engine.st.cat.fx = engine.st.cat.from.cx;
            engine.st.cat.fy = engine.st.cat.from.cy;
            engine.st.dog.state = "sit";
            engine.st.dog.to = null;
            engine.st.dog.queue = [];
            engine.st.dog.t = 0;
            engine.st.dog.fx = engine.st.dog.from.cx;
            engine.st.dog.fy = engine.st.dog.from.cy;
        }
    }
}
