import type { Tournament, TournamentPhase } from '@/types/tournament';

export interface TournamentRealtimeParticipant {
  id: string;
  username: string;
  ready: boolean;
}

/** Hint minimo inviato sul canale realtime autenticato del tavolo. */
export interface TournamentRealtimeHint {
  tournamentId: string;
  phase: TournamentPhase;
  phaseVersion?: string | null;
  phaseStartedAt?: string | null;
  acceptanceOpensAt?: string | null;
  readyDeadline?: string | null;
  startsAt?: string | null;
  serverTime?: string | null;
  matchId?: string | null;
  participants?: TournamentRealtimeParticipant[];
}

const PHASES: readonly TournamentPhase[] = [
  'waiting',
  'accepting',
  'starting',
  'live',
  'finished',
  'cancelled',
];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function timestampValue(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
  }
  const valueAsString = stringValue(value);
  if (!valueAsString || !Number.isFinite(Date.parse(valueAsString))) return undefined;
  return valueAsString;
}

function optionalTimestampValue(
  record: Record<string, unknown>,
  key: string,
): string | null | undefined {
  if (!(key in record)) return undefined;
  if (record[key] === null) return null;
  return timestampValue(record[key]);
}

function optionalStringValue(
  record: Record<string, unknown>,
  key: string,
): string | null | undefined {
  if (!(key in record)) return undefined;
  if (record[key] === null) return null;
  return stringValue(record[key]);
}

function mapParticipants(value: unknown): TournamentRealtimeParticipant[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const participants = value.flatMap((item): TournamentRealtimeParticipant[] => {
    const participant = asRecord(item);
    const id = stringValue(participant?.id) ?? stringValue(participant?.user_id);
    const username = stringValue(participant?.username) ?? stringValue(participant?.name);
    if (!id || !username || typeof participant?.ready !== 'boolean') return [];
    return [{ id, username, ready: participant.ready }];
  });
  return participants;
}

/** Valida e riduce un frame realtime; i campi sconosciuti vengono ignorati. */
export function parseTournamentRealtimeHint(
  value: unknown,
  expectedTournamentId: string,
): TournamentRealtimeHint | null {
  const record = asRecord(value);
  if (
    !record ||
    record.event !== 'tournament-state-changed' ||
    (typeof record.tournament_id === 'string' && record.tournament_id !== expectedTournamentId)
  ) {
    return null;
  }
  const phase = stringValue(record.phase);
  if (!phase || !(PHASES as readonly string[]).includes(phase)) return null;

  const hint: TournamentRealtimeHint = {
    tournamentId: expectedTournamentId,
    phase: phase as TournamentPhase,
    phaseVersion: optionalStringValue(record, 'phase_version'),
    phaseStartedAt: optionalTimestampValue(record, 'phase_started_at'),
    acceptanceOpensAt: optionalTimestampValue(record, 'acceptance_opens_at'),
    readyDeadline: optionalTimestampValue(record, 'ready_deadline'),
    startsAt: optionalTimestampValue(record, 'starts_at'),
    serverTime: optionalTimestampValue(record, 'server_time'),
    matchId: optionalStringValue(record, 'match_id'),
    participants: mapParticipants(record.participants),
  };
  return hint;
}

/** Applica un hint senza perdere deck, connessioni o altri dati RSC. */
export function mergeTournamentWithHint(
  tournament: Tournament,
  hint: TournamentRealtimeHint | undefined,
): Tournament {
  if (!hint || hint.tournamentId !== tournament.id) return tournament;
  // PostgreSQL resta autorevole: con uno snapshot RSC più recente dell'evento
  // (WS assente, evento perso) l'hint stantio non deve far regredire la
  // timeline di fase né le deadline condivise.
  const snapshotVersion = Date.parse(tournament.phaseVersion ?? '');
  const hintVersion = Date.parse(hint.phaseVersion ?? '');
  if (
    Number.isFinite(snapshotVersion) &&
    Number.isFinite(hintVersion) &&
    hintVersion < snapshotVersion
  ) {
    return tournament;
  }
  const currentById = new Map(tournament.participants.map((participant) => [participant.id, participant]));
  const participants = hint.participants
    ? hint.participants.map((participant) => ({
        ...currentById.get(participant.id),
        ...participant,
      }))
    : tournament.participants;
  const merged: Tournament = {
    ...tournament,
    participants,
    phase: hint.phase,
    phaseVersion: mergeOptionalString(hint.phaseVersion, tournament.phaseVersion),
    phaseStartedAt: mergeOptionalString(hint.phaseStartedAt, tournament.phaseStartedAt),
    acceptanceOpensAt: mergeOptionalString(
      hint.acceptanceOpensAt,
      tournament.acceptanceOpensAt,
    ),
    readyDeadline: mergeOptionalString(hint.readyDeadline, tournament.readyDeadline),
    startsAt: mergeOptionalString(hint.startsAt, tournament.startsAt),
    serverTime: mergeOptionalString(hint.serverTime, tournament.serverTime),
    matchId: mergeOptionalString(hint.matchId, tournament.matchId),
  };
  return merged;
}

function mergeOptionalString(
  next: string | null | undefined,
  current: string | undefined,
): string | undefined {
  return next === undefined ? current : next ?? undefined;
}
