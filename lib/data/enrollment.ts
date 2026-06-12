import 'server-only';

import {
  canEnrollInTournament,
  computeEndsAt,
  DEMO_MATCH_DURATION_MINUTES,
  matchToTimeSlot,
  type TimeSlot,
} from '@/lib/matches/timing';
import { getFormat, getMode } from '@/lib/data/catalog';
import { getUserBlockingMatches } from '@/lib/data/matches';
import {
  enrollParticipant,
  getTournamentById,
  getUserEnrolledTournaments,
} from '@/lib/data/tournaments';
import type { Participant } from '@/types/tournament';

export interface EnrollmentResult {
  error?: string;
  success?: boolean;
}

function tournamentLabel(format: string, mode: string, bestOf: string): string {
  const fmt = getFormat(format as Parameters<typeof getFormat>[0]);
  const m = getMode(mode as Parameters<typeof getMode>[0]);
  return `${fmt?.name ?? format} · ${m?.name ?? mode} ${bestOf}`;
}

function tournamentToTimeSlot(tournament: {
  format: string;
  mode: string;
  bestOf: string;
  startsAt: string;
}): TimeSlot {
  const startsAt = new Date(tournament.startsAt);
  return {
    startsAt,
    endsAt: computeEndsAt(startsAt, DEMO_MATCH_DURATION_MINUTES),
    label: tournamentLabel(tournament.format, tournament.mode, tournament.bestOf),
  };
}

/** Iscrizione a un torneo con controllo anti-sovrapposizione. */
export async function enrollUserInTournament(
  userId: string,
  tournamentId: string,
  participant: Participant
): Promise<EnrollmentResult> {
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    return { error: 'Torneo non trovato.' };
  }
  if (tournament.status !== 'in_registrazione') {
    return { error: 'Le iscrizioni per questo torneo sono chiuse.' };
  }
  if (tournament.participants.some((p) => p.id === userId)) {
    return { error: 'Sei già iscritto a questo torneo.' };
  }
  if (tournament.participants.length >= tournament.maxPlayers) {
    return { error: 'Il torneo è al completo.' };
  }

  const [blockingMatches, enrolledTournaments] = await Promise.all([
    getUserBlockingMatches(userId),
    getUserEnrolledTournaments(userId),
  ]);
  const slots: TimeSlot[] = [
    ...blockingMatches.map(matchToTimeSlot),
    ...enrolledTournaments.map(tournamentToTimeSlot),
  ];

  const check = canEnrollInTournament(slots, new Date(tournament.startsAt));
  if (!check.allowed) {
    return { error: check.message };
  }

  const enrolled = await enrollParticipant(tournamentId, participant);
  if (!enrolled) {
    return { error: 'Impossibile completare l\'iscrizione. Riprova.' };
  }

  return { success: true };
}
