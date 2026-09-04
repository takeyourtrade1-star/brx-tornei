function readPosition(value) {
  const source = value && value.position ? value.position : value;
  const x = Number(source && source.x);
  const y = Number(source && source.y);
  if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) return null;
  return { x, y };
}

function sameTile(position, candidate) {
  return Boolean(candidate)
    && Number(candidate.cx) === position.x
    && Number(candidate.cy) === position.y;
}

/**
 * Decide se un aggiornamento remoto e una correzione reale o l'echo di un
 * movimento gia previsto dal core. Non muta queue/to/from.
 */
export function shouldApplyLocalPosition(current, value) {
  const position = readPosition(value);
  if (!position) return false;
  const avatar = current && current.av ? current.av : current || {};
  const route = [
    avatar.from,
    avatar.to,
    ...(Array.isArray(avatar.queue) ? avatar.queue : []),
    ...(Array.isArray(avatar.localEchoes) ? avatar.localEchoes : []),
  ];
  return !route.some((candidate) => sameTile(position, candidate));
}

function guarded(isDestroyed, callback, fallback) {
  return (...args) => {
    if (typeof isDestroyed === "function" && isDestroyed()) return fallback;
    return typeof callback === "function" ? callback(...args) : fallback;
  };
}

/** Bridge stabile per l'entry React: il core legacy resta proprietario dello
 * stato, mentre il parent riceve un set minimo di azioni nominato. */
export function createWorldApiBridge({
  isDestroyed,
  navigateTo,
  interact,
  openWardrobe,
  setPaused,
  setStats,
  setQuality,
}) {
  return {
    navigateTo: guarded(isDestroyed, navigateTo, null),
    interact: guarded(isDestroyed, interact, null),
    openWardrobe: guarded(isDestroyed, openWardrobe, null),
    setPaused: guarded(isDestroyed, setPaused, undefined),
    setStats: guarded(isDestroyed, setStats, undefined),
    setQuality: guarded(isDestroyed, setQuality, undefined),
  };
}
