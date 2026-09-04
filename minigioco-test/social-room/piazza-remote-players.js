/**
 * Stato/interpolazione dei giocatori remoti della Sala Piazza.
 * La presentazione canvas vive in piazza-remote-player-presentation.js.
 */

import { parseAssoWorldLook } from "../../lib/asso-world-look";
import {
  SOCIAL_ROOM_BOUNDS,
  SOCIAL_ROOM_SPAWN,
  normalizeGamertag,
  normalizePeerId,
} from "./social-room-protocol";
import {
  getRemotePlayerRenderOptions,
  normalizeRemoteBubble,
} from "./piazza-remote-player-presentation.js";

export {
  drawRemotePlayer,
  formatRemoteChatLines,
  getRemotePlayerRenderOptions,
  isRemotePlayerMoving,
  normalizeRemoteBubble,
} from "./piazza-remote-player-presentation.js";

const MAX_REMOTE_QUEUE = 24;
const MAX_DELTA_SECONDS = 0.05;
const REMOTE_SPEED = 3.8;
const WALK_PHASE_RATE = 6;
const TILE_EPSILON = 0.02;
const avatarCaches = new WeakMap();

/** Parser condiviso con il profilo: il fallback è deciso dal contratto canonico. */
export function parseFriendLook(avatarId) {
  return parseAssoWorldLook(avatarId);
}

export function clampRemoteDelta(dt, maxDelta = MAX_DELTA_SECONDS) {
  if (!Number.isFinite(dt) || dt <= 0) return 0;
  const limit = Number.isFinite(maxDelta) && maxDelta > 0 ? maxDelta : MAX_DELTA_SECONDS;
  return Math.min(dt, limit);
}

function readTile(position) {
  const x = position && position.x;
  const y = position && position.y;
  if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) return null;
  if (x < SOCIAL_ROOM_BOUNDS.minX || x > SOCIAL_ROOM_BOUNDS.maxX
    || y < SOCIAL_ROOM_BOUNDS.minY || y > SOCIAL_ROOM_BOUNDS.maxY) return null;
  return { cx: x, cy: y };
}

function spawnTile() {
  return { cx: SOCIAL_ROOM_SPAWN.x, cy: SOCIAL_ROOM_SPAWN.y };
}

function readTrail(value) {
  if (!Array.isArray(value)) return { steps: [], maxSequence: 0 };
  const seen = new Set();
  const steps = value.map((step) => {
    const position = readTile(step && step.position);
    const sequence = step && step.sequence;
    if (!position || !Number.isSafeInteger(sequence) || sequence < 1 || seen.has(sequence)) return null;
    seen.add(sequence);
    return { sequence, reset: step.reset === true, ...position };
  }).filter(Boolean).sort((left, right) => left.sequence - right.sequence);
  return { steps, maxSequence: steps.reduce((max, step) => Math.max(max, step.sequence), 0) };
}

function cachedAvatar(buildAvatar, lookKey, look) {
  if (typeof buildAvatar !== "function") return null;
  let cache = avatarCaches.get(buildAvatar);
  if (!cache) {
    cache = new Map();
    avatarCaches.set(buildAvatar, cache);
  }
  if (cache.has(lookKey)) return cache.get(lookKey);
  try {
    const avatar = buildAvatar(look);
    cache.set(lookKey, avatar);
    return avatar;
  } catch {
    return null;
  }
}

function enqueueStep(rp, target) {
  const last = rp.queue[rp.queue.length - 1] || rp.nextStep;
  if (last && last.cx === target.cx && last.cy === target.cy) return;
  rp.queue.push(target);
  if (rp.queue.length > MAX_REMOTE_QUEUE) rp.queue.splice(0, rp.queue.length - MAX_REMOTE_QUEUE);
}

function applyTrail(rp, trail) {
  for (const step of trail.steps) {
    if (step.sequence <= (rp.lastMovementSequence || 0)) continue;
    const queued = rp.queue[rp.queue.length - 1] || rp.nextStep;
    const origin = queued || { cx: rp.tx, cy: rp.ty };
    const contiguous = Math.abs(origin.cx - step.cx) + Math.abs(origin.cy - step.cy) === 1;
    if (step.reset || !contiguous) {
      rp.queue = [];
      rp.nextStep = null;
      rp.fx = step.cx;
      rp.fy = step.cy;
    } else if (origin.cx !== step.cx || origin.cy !== step.cy) {
      enqueueStep(rp, { cx: step.cx, cy: step.cy });
    }
    rp.tx = step.cx;
    rp.ty = step.cy;
    rp.lastMovementSequence = step.sequence;
  }
}

