import type {
  BestOf,
  BuyIn,
  ConnectionQuality,
  Participant,
  ParticipantDeck,
  Tournament,
  TournamentPhase,
  TournamentStatus,
} from '@/types/tournament';
import type { DeckCard } from '@/types/deck';
import type { FormatId, ModeId } from '@/lib/data/catalog';
import { mapMatchJudgeState } from '@/lib/data/match-judge-mapper';

const VALID_STATUS: TournamentStatus[] = ['in_registrazione', 'iniziata', 'terminata'];
const VALID_BEST_OF: BestOf[] = ['BO1', 'BO3', 'BO5'];
const VALID_BUY_IN: BuyIn[] = ['for_fun', 'micro', 'low', 'mid', 'high'];
const VALID_MATCH_STATUS = ['ongoing', 'finished'] as const;
const VALID_END_REASON = ['leave', 'timeout', 'reported', 'disputed'] as const;
const VALID_RESULT_STATUS = ['claimed', 'settled'] as const;
const VALID_PHASES: TournamentPhase[] = [
  'waiting',
  'accepting',
  'starting',
  'live',
  'finished',
  'cancelled',
];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function pickString(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return undefined;
}

function pickBool(obj: Record<string, unknown>, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'boolean') return v;
  }
  return undefined;
}

function pickNumber(obj: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return undefined;
}

function mapParticipantDeckCard(raw: unknown): DeckCard | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  const id = pickString(obj, 'id');
  const name = pickString(obj, 'name');
  const quantity = pickNumber(obj, 'quantity');
  if (!id || !name || !quantity || !Number.isInteger(quantity) || quantity < 1) return null;
  return {
    id,
    name,
    quantity,
    image: pickString(obj, 'image') ?? null,
    setName: pickString(obj, 'set_name', 'setName'),
    setCode: pickString(obj, 'set_code', 'setCode'),
    rarity: pickString(obj, 'rarity'),
    collectorNumber: pickString(obj, 'collector_number', 'collectorNumber'),
    oracleId: pickString(obj, 'oracle_id', 'oracleId'),
    scryfallId: pickString(obj, 'scryfall_id', 'scryfallId'),
    isCommander: pickBool(obj, 'is_commander', 'isCommander'),
  };
}

function mapParticipantDeckCards(raw: unknown): DeckCard[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map(mapParticipantDeckCard).filter((card): card is DeckCard => card !== null);
}

function mapParticipantDeck(raw: unknown): ParticipantDeck | undefined {
  const obj = asRecord(raw);
  if (!obj) return undefined;
  const name = pickString(obj, 'name');
  if (!name) return undefined;
  const verification = pickString(obj, 'verification_status', 'verificationStatus');
  return {
    id: pickString(obj, 'id'),
    name,
    archetype: pickString(obj, 'archetype', 'archetype_id', 'archetypeId'),
    verified: pickBool(obj, 'verified') ?? verification === 'verified',
    main: mapParticipantDeckCards(obj.main),
    side: mapParticipantDeckCards(obj.side),
  };
}

function pickEnum<T extends string>(
  obj: Record<string, unknown>,
  valid: readonly T[],
  ...keys: string[]
): T | undefined {
  const raw = pickString(obj, ...keys);
  return raw && (valid as readonly string[]).includes(raw) ? (raw as T) : undefined;
}

function mapParticipant(raw: unknown): Participant | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  const id = pickString(obj, 'id', 'user_id');
  const username = pickString(obj, 'username', 'name');
  if (!id || !username) return null;
  const connectionObj = asRecord(obj.connection);
  let connection: ConnectionQuality | undefined;
  if (connectionObj) {
    const level = pickString(connectionObj, 'level');
    const transport = pickString(connectionObj, 'transport');
    if (
      (level === 'good' || level === 'fair' || level === 'poor') &&
      (transport === 'server' || transport === 'direct' || transport === 'relay' || transport === 'unknown')
    ) {
      connection = {
        level,
        transport,
        rttMs: pickNumber(connectionObj, 'rtt_ms', 'rttMs'),
        packetLossPct: pickNumber(connectionObj, 'packet_loss_pct', 'packetLossPct'),
        jitterMs: pickNumber(connectionObj, 'jitter_ms', 'jitterMs'),
        checkedAt: pickString(connectionObj, 'checked_at', 'checkedAt'),
        poorSamples: pickNumber(connectionObj, 'poor_samples', 'poorSamples'),
        lastPoorAt: pickString(connectionObj, 'last_poor_at', 'lastPoorAt'),
      };
    }
  }
  return {
    id,
    username,
    ready: pickBool(obj, 'ready', 'is_ready') ?? false,
    connection,
    deck: mapParticipantDeck(obj.deck),
  };
}

function mapParticipants(raw: unknown): Participant[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(mapParticipant).filter((p): p is Participant => p !== null);
}

function mapPlayerScores(raw: unknown): Record<string, number> | undefined {
  const scores = asRecord(raw);
  if (!scores) return undefined;
  const validScores = Object.entries(scores).filter(
    (entry): entry is [string, number] =>
      typeof entry[1] === 'number' && Number.isInteger(entry[1]) && entry[1] >= 0,
  );
  return validScores.length > 0 ? Object.fromEntries(validScores) : undefined;
}

function mapStatus(raw: unknown): TournamentStatus {
  if (typeof raw === 'string' && VALID_STATUS.includes(raw as TournamentStatus)) {
    return raw as TournamentStatus;
  }
  return 'in_registrazione';
}

