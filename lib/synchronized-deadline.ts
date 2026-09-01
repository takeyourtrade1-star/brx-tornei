/** Remaining duration from two timestamps produced by the same backend clock. */
export function synchronizedRemainingMs(
  deadline?: string | null,
  serverTime?: string | null,
): number | null {
  if (!deadline || !serverTime) return null;
  const deadlineMs = Date.parse(deadline);
  const serverTimeMs = Date.parse(serverTime);
  if (!Number.isFinite(deadlineMs) || !Number.isFinite(serverTimeMs)) return null;
  return Math.max(0, deadlineMs - serverTimeMs);
}

/** Istante locale corrispondente a un timestamp del server. */
export function synchronizedLocalTimestampMs(
  timestamp?: string | null,
  serverTime?: string | null,
  localNowMs = Date.now(),
): number | null {
  if (!timestamp || !serverTime) return null;
  const timestampMs = Date.parse(timestamp);
  const serverTimeMs = Date.parse(serverTime);
  if (!Number.isFinite(timestampMs) || !Number.isFinite(serverTimeMs)) return null;
  return localNowMs + timestampMs - serverTimeMs;
}