export function syncRemotePlayers(remoteMap, playerList, buildAvatar, options = {}) {
  const nowMs = getRemotePlayerRenderOptions(options).nowMs;
  const activeIds = new Set();
  const list = Array.isArray(playerList) ? playerList : [];
  for (const player of list) {
    if (!player || typeof player !== "object" || player.isSelf) continue;
    const peerId = normalizePeerId(player.peerId);
    if (!peerId) continue;
    activeIds.add(peerId);
    const look = parseFriendLook(player.avatarId);
    const lookKey = "look:" + look.hair + ":" + look.outfit;
    const trail = readTrail(player.movementTrail);
    const latestTrailTile = trail.steps[trail.steps.length - 1];
    const tile = readTile(player.position) || latestTrailTile || spawnTile();
    let rp = remoteMap.get(peerId);
    if (!rp) {
      rp = {
        peerId,
        gamertag: normalizeGamertag(player.gamertag),
        lookKey,
        avatar: cachedAvatar(buildAvatar, lookKey, look),
        fx: tile.cx,
        fy: tile.cy,
        tx: tile.cx,
        ty: tile.cy,
        dir: "se",
        wt: 0,
        queue: [],
        nextStep: null,
        lastMovementSequence: trail.maxSequence,
        bubble: normalizeRemoteBubble(player.bubble, nowMs),
      };
      remoteMap.set(peerId, rp);
      continue;
    }
    rp.gamertag = normalizeGamertag(player.gamertag);
    if (rp.lookKey !== lookKey) {
      rp.lookKey = lookKey;
      rp.avatar = cachedAvatar(buildAvatar, lookKey, look);
    }
    if (!Array.isArray(rp.queue)) rp.queue = [];
    applyTrail(rp, trail);
    rp.bubble = normalizeRemoteBubble(player.bubble, nowMs);
  }
  for (const id of Array.from(remoteMap.keys())) {
    if (!activeIds.has(id)) remoteMap.delete(id);
  }
}

function snapOneTile(rp) {
  if (!rp.nextStep && rp.queue.length) rp.nextStep = rp.queue.shift();
  const target = rp.nextStep || { cx: rp.tx, cy: rp.ty };
  rp.fx = target.cx;
  rp.fy = target.cy;
  if (rp.nextStep) rp.nextStep = rp.queue.length ? rp.queue.shift() : null;
  rp.wt = 0;
}

export function tickRemotePlayers(remoteMap, dt, options = {}) {
  const settings = getRemotePlayerRenderOptions(options);
  if (settings.inactive) return;
  const delta = clampRemoteDelta(dt);
  if (!settings.reducedMotion && delta === 0) return;
  for (const rp of remoteMap.values()) {
    if (!rp || !Number.isFinite(rp.fx) || !Number.isFinite(rp.fy)) continue;
    if (!Array.isArray(rp.queue)) rp.queue = [];
    if (settings.reducedMotion) {
      snapOneTile(rp);
      continue;
    }
    if (!rp.nextStep && rp.queue.length) rp.nextStep = rp.queue.shift();
    const target = rp.nextStep || { cx: rp.tx, cy: rp.ty };
    const dx = target.cx - rp.fx;
    const dy = target.cy - rp.fy;
    const distance = Math.hypot(dx, dy);
    if (!Number.isFinite(distance)) continue;
    if (distance > TILE_EPSILON && delta > 0) {
      rp.dir = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "se" : "nw") : (dy >= 0 ? "sw" : "ne");
      const amount = Math.min(distance, delta * REMOTE_SPEED);
      rp.fx += (dx / distance) * amount;
      rp.fy += (dy / distance) * amount;
      rp.wt = (Number.isFinite(rp.wt) ? rp.wt : 0) + delta * WALK_PHASE_RATE;
    } else if (distance <= TILE_EPSILON) {
      rp.fx = target.cx;
      rp.fy = target.cy;
      if (rp.nextStep) rp.nextStep = rp.queue.length ? rp.queue.shift() : null;
      if (!rp.nextStep) rp.wt = 0;
    }
  }
}
