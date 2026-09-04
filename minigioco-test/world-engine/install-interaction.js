import { installSpriteMask } from "./sprite-mask";
import { installSolidInRect } from "./solid-in-rect";
import { installChangeRoom } from "./change-room";
import { installStartInteract } from "./start-interact";
import { installWalkToTile } from "./walk-to-tile";
import { installClickObject } from "./click-object";
import { installResolveInteractiveId } from "./resolve-interactive-id";
import { installInteract } from "./interact";
import { installNavigateTo } from "./navigate-to";
import { installTeleportInteract } from "./teleport-interact";
import { installOpenMirror } from "./open-mirror";
import { installHitObject } from "./hit-object";
import { installHitDecor } from "./hit-decor";

export function installInteraction(engine) {
  installSpriteMask(engine);
  installSolidInRect(engine);
  installChangeRoom(engine);
  installStartInteract(engine);
  installWalkToTile(engine);
  installClickObject(engine);
  installResolveInteractiveId(engine);
  installInteract(engine);
  installNavigateTo(engine);
  installTeleportInteract(engine);
  installOpenMirror(engine);
  installHitObject(engine);
  installHitDecor(engine);
}
