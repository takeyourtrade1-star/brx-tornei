export const STARTER_COSMETIC_COUNT = 3;
export const MATCHES_PER_COSMETIC_UNLOCK = 5;
export const QUALIFYING_MATCH_DURATION_SECONDS = 30 * 60;

function normalizeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

/** Tre opzioni iniziali, poi una nuova ogni cinque partite qualificate. */
export function getUnlockedCosmeticCount(total: number, qualifyingMatches: number): number {
  const normalizedTotal = normalizeCount(total);
  const earned = Math.floor(normalizeCount(qualifyingMatches) / MATCHES_PER_COSMETIC_UNLOCK);
  return Math.min(normalizedTotal, STARTER_COSMETIC_COUNT + earned);
}

export function isCosmeticIndexUnlocked(index: number, qualifyingMatches: number): boolean {
  return index >= 0 && index < getUnlockedCosmeticCount(index + 1, qualifyingMatches);
}

export function getRequiredQualifyingMatches(index: number): number {
  if (index < STARTER_COSMETIC_COUNT) return 0;
  return (index - STARTER_COSMETIC_COUNT + 1) * MATCHES_PER_COSMETIC_UNLOCK;
}
