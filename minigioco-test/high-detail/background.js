import { drawTournamentBackground } from "./background-tournament.js";
import { drawPiazzaBackground } from "./background-piazza.js";
import { drawArcadeBackground } from "./background-arcade.js";

export function drawDetailedBackground(ctx, room = "tournament", phase = {}) {
  if (room === "piazza") return drawPiazzaBackground(ctx, phase);
  if (room === "arcade") return drawArcadeBackground(ctx, phase);
  return drawTournamentBackground(ctx, phase);
}
