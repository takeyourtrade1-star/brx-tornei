import 'server-only';
import type { Deck, DeckCard } from '@/types/deck';
import type { CreateDeckInput } from '@/lib/validations/deck';
import type { DeckVerificationStatus } from '@/types/match-verification';

/**
 * Persistenza mazzi MVP (in-memory per utente).
 * Contratto futuro: GET/POST/PATCH/DELETE /api/v1/tournaments/decks su Tournament Service.
 */
const decksByUser = new Map<string, Map<string, Deck>>();

function userDecks(userId: string): Map<string, Deck> {
  let store = decksByUser.get(userId);
  if (!store) {
    store = new Map();
    decksByUser.set(userId, store);
  }
  return store;
}

function generateDeckId(): string {
  return `deck-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyDeck(input: CreateDeckInput): Deck {
  return {
    id: generateDeckId(),
    name: input.name,
    formatId: input.formatId,
    archetypeId: input.archetypeId,
    main: [],
    side: [],
    createdAt: new Date().toISOString(),
    verificationStatus: 'none',
  };
}

export async function listDecks(userId: string): Promise<Deck[]> {
  const store = userDecks(userId);
  return [...store.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getDeckById(userId: string, deckId: string): Promise<Deck | null> {
  return userDecks(userId).get(deckId) ?? null;
}

export async function createDeck(userId: string, input: CreateDeckInput): Promise<Deck> {
  const deck = emptyDeck(input);
  userDecks(userId).set(deck.id, deck);
  return deck;
}

export async function updateDeck(
  userId: string,
  deckId: string,
  patch: Partial<Pick<Deck, 'name' | 'main' | 'side' | 'verificationStatus' | 'lastVerifiedAt' | 'legalityCheckedAt' | 'legalityErrors'>>
): Promise<Deck | null> {
  const store = userDecks(userId);
  const existing = store.get(deckId);
  if (!existing) return null;
  const next: Deck = { ...existing, ...patch };
  store.set(deckId, next);
  return next;
}

export async function deleteDeck(userId: string, deckId: string): Promise<boolean> {
  return userDecks(userId).delete(deckId);
}

export async function saveDeckCards(
  userId: string,
  deckId: string,
  main: DeckCard[],
  side: DeckCard[]
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
  status: DeckVerificationStatus
): Promise<Deck | null> {
  return updateDeck(userId, deckId, {
    verificationStatus: status,
    lastVerifiedAt: new Date().toISOString(),
  });
}
