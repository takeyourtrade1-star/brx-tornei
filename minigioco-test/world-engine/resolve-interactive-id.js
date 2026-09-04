// Motore Asso World: resolve interactive id.
import * as dependencies from "./dependencies";

export function installResolveInteractiveId(engine) {
  engine.resolveInteractiveId = function(value) {
    const requested = String(value || "");
    if (engine.inter[requested])
        return requested;
    for (const [id, definition] of Object.entries(engine.inter)) {
        if (dependencies.getInteractionModalId(id, definition) === requested)
            return id;
    }
    return null;
};
}
