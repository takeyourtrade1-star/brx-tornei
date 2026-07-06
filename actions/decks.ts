'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import {
  createDeck,
  deleteDeck,
  getDeckById,
  listDecks,
  saveDeckCards,
  saveDeckVerification,
  updateDeck,
} from '@/lib/data/decks';
import { validateDeckLegalityWithScryfall } from '@/lib/deck-legality-with-scryfall';
import { deckDiffIsClean, diffDeckVsScanned } from '@/lib/deck-verification';
import { createDeckSchema } from '@/lib/validations/deck';
import {
  saveVerificationSchema,
  updateDeckSchema,
  validateLegalitySchema,
} from '@/lib/validations/deck-actions';
import type { Deck } from '@/types/deck';
import type { DeckLegalityIssue } from '@/types/card-legality';

export async function listDecksAction(): Promise<{ decks: Deck[] } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessione scaduta.' };
  const decks = await listDecks(session.user.id);
  return { decks };
}

export async function createDeckAction(
  input: unknown
): Promise<{ deck: Deck } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessione scaduta.' };

  const parsed = createDeckSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dati non validi.' };
  }

  const deck = await createDeck(session.user.id, parsed.data);
  revalidatePath('/mazzi');
  return { deck };
}

export async function updateDeckAction(
  input: unknown
): Promise<{ deck: Deck } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessione scaduta.' };

  const parsed = updateDeckSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dati non validi.' };
  }

  const { deckId, main, side } = parsed.data;
  const deck =
    main !== undefined || side !== undefined
      ? await saveDeckCards(session.user.id, deckId, main ?? [], side ?? [])
      : await getDeckById(session.user.id, deckId);

  if (!deck) return { error: 'Mazzo non trovato.' };

  revalidatePath('/mazzi');
  return { deck };
}

export async function deleteDeckAction(deckId: string): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessione scaduta.' };

  const removed = await deleteDeck(session.user.id, deckId);
  if (!removed) return { error: 'Mazzo non trovato.' };

  revalidatePath('/mazzi');
  return { ok: true };
}

export async function validateDeckLegalityAction(
  input: unknown
): Promise<
  { legal: boolean; issues: DeckLegalityIssue[]; deck?: Deck } | { error: string }
> {
  const session = await getSession();
  if (!session) return { error: 'Sessione scaduta.' };

  const parsed = validateLegalitySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dati non validi.' };
  }

  let deck: Deck | null = null;
  if (parsed.data.deckId) {
    deck = await getDeckById(session.user.id, parsed.data.deckId);
    if (!deck) return { error: 'Mazzo non trovato.' };
  } else if (parsed.data.deckSnapshot) {
    deck = {
      id: 'snapshot',
      name: 'Snapshot',
      formatId: parsed.data.deckSnapshot.formatId as Deck['formatId'],
      archetypeId: 'aggro',
      main: parsed.data.deckSnapshot.main,
      side: parsed.data.deckSnapshot.side,
      createdAt: new Date().toISOString(),
      verificationStatus: 'none',
    };
  } else {
    return { error: 'Specificare deckId o deckSnapshot.' };
  }

  const formatId = (parsed.data.formatId ?? deck.formatId) as Deck['formatId'];
  const result = await validateDeckLegalityWithScryfall(deck, formatId);

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
}

export async function saveDeckVerificationAction(
  input: unknown
): Promise<{ deck: Deck; clean: boolean } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessione scaduta.' };

  const parsed = saveVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dati non validi.' };
  }

  const deck = await getDeckById(session.user.id, parsed.data.deckId);
  if (!deck) return { error: 'Mazzo non trovato.' };

  let status = parsed.data.status;
  if (parsed.data.scannedEntries) {
    const issues = diffDeckVsScanned(deck.main, deck.side, parsed.data.scannedEntries);
    status = deckDiffIsClean(issues) ? 'verified' : 'mismatch';
  }

  const updated = await saveDeckVerification(session.user.id, parsed.data.deckId, status);
  if (!updated) return { error: 'Impossibile salvare la verifica.' };

  revalidatePath('/mazzi');
  return { deck: updated, clean: status === 'verified' };
}
