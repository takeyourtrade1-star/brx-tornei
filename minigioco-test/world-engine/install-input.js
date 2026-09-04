import { installPointerPos } from "./pointer-pos";
import { installWakeAfk } from "./wake-afk";
import { installOnPointerDown } from "./on-pointer-down";
import { installOnPointerMove } from "./on-pointer-move";
import { installOnPointerLeave } from "./on-pointer-leave";
import { installOnKeyDown } from "./on-key-down";
import { installOnKeyUp } from "./on-key-up";
import { installResize } from "./resize";
import { installScheduleFrame } from "./schedule-frame";
import { installLoop } from "./loop";

export function installInput(engine) {
  installPointerPos(engine);
  installWakeAfk(engine);
  installOnPointerDown(engine);
  installOnPointerMove(engine);
  installOnPointerLeave(engine);
  installOnKeyDown(engine);
  installOnKeyUp(engine);
  installResize(engine);
  installScheduleFrame(engine);
  installLoop(engine);
}
