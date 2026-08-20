import 'server-only';

import {
  extractApiError,
  tournamentFetch,
  TournamentApiError,
} from '@/lib/data/tournament-api-client';
import { unwrapApiPayload } from '@/lib/data/tournament-mapper';
import { mapDeckFromApi, mapDeckListFromApi } from '@/lib/data/deck-api-mapper';
import type { Deck, DeckCard } from '@/types/deck';
import type { CreateDeckInput } from '@/lib/validations/deck';
import type { DeckVerificationStatus } from '@/types/match-verification';

export { MAX_DECKS_PER_USER } from '@/lib/deck-limits';

function invalidDeckResponse(): never {
  throw new TournamentApiError(
    'Risposta mazzi non valida',
    502,
    'INVALID_RESPONSE',
  );
}

function mapRequiredDeck(body: unknown): Deck {
  const deck = mapDeckFromApi(unwrapApiPayload<unknown>(body));
  return deck ?? invalidDeckResponse();
}

export async function listDecks(_userId: string): Promise<Deck[]> {
  const { ok, status, body } = await tournamentFetch('/api/v1/decks');
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile caricare i mazzi');
  }
  const decks = mapDeckListFromApi(unwrapApiPayload<unknown>(body));
  return decks ?? invalidDeckResponse();
}

export async function getDeckById(
  _userId: string,
  deckId: string,
): Promise<Deck | null> {
  const { ok, status, body } = await tournamentFetch(
    `/api/v1/decks/${encodeURIComponent(deckId)}`,
  );
  if (status === 404) return null;
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile caricare il mazzo');
  }
  return mapRequiredDeck(body);
}

export async function createDeck(
  _userId: string,
  input: CreateDeckInput,
): Promise<Deck> {
  const { ok, status, body } = await tournamentFetch('/api/v1/decks', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile creare il mazzo');
  }
  return mapRequiredDeck(body);
}

export async function updateDeck(
  _userId: string,
  deckId: string,
  patch: Partial<
    Pick<
      Deck,
      | 'name'
      | 'main'
      | 'side'
      | 'verificationStatus'
      | 'lastVerifiedAt'
      | 'legalityCheckedAt'
      | 'legalityErrors'
    >
  >,
): Promise<Deck | null> {
  const { ok, status, body } = await tournamentFetch(
    `/api/v1/decks/${encodeURIComponent(deckId)}`,
    { method: 'PATCH', body: JSON.stringify(patch) },
  );
  if (status === 404) return null;
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile aggiornare il mazzo');
  }
  return mapRequiredDeck(body);
}

export async function deleteDeck(
  _userId: string,
  deckId: string,
): Promise<boolean> {
  const { ok, status, body } = await tournamentFetch(
    `/api/v1/decks/${encodeURIComponent(deckId)}`,
    { method: 'DELETE' },
  );
  if (status === 404) return false;
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile eliminare il mazzo');
  }
  return true;
}

export async function saveDeckCards(
  userId: string,
  deckId: string,
  main: DeckCard[],
  side: DeckCard[],
): Promise<Deck | null> {
  return updateDeck(userId, deckId, {
    main,
    side,
    verificationStatus: 'declared',
  });
}

export async function saveDeckVerification(
  userId: string,
  deckId: string,
  status: DeckVerificationStatus,
): Promise<Deck | null> {
  return updateDeck(userId, deckId, {
    verificationStatus: status,
    lastVerifiedAt: new Date().toISOString(),
  });
}
