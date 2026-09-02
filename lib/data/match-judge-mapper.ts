import type {
  MatchJudgeKind,
  MatchJudgeState,
  MatchJudgeTurn,
  MatchJudgeTurnStatus,
} from '@/types/tournament';

const MAX_TURNS = 20;
const MAX_STEPS = 3;
const MAX_RULE_REFS = 2;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function pickString(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function pickNumber(obj: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'number' && Number.isInteger(value) && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function stringList(value: unknown, max: number): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, max);
  return items.length ? items : undefined;
}

function mapKind(value: unknown): MatchJudgeKind | undefined {
  return value === 'ruling' || value === 'clarification' ? value : undefined;
}

function mapTurnStatus(value: unknown): MatchJudgeTurnStatus {
  if (value === 'processing') return 'processing';
  if (value === 'failed') return 'failed';
  return 'completed';
}

function unwrap(value: unknown): Record<string, unknown> | null {
  const outer = asRecord(value);
  if (!outer) return null;
  const data = asRecord(outer.data);
  return data ?? outer;
}

function structuredRecord(obj: Record<string, unknown>): Record<string, unknown> {
  return asRecord(obj.structured) ?? obj;
}

export function mapMatchJudgeTurn(raw: unknown, index = 0): MatchJudgeTurn | null {
  const obj = unwrap(raw);
  if (!obj) return null;
  const id = pickString(obj, 'id', 'request_id', 'requestId');
  const question = pickString(obj, 'question');
  if (!id || !question) return null;

  const structured = structuredRecord(obj);
  const kind = mapKind(obj.kind ?? structured.kind);
  const steps = stringList(obj.steps ?? structured.steps, MAX_STEPS);
  const ruleRefs = stringList(
    obj.rule_refs ?? obj.ruleRefs ?? structured.rule_refs ?? structured.ruleRefs,
    MAX_RULE_REFS,
  );
  return {
    id,
    sequence: Math.max(1, pickNumber(obj, 'sequence') ?? index + 1),
    askedByUserId: pickString(obj, 'asked_by_user_id', 'askedByUserId') ?? '',
    question: question.slice(0, 1000),
    status: mapTurnStatus(obj.status),
    reply: (
      pickString(obj, 'reply', 'error', 'message', 'detail', 'reason') ??
      pickString(structured, 'reply', 'error', 'message', 'detail', 'reason')
    )?.slice(0, 8000),
    kind,
    verdict: pickString(obj, 'verdict') ?? pickString(structured, 'verdict'),
    steps,
    ruleRefs,
    rulesVersion: pickString(obj, 'rules_version', 'rulesVersion') ??
      pickString(structured, 'rules_version', 'rulesVersion'),
    errorCode:
      pickString(obj, 'error_code', 'errorCode', 'code') ??
      pickString(structured, 'error_code', 'errorCode', 'code'),
    createdAt: pickString(obj, 'created_at', 'createdAt') ?? '',
    completedAt: pickString(obj, 'completed_at', 'completedAt'),
  };
}

/** Mappa difensivamente il campo opzionale `judge` incluso nello snapshot torneo. */
export function mapMatchJudgeState(raw: unknown): MatchJudgeState | undefined {
  const obj = unwrap(raw);
  if (!obj) return undefined;
  const candidate = asRecord(obj.judge ?? obj.judge_state ?? obj.judgeState) ?? obj;
  const rawTurns = Array.isArray(candidate.turns) ? candidate.turns : [];
  const turns = rawTurns
    .slice(-MAX_TURNS)
    .map(mapMatchJudgeTurn)
    .filter((turn): turn is MatchJudgeTurn => turn !== null);
  const status = candidate.status === 'processing' || candidate.status === 'failed'
    ? candidate.status
    : turns.some((turn) => turn.status === 'processing')
      ? 'processing'
      : 'idle';
  return { status, turns };
}
