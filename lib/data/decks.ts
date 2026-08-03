import 'server-only';
import { randomUUID } from 'node:crypto';
import type { Deck, DeckCard } from '@/types/deck';
import type { CreateDeckInput } from '@/lib/validations/deck';
import type { DeckVerificationStatus } from '@/types/match-verification';
import { config } from '@/lib/config';

/**
 * Persistenza mazzi MVP (in-memory per utente).
 * Contratto futuro: GET/POST/PATCH/DELETE /api/v1/tournaments/decks su Tournament Service.
 */
const decksByUser = new Map<string, Map<string, Deck>>();

function requireEphemeralDeckStore(): void {
  if (!config.features.ephemeralDeckMutations) {
    throw new Error('Deck persistence is unavailable');
  }
}

function userDecks(userId: string): Map<string, Deck> {
  let store = decksByUser.get(userId);
  if (!store) {
    store = new Map();
    decksByUser.set(userId, store);
  }
  return store;
}

function generateDeckId(): string {
  return `deck-${randomUUID()}`;
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
  if (!config.features.ephemeralDeckMutations) return [];
  const store = userDecks(userId);
  return [...store.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getDeckById(userId: string, deckId: string): Promise<Deck | null> {
  if (!config.features.ephemeralDeckMutations) return null;
  return userDecks(userId).get(deckId) ?? null;
}

export async function createDeck(userId: string, input: CreateDeckInput): Promise<Deck> {
  requireEphemeralDeckStore();
  const deck = emptyDeck(input);
  userDecks(userId).set(deck.id, deck);
  return deck;
}

export async function updateDeck(
  userId: string,
  deckId: string,
  patch: Partial<Pick<Deck, 'name' | 'main' | 'side' | 'verificationStatus' | 'lastVerifiedAt' | 'legalityCheckedAt' | 'legalityErrors'>>
): Promise<Deck | null> {
  requireEphemeralDeckStore();
  const store = userDecks(userId);
  const existing = store.get(deckId);
  if (!existing) return null;
  const next: Deck = { ...existing, ...patch };
  store.set(deckId, next);
  return next;
}

export async function deleteDeck(userId: string, deckId: string): Promise<boolean> {
  requireEphemeralDeckStore();
  return userDecks(userId).delete(deckId);
}

export async function saveDeckCards(
  userId: string,
  deckId: string,
  main: DeckCard[],
  side: DeckCard[]
): Promise<Deck | null> {
  requireEphemeralDeckStore();
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
  requireEphemeralDeckStore();
  return updateDeck(userId, deckId, {
    verificationStatus: status,
    lastVerifiedAt: new Date().toISOString(),
  });
}
