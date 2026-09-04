// Motore Asso World: spawn letter.
import * as dependencies from "./dependencies";

export function installSpawnLetter(engine) {
  engine.spawnLetter = function() {
    if (engine.integrationMode === "site" || engine.st.letter || engine.st.modal || engine.st.lock || engine.st.cinematic || engine.st.hype)
        return;
    const reward = dependencies.mockCreditReward();
    engine.st.letter = {
        phase: "slide",
        t0: engine.st.t,
        x: engine.LETTER_START.x,
        y: engine.LETTER_START.y,
        rot: -0.14,
        tournamentName: dependencies.MOCK_TOURNAMENT_NAMES[Math.floor(Math.random() * dependencies.MOCK_TOURNAMENT_NAMES.length)],
        creditsBefore: reward.creditsBefore,
        creditsEarned: reward.creditsEarned,
        creditsAfter: reward.creditsAfter,
        lastCreditTick: reward.creditsBefore,
    };
    engine.sfx.whoosh();
    engine.showBubble("📬 Qualcuno ha lasciato una lettera alla porta!", 4.5);
};
}
