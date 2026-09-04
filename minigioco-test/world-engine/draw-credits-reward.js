// Motore Asso World: draw credits reward.
import { drawRewardCard } from "./draw-reward-card";
import { drawRewardActions } from "./draw-reward-actions";

export function installDrawCreditsReward(engine) {
  engine.drawCreditsReward = function(c, dx, dy, tournamentName, creditsBefore, creditsAfter, progress, uiScale = 1, animT = 0, showActions = false, opts = {}) {
    const frame = { c: c, dx: dx, dy: dy, tournamentName: tournamentName, creditsBefore: creditsBefore, creditsAfter: creditsAfter, progress: progress, uiScale: uiScale, animT: animT, showActions: showActions, opts: opts };
    if (drawRewardCard(engine, frame)) return;
    if (drawRewardActions(engine, frame)) return;
  };
}
