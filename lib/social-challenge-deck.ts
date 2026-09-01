import 'server-only';

import { createTournament, joinTournament, leaveTournament } from '@/lib/data/tournaments';
import type { FormatId } from '@/lib/data/catalog';
import type { Tournament } from '@/types/tournament';

interface ChallengeSeatInput {
  userId: string;
  username: string;
  deckId: string;
}

export async function attachChallengeDeck(
  tableId: string,
  seat: ChallengeSeatInput,
): Promise<Tournament> {
  const result = await joinTournament(tableId, {
    id: seat.userId,
    username: seat.username,
  }, seat.deckId);
  return result.tournament;
}

export async function createChallengeTableWithDeck(input: ChallengeSeatInput & {
  format: FormatId;
  bestOf: 'BO1' | 'BO3' | 'BO5';
}): Promise<Tournament> {
  let createdId: string | null = null;
  try {
    const tournament = await createTournament({
      format: input.format,
      mode: 'heads-up',
      bestOf: input.bestOf,
      isPrivate: false,
      withFriend: true,
      isTournament: false,
      enableScryfallCheck: false,
      enablePhysicalVerification: false,
    }, { id: input.userId, username: input.username });
    createdId = tournament.id;
    return await attachChallengeDeck(tournament.id, input);
  } catch (error) {
    if (createdId) await leaveTournament(createdId).catch(() => {});
    throw error;
  }
}
