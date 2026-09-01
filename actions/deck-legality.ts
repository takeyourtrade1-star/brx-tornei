'use server';

import { getSession } from '@/lib/auth/session';
import {
  resolveTrustedDeck,
  resolveTrustedDeckCards,
} from '@/lib/deck-card-boundary';
import { validateDeckLegalityWithScryfall } from '@/lib/deck-legality-with-scryfall';
import { enforceDeckLegalityRateLimit } from '@/lib/deck-legality-rate-limit';
import { getDeckById, updateDeck } from '@/lib/data/decks';
import { statusForServerRateLimitError } from '@/lib/security/server-rate-limit';
import { validateLegalitySchema } from '@/lib/validations/deck-actions';
import type { DeckLegalityIssue } from '@/types/card-legality';
import type { Deck } from '@/types/deck';

type LegalityActionResult =
  | { legal: boolean; issues: DeckLegalityIssue[]; deck?: Deck }
  | { error: string };

function actionError(error: unknown, fallback: string): { error: string } {
  return { error: error instanceof Error ? error.message : fallback };
}

export async function validateDeckLegalityAction(
  input: unknown,
): Promise<LegalityActionResult> {
  const session = await getSession();
  if (!session) return { error: 'Sessione scaduta.' };

  const parsed = validateLegalitySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dati non validi.' };
  }

  try {
    await enforceDeckLegalityRateLimit(session.user.id);
  } catch (error) {
    return {
      error: statusForServerRateLimitError(error) === 429
        ? 'Troppe verifiche di legalità. Attendi un minuto e riprova.'
        : 'Verifica di legalità temporaneamente non disponibile.',
    };
  }

  let deck: Deck | null = null;
  if (parsed.data.deckId) {
    try {
      const stored = await getDeckById(session.user.id, parsed.data.deckId);
      deck = stored ? await resolveTrustedDeck(stored) : null;
    } catch (error) {
      return actionError(error, 'Impossibile caricare il mazzo.');
    }
  } else if (parsed.data.deckSnapshot) {
    try {
      const [main, side] = await Promise.all([
        resolveTrustedDeckCards(parsed.data.deckSnapshot.main),
        resolveTrustedDeckCards(parsed.data.deckSnapshot.side),
      ]);
      deck = {
        id: 'snapshot',
        name: 'Snapshot',
        formatId: parsed.data.deckSnapshot.formatId,
        archetypeId: 'aggro',
        main,
        side,
        createdAt: new Date().toISOString(),
        verificationStatus: 'none',
      };
    } catch (error) {
      return actionError(error, 'Impossibile verificare le carte del mazzo.');
    }
  }
  if (!deck) return { error: 'Mazzo non trovato.' };

  try {
    const result = await validateDeckLegalityWithScryfall(
      deck,
      parsed.data.deckId ? deck.formatId : (parsed.data.formatId ?? deck.formatId),
    );
    if (parsed.data.deckId) {
      await updateDeck(session.user.id, parsed.data.deckId, {
        main: result.deck.main,
        side: result.deck.side,
        legalityCheckedAt: new Date().toISOString(),
        legalityErrors: result.issues,
      });
      return { legal: result.legal, issues: result.issues, deck: result.deck };
    }
    return { legal: result.legal, issues: result.issues };
  } catch (error) {
    return actionError(error, 'Impossibile verificare la legalità del mazzo.');
  }
}
