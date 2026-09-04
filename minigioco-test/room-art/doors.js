/* Bounds delle porte della Sala Tornei, condivisi da rendering e hit-test. */
import { SOCIAL_DOOR, TOUR_DOOR } from "./room-config.js";
import { wallR } from "./room-primitives.js";

export { SOCIAL_DOOR, TOUR_DOOR };

function boundsForDoor({ c0, c1, hTop, hBot }) {
  const topA = wallR(c0, hTop);
  const topB = wallR(c1, hTop);
  const botA = wallR(c0, hBot);
  const botB = wallR(c1, hBot);
  const xs = [topA.x, topB.x, botA.x, botB.x];
  const ys = [topA.y, topB.y, botA.y, botB.y];
  return {
    topA,
    topB,
    botA,
    botB,
    hit: {
      x: Math.min(...xs) - 2,
      y: Math.min(...ys) - 2,
      w: Math.max(...xs) - Math.min(...xs) + 4,
      h: Math.max(...ys) - Math.min(...ys) + 4,
    },
  };
}

export function tourDoorBounds() {
  return boundsForDoor(TOUR_DOOR);
}

export function socialDoorBounds() {
  return boundsForDoor(SOCIAL_DOOR);
}
