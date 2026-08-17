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