function mapBestOf(raw: unknown): BestOf {
  if (typeof raw === 'string' && VALID_BEST_OF.includes(raw as BestOf)) {
    return raw as BestOf;
  }
  return 'BO3';
}

function mapBuyIn(raw: unknown): BuyIn {
  if (typeof raw === 'string' && VALID_BUY_IN.includes(raw as BuyIn)) {
    return raw as BuyIn;
  }
  return 'for_fun';
}

/** Unwrap difensivo: `{ data: T }` oppure payload diretto. */
export function unwrapApiPayload<T>(payload: unknown): T | null {
  const top = asRecord(payload);
  if (!top) return null;
  const inner = top.data;
  if (inner !== undefined && inner !== null) return inner as T;
  return payload as T;
}

/** Mappa un oggetto torneo dall'API (snake_case o camelCase) al tipo frontend. */
export function mapTournamentFromApi(raw: unknown): Tournament | null {
  const obj = asRecord(raw);
  if (!obj) return null;

  const id = pickString(obj, 'id');
  const format = pickString(obj, 'format') as FormatId | undefined;
  const mode = pickString(obj, 'mode') as ModeId | undefined;
  const createdAt = pickString(obj, 'created_at', 'createdAt');
  if (!id || !format || !mode || !createdAt) return null;

  const match = asRecord(obj.match);
  const matchId = pickString(obj, 'match_id', 'matchId') ?? pickString(match ?? {}, 'id');
  const matchWebcamSessionId =
    pickString(obj, 'match_webcam_session_id', 'matchWebcamSessionId') ??
    pickString(match ?? {}, 'webcam_session_id', 'webcamSessionId');
  const signalingRoleRaw = pickString(obj, 'signaling_role', 'signalingRole');
  const signalingRole =
    signalingRoleRaw === 'host' || signalingRoleRaw === 'guest'
      ? signalingRoleRaw
      : undefined;

  return {
    id,
    format,
    mode,
    buyIn: mapBuyIn(obj.buy_in ?? obj.buyIn),
    bestOf: mapBestOf(obj.best_of ?? obj.bestOf),
    status: mapStatus(obj.status),
    maxPlayers: typeof obj.max_players === 'number' ? obj.max_players : (obj.maxPlayers as number) ?? 2,
    participants: mapParticipants(obj.participants),
    createdAt,
    updatedAt: pickString(obj, 'updated_at', 'updatedAt') ?? createdAt,
    serverTime: pickString(obj, 'server_time', 'serverTime'),
    phase: pickEnum(obj, VALID_PHASES, 'phase'),
    phaseVersion: pickString(obj, 'phase_version', 'phaseVersion'),
    phaseStartedAt: pickString(obj, 'phase_started_at', 'phaseStartedAt'),
    acceptanceOpensAt: pickString(obj, 'acceptance_opens_at', 'acceptanceOpensAt'),
    readyDeadline: pickString(obj, 'ready_deadline', 'readyDeadline'),
    startsAt: pickString(obj, 'starts_at', 'startsAt'),
    isPrivate: pickBool(obj, 'is_private', 'isPrivate'),
    isTournament: pickBool(obj, 'is_tournament', 'isTournament'),
    enableScryfallCheck: pickBool(
      obj,
      'enable_scryfall_check',
      'enableScryfallCheck',
    ),
    enablePhysicalVerification: pickBool(
      obj,
      'enable_physical_verification',
      'enablePhysicalVerification',
    ),
    withFriend: pickBool(obj, 'with_friend', 'withFriend') ?? false,
    webcamSessionId: pickString(obj, 'webcam_session_id', 'webcamSessionId'),
    matchId,
    matchWebcamSessionId,
    signalingRole,
    createdById: pickString(obj, 'created_by', 'createdBy', 'created_by_id', 'createdById'),
    matchStatus: pickEnum(obj, VALID_MATCH_STATUS, 'match_status', 'matchStatus'),
    endReason: pickEnum(obj, VALID_END_REASON, 'end_reason', 'endReason'),
    winnerUserId: pickString(obj, 'winner_user_id', 'winnerUserId'),
    scoreByPlayerId: mapPlayerScores(obj.player_scores ?? obj.scoreByPlayerId),
    disconnectedUserId: pickString(obj, 'disconnected_user_id', 'disconnectedUserId'),
    graceDeadline: pickString(obj, 'grace_deadline', 'graceDeadline'),
    resultStatus: pickEnum(obj, VALID_RESULT_STATUS, 'result_status', 'resultStatus'),
    resultClaimDeadline: pickString(obj, 'result_claim_deadline', 'resultClaimDeadline'),
    resultClaimedBy: pickString(obj, 'result_claimed_by', 'resultClaimedBy'),
    resultClaimedWinner: pickString(obj, 'result_claimed_winner', 'resultClaimedWinner'),
    resultRound: pickNumber(obj, 'result_round', 'resultRound'),
    resultReselectionRequired:
      pickBool(obj, 'result_reselection_required', 'resultReselectionRequired') ?? false,
    judge: mapMatchJudgeState(obj.judge ?? obj.judge_state ?? obj.judgeState),
  };
}

export function mapTournamentListFromApi(payload: unknown): Tournament[] {
  const data = unwrapApiPayload<unknown>(payload);
  const list = Array.isArray(data) ? data : Array.isArray(payload) ? payload : [];
  return list.map(mapTournamentFromApi).filter((t): t is Tournament => t !== null);
}

export function mapTournamentFromApiPayload(payload: unknown): Tournament | null {
  const data = unwrapApiPayload<unknown>(payload);
  return mapTournamentFromApi(data ?? payload);
}
