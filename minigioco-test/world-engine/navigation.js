import { ROOM_DOORS, ROOM_IDS, ROOM_INTERACTIVES } from "./config.js";
import { findPath, inGrid, tkey } from "./math.js";

function tile(value) {
  if (Array.isArray(value)) return { cx: Number(value[0]), cy: Number(value[1]) };
  return { cx: Number(value && value.cx), cy: Number(value && value.cy) };
}

function validTile(value) {
  return Number.isInteger(value.cx) && Number.isInteger(value.cy) && inGrid(value.cx, value.cy);
}

function originOf(value) {
  const candidate = value && value.to ? value.to : value && value.from ? value.from : value;
  return tile(candidate);
}

/** Sceglie l'approccio percorribile piu vicino senza mutare lo stato avatar. */
export function findNearestApproach(position, approach, blocked, pathfinder = findPath) {
  const start = originOf(position);
  if (!validTile(start) || !Array.isArray(approach)) return null;
  const cells = blocked instanceof Set ? blocked : new Set();
  let best = null;
  approach.forEach((candidate, index) => {
    const goal = tile(candidate);
    if (!validTile(goal)) return;
    const path = pathfinder(start, goal, cells);
    if (path === null) return;
    const score = path.length * 1000 + index;
    if (!best || score < best.score) best = { goal, path, score };
  });
  return best ? { goal: best.goal, path: best.path } : null;
}

export function planInteractivePath({ room, id, position, blocked, interactives, pathfinder }) {
  const catalog = interactives || ROOM_INTERACTIVES[room];
  const definition = catalog && catalog[id];
  if (!definition) return null;
  const plan = findNearestApproach(position, definition.approach, blocked, pathfinder);
  if (!plan) return null;
  return { room, id, definition, goal: plan.goal, path: plan.path };
}

export function getInteractionModalId(id, definition) {
  return (definition && definition.modalId) || id;
}

export function isTournamentChairInteraction(room, id) {
  return room === "tournament" && id === "pc";
}

export function getRoomDoorId(room, targetRoom) {
  return ROOM_DOORS[room] && ROOM_DOORS[room][targetRoom] || null;
}

/** Trova il percorso tra stanze usando soltanto porte dichiarate dal layout. */
export function findRoomRoute(startRoom, targetRoom, doors = ROOM_DOORS) {
  if (!ROOM_IDS.includes(startRoom) || !ROOM_IDS.includes(targetRoom)) return null;
  if (startRoom === targetRoom) return [startRoom];
  const queue = [[startRoom]];
  const visited = new Set([startRoom]);
  while (queue.length) {
    const route = queue.shift();
    const current = route[route.length - 1];
    for (const nextRoom of Object.keys(doors[current] || {})) {
      if (visited.has(nextRoom)) continue;
      const nextRoute = [...route, nextRoom];
      if (nextRoom === targetRoom) return nextRoute;
      visited.add(nextRoom);
      queue.push(nextRoute);
    }
  }
  return null;
}

/**
 * Adapter per il core legacy: imposta solo queue/pending e lascia al core il
 * cambio stanza o l'apertura modale quando l'avatar arriva a destinazione.
 */
export function createWorldNavigation({
  getRoom,
  getPosition,
  getBlocked,
  getInteractives,
  setQueue,
  setPending,
  onArrive,
  pathfinder = findPath,
}) {
  const plan = (id) => planInteractivePath({
    room: getRoom(),
    id,
    position: getPosition(),
    blocked: getBlocked(),
    interactives: getInteractives && getInteractives(),
    pathfinder,
  });

  function interact(id) {
    const next = plan(id);
    if (!next) return null;
    if (next.path.length === 0) {
      if (typeof onArrive === "function") onArrive(next);
      return next;
    }
    setQueue(next.path);
    if (typeof setPending === "function") setPending(next);
    return next;
  }

  function navigateTo(targetRoom) {
    const route = findRoomRoute(getRoom(), targetRoom);
    if (!route || route.length < 2) return null;
    const doorId = getRoomDoorId(route[0], route[1]);
    const next = doorId ? interact(doorId) : null;
    return next ? { ...next, roomRoute: route } : null;
  }

  return { plan, interact, navigateTo, getInteractionModalId };
}

export { tkey };
