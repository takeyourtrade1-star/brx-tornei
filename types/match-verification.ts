import type { ModeId } from '@/lib/data/catalog';
import type { DeckLegalityIssue } from '@/types/card-legality';

export type MatchContext = 'friendly' | 'public' | 'tournament';

export type VerificationLevel = 'off' | 'optional' | 'required';

export interface DeckVerificationPolicy {
  scryfallLegality: VerificationLevel;
  physicalScan: VerificationLevel;
}

export interface TournamentVerificationFlags {
  isTournament: boolean;
  enableScryfallCheck: boolean;
  enablePhysicalVerification: boolean;
}

/** Deriva policy da contesto + flag utente. */
export function resolveMatchContextFromInput(input: {
  isTournament: boolean;
  isPrivate: boolean;
}): MatchContext {
  if (input.isTournament) return 'tournament';
  return input.isPrivate ? 'friendly' : 'public';
}

export function getDeckVerificationPolicy(context: MatchContext): DeckVerificationPolicy {
  switch (context) {
    case 'friendly':
      return { scryfallLegality: 'optional', physicalScan: 'optional' };
    case 'public':
      return { scryfallLegality: 'optional', physicalScan: 'optional' };
    case 'tournament':
      return { scryfallLegality: 'required', physicalScan: 'required' };
    default: {
      const _exhaustive: never = context;
      return _exhaustive;
    }
  }
}

export function normalizeVerificationFlags(input: {
  isTournament?: boolean;
  isPrivate?: boolean;
  enableScryfallCheck?: boolean;
  enablePhysicalVerification?: boolean;
}): TournamentVerificationFlags & { isPrivate: boolean } {
  const isTournament = Boolean(input.isTournament);
  const isPrivate = Boolean(input.isPrivate);
  if (isTournament) {
    return {
      isTournament: true,
      isPrivate,
      enableScryfallCheck: true,
      enablePhysicalVerification: true,
    };
  }
  return {
    isTournament: false,
    isPrivate,
    enableScryfallCheck: Boolean(input.enableScryfallCheck),
    enablePhysicalVerification: Boolean(input.enablePhysicalVerification),
  };
}

export function isVerificationRequired(
  policy: DeckVerificationPolicy,
  kind: keyof DeckVerificationPolicy,
  enabled: boolean
): boolean {
  const level = policy[kind];
  if (level === 'required') return true;
  if (level === 'optional') return enabled;
  return false;
}

export type DeckVerificationStatus =
  | 'none'
  | 'declared'
  | 'scanned'
  | 'verified'
  | 'mismatch';

export interface DeckVerificationAttempt {
  deckId: string;
  userId: string;
  status: DeckVerificationStatus;
  issues: DeckLegalityIssue[];
  createdAt: string;
}
