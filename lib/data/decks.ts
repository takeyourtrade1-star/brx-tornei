import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Deck, DeckCard } from '@/types/deck';
import type { CreateDeckInput } from '@/lib/validations/deck';
import type { DeckVerificationStatus } from '@/types/match-verification';

export const MAX_DECKS_PER_USER = 3;

const STORE_PATH = path.join(process.cwd(), '.next', 'decks_store.json');

/**
 * Persistenza mazzi per utente (in-memory + persistenza su disco .next).
 * Contratto futuro: GET/POST/PATCH/DELETE /api/v1/tournaments/decks su Tournament Service.
 */
const decksByUser = new Map<string, Map<string, Deck>>();

function loadDecksFromDisk(): void {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const data = JSON.parse(raw) as Record<string, Deck[]>;
      if (data && typeof data === 'object') {
        decksByUser.clear();
        for (const [userId, userDeckList] of Object.entries(data)) {
          if (Array.isArray(userDeckList)) {
            const map = new Map<string, Deck>();
            for (const d of userDeckList) {
              if (d && typeof d === 'object' && d.id) {
                map.set(d.id, d);
              }
            }
            decksByUser.set(userId, map);
          }
        }
      }
    }
  } catch {
    // ignore parse/read errors
  }
}

function saveDecksToDisk(): void {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const serializable: Record<string, Deck[]> = {};
    for (const [userId, store] of decksByUser.entries()) {
      serializable[userId] = Array.from(store.values());
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(serializable, null, 2), 'utf-8');
  } catch {
    // ignore write errors
  }
}

// Inizializza il caricamento dei mazzi dal disco
loadDecksFromDisk();

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
  const store = userDecks(userId);
  return [...store.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getDeckById(userId: string, deckId: string): Promise<Deck | null> {
  return userDecks(userId).get(deckId) ?? null;
}

export async function createDeck(userId: string, input: CreateDeckInput): Promise<Deck> {
  const store = userDecks(userId);
  if (store.size >= MAX_DECKS_PER_USER) {
    throw new Error(`Hai raggiunto il limite massimo di ${MAX_DECKS_PER_USER} mazzi.`);
  }
  const deck = emptyDeck(input);
  store.set(deck.id, deck);
  saveDecksToDisk();
  return deck;
}

export async function updateDeck(
  userId: string,
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
  >
): Promise<Deck | null> {
  const store = userDecks(userId);
  const existing = store.get(deckId);
  if (!existing) return null;
  const next: Deck = { ...existing, ...patch };
  store.set(deckId, next);
  saveDecksToDisk();
  return next;
}

export async function deleteDeck(userId: string, deckId: string): Promise<boolean> {
  const store = userDecks(userId);
  const removed = store.delete(deckId);
  if (removed) saveDecksToDisk();
  return removed;
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
