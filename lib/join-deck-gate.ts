import 'server-only';
import { resolveTrustedDeck } from '@/lib/deck-card-boundary';
import { enforceDeckLegalityRateLimit } from '@/lib/deck-legality-rate-limit';
import { enforceJoinDeckRateLimit } from '@/lib/join-deck-rate-limit';
import { validateDeckLegalityWithScryfall } from '@/lib/deck-legality-with-scryfall';
import { getDeckStructureIssues } from '@/lib/deck-structure';
import { getDeckById, updateDeck } from '@/lib/data/decks';
import type { FormatId } from '@/lib/data/catalog';
import {
  getDeckVerificationPolicy,
  isVerificationRequired,
  normalizeVerificationFlags,
  resolveMatchContextFromInput,
} from '@/types/match-verification';
import type { Tournament } from '@/types/tournament';
import { statusForServerRateLimitError } from '@/lib/security/server-rate-limit';

export type JoinDeckGateResult =
  | { ok: true }
  | { ok: false; error: string };

export function requiresDeclaredDeckForJoin(tournament: Tournament): boolean {
  // La dichiarazione è sempre richiesta: i flag di verifica non fanno parte
  // del contratto storico del Tournament Service e non sono un confine sicuro.
  void tournament;
  return true;
}

export async function assertDeclaredDeckRequirements(
  userId: string,
  input: { deckId: string; format: FormatId; requireScryfall: boolean },
): Promise<JoinDeckGateResult> {
  try {
    await enforceJoinDeckRateLimit(userId);
  } catch (error) {
    return {
      ok: false,
      error: statusForServerRateLimitError(error) === 429
        ? 'Troppi tentativi con il mazzo. Attendi un minuto e riprova.'
        : 'Controllo del mazzo temporaneamente non disponibile.',
    };
  }

  let deck;
  try {
    const storedDeck = await getDeckById(userId, input.deckId);
    if (!storedDeck) return { ok: false, error: 'Mazzo non trovato.' };
    deck = await resolveTrustedDeck(storedDeck);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error
        ? error.message
        : 'Impossibile controllare il mazzo dichiarato.',
    };
  }

  if (deck.formatId !== input.format) {
    return {
      ok: false,
      error: `Il mazzo è per ${deck.formatId}, il tavolo richiede ${input.format}.`,
    };
  }

  const structureIssue = getDeckStructureIssues(deck)[0];
  if (structureIssue) return { ok: false, error: structureIssue.message };

  if (input.requireScryfall) {
    try {
      await enforceDeckLegalityRateLimit(userId);
    } catch (error) {
      return {
        ok: false,
        error: statusForServerRateLimitError(error) === 429
          ? 'Troppe verifiche di legalità. Attendi un minuto e riprova.'
          : 'Verifica di legalità temporaneamente non disponibile.',
      };
    }
    const { legal, issues, deck: enriched } = await validateDeckLegalityWithScryfall(
      deck,
      input.format,
    );
    await updateDeck(userId, input.deckId, {
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

  return { ok: true };
}


export async function assertJoinDeckRequirements(
  userId: string,
  tournament: Tournament,
  deckId: string,
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
  return assertDeclaredDeckRequirements(userId, {
    deckId,
    format: tournament.format,
    requireScryfall: isVerificationRequired(
      policy,
      'scryfallLegality',
      flags.enableScryfallCheck,
    ),
  });
}
