// Motore Asso World: update.
import { updateTransition } from "./update-transition";
import { updateMovement } from "./update-movement";
import { updateAmbience } from "./update-ambience";
import { updatePetInteractions } from "./update-pet-interactions";
import { updateWorldEvents } from "./update-world-events";
import { updateTournamentAlert } from "./update-tournament-alert";

export function installUpdate(engine) {
  engine.update = function(dt) {
    const frame = { dt: dt };
    if (updateTransition(engine, frame)) return;
    if (updateMovement(engine, frame)) return;
    if (updateAmbience(engine, frame)) return;
    if (updatePetInteractions(engine, frame)) return;
    if (updateWorldEvents(engine, frame)) return;
    if (updateTournamentAlert(engine, frame)) return;
  };
}
