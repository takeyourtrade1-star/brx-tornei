import 'server-only';

import { fetchMyReputation, type RecentMatchResult } from '@/lib/data/player-api-client';
import type { RecentOpponent } from '@/types/social';

const MAX_RECENT_OPPONENTS = 8;

function lastPlayedText(iso: string): string {
  const playedAt = Date.parse(iso);
  if (!Number.isFinite(playedAt)) return 'Recente';
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startMs = startOfToday.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (playedAt >= startMs) return 'Oggi';
  if (playedAt >= startMs - day) return 'Ieri';
  return 'Recente';
}

function timeMs(iso: string): number {
  const value = Date.parse(iso);
  return Number.isFinite(value) ? value : 0;
}

function sortNewestFirst(a: RecentMatchResult, b: RecentMatchResult): number {
  return timeMs(b.createdAt) - timeMs(a.createdAt);
}

/** Unici avversari recenti, dal più nuovo, senza sé stessi. */
export async function fetchRecentOpponents(myGamertag?: string | null): Promise<RecentOpponent[]> {
  const reputation = await fetchMyReputation();
  const rows = (reputation.history.length > 0 ? reputation.history : reputation.recent)
    .slice()
    .sort(sortNewestFirst);

  const self = myGamertag?.trim().toLowerCase() ?? '';
  const byTag = new Map<string, RecentOpponent>();

  for (const row of rows) {
    const tag = row.opponentGamertag?.trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (self && key === self) continue;

    const existing = byTag.get(key);
    if (existing) {
      existing.matches += 1;
      continue;
    }
    if (byTag.size >= MAX_RECENT_OPPONENTS) continue;

    byTag.set(key, {
      gamertag: tag,
      lastOutcome: row.outcome,
      lastPlayedText: lastPlayedText(row.createdAt),
      matches: 1,
    });
  }

  return Array.from(byTag.values());
}
