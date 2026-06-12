import type { Match } from '@/types/match';

/** Durata massima partita/torneo in fase demo (minuti). */
export const DEMO_MATCH_DURATION_MINUTES = 55;

export type ActiveMatchPhase = 'in_corso' | 'programmata';

export interface TimeSlot {
  startsAt: Date;
  endsAt: Date;
  /** Etichetta per messaggi d'errore (es. nome torneo). */
  label: string;
}

/** Fine stimata: inizio + durata demo. */
export function computeEndsAt(startsAt: Date, durationMinutes = DEMO_MATCH_DURATION_MINUTES): Date {
  return new Date(startsAt.getTime() + durationMinutes * 60_000);
}

/** Due intervalli [start, end) si sovrappongono? */
export function intervalsOverlap(a: TimeSlot, b: TimeSlot): boolean {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt;
}

/** Classifica una partita attiva in base a startsAt vs ora server. */
export function getActiveMatchPhase(match: Match, now = new Date()): ActiveMatchPhase {
  const startsAt = new Date(match.startsAt);
  return startsAt <= now ? 'in_corso' : 'programmata';
}

/** Slot temporale di una partita per il controllo overlap. */
export function matchToTimeSlot(match: Match): TimeSlot {
  const startsAt = new Date(match.startsAt);
  return {
    startsAt,
    endsAt: new Date(match.endsAt),
    label: match.tournamentLabel,
  };
}

export type EnrollmentCheckResult =
  | { allowed: true }
  | { allowed: false; message: string };

/**
 * Verifica se l'utente può iscriversi a un torneo senza sovrapposizioni.
 * Confronta il nuovo slot con gli impegni già attivi (partite + iscrizioni).
 */
export function canEnrollInTournament(
  existingCommitments: TimeSlot[],
  tournamentStart: Date,
  durationMinutes = DEMO_MATCH_DURATION_MINUTES
): EnrollmentCheckResult {
  const candidate: TimeSlot = {
    startsAt: tournamentStart,
    endsAt: computeEndsAt(tournamentStart, durationMinutes),
    label: '',
  };

  for (const commitment of existingCommitments) {
    if (intervalsOverlap(commitment, candidate)) {
      return {
        allowed: false,
        message: `Non puoi iscriverti: il torneo si sovrappone con "${commitment.label}" già in programma o in corso.`,
      };
    }
  }

  return { allowed: true };
}
