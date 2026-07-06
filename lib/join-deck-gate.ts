import 'server-only';
import { validateDeckLegalityWithScryfall } from '@/lib/deck-legality-with-scryfall';
import { getDeckById, updateDeck } from '@/lib/data/decks';
import {
  getDeckVerificationPolicy,
  isVerificationRequired,
  normalizeVerificationFlags,
  resolveMatchContextFromInput,
} from '@/types/match-verification';
import type { Tournament } from '@/types/tournament';

const VERIFICATION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type JoinDeckGateResult =
  | { ok: true }
  | { ok: false; error: string };

export async function assertJoinDeckRequirements(
  userId: string,
  tournament: Tournament,
  deckId: string
): Promise<JoinDeckGateResult> {
  const flags = normalizeVerificationFlags({
    isTournament: tournament.isTournament,
    isPrivate: tournament.isPrivate,
    enableScryfallCheck: tournament.enableScryfallCheck,
    enablePhysicalVerification: tournament.enablePhysicalVerification,
  });

  const context = resolveMatchContextFromInput({
    isTournament: flags.isTournament,
    isPrivate: flags.isPrivate,
  });
  const policy = getDeckVerificationPolicy(context);

  const deck = await getDeckById(userId, deckId);
  if (!deck) {
    return { ok: false, error: 'Mazzo non trovato.' };
  }

  if (deck.formatId !== tournament.format) {
    return {
      ok: false,
      error: `Il mazzo è per ${deck.formatId}, il torneo richiede ${tournament.format}.`,
    };
  }

  if (isVerificationRequired(policy, 'scryfallLegality', flags.enableScryfallCheck)) {
    const { legal, issues, deck: enriched } = await validateDeckLegalityWithScryfall(
      deck,
      tournament.format
    );
    await updateDeck(userId, deckId, {
      main: enriched.main,
      side: enriched.side,
      legalityCheckedAt: new Date().toISOString(),
      legalityErrors: issues,
    });
    if (!legal) {
      return {
        ok: false,
        error: issues[0]?.message ?? 'Mazzo non legale per questo formato.',
      };
    }
  }

  if (isVerificationRequired(policy, 'physicalScan', flags.enablePhysicalVerification)) {
    if (deck.verificationStatus !== 'verified') {
      return {
        ok: false,
        error: 'Verifica fisica obbligatoria: completa la scansione del mazzo in /mazzi.',
      };
    }
    if (deck.lastVerifiedAt) {
      const age = Date.now() - new Date(deck.lastVerifiedAt).getTime();
      if (age > VERIFICATION_MAX_AGE_MS) {
        return {
          ok: false,
          error: 'Verifica fisica scaduta (>24h). Ripeti la scansione del mazzo.',
        };
      }
    }
  }

  return { ok: true };
}
