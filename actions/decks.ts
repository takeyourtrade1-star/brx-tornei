'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
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
import { TournamentApiError } from '@/lib/data/tournament-api-client';
import { validateDeckLegalityWithScryfall } from '@/lib/deck-legality-with-scryfall';
import { getDeckStructureIssues } from '@/lib/deck-structure';
import { deckDiffIsClean, diffDeckVsScanned } from '@/lib/deck-verification';
import { createDeckSchema } from '@/lib/validations/deck';
import * as deckActionSchemas from '@/lib/validations/deck-actions';
import { PLAYMAT_PREFERENCE_COOKIE } from '@/lib/playmat-preference';
import type { Deck } from '@/types/deck';
import type { DeckLegalityIssue } from '@/types/card-legality';

function deckActionError(error: unknown, fallback: string): { error: string } {
  if (error instanceof TournamentApiError) {
    const messages: Record<string, string> = {
      DECK_LIMIT_REACHED: 'Hai raggiunto il limite massimo di 3 mazzi.',
      DECK_NOT_FOUND: 'Mazzo non trovato.',
      API_NOT_CONFIGURED: 'Servizio mazzi non configurato.',
      API_UNAVAILABLE: 'Il servizio mazzi non è raggiungibile. Riprova tra poco.',
      INVALID_RESPONSE: 'Il servizio mazzi ha restituito una risposta non valida.',
    };
    return { error: (error.code && messages[error.code]) || error.message || fallback };
  }
  return { error: error instanceof Error ? error.message : fallback };
}

export async function listDecksAction(): Promise<{ decks: Deck[] } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessione scaduta.' };
  try {
    return { decks: await listDecks(session.user.id) };
  } catch (error) {
    return deckActionError(error, 'Impossibile caricare i mazzi.');
  }
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

  try {
    const deck = await createDeck(session.user.id, parsed.data);
    revalidatePath('/mazzi');
    return { deck };
  } catch (error) {
    return deckActionError(error, 'Impossibile creare il mazzo. Riprova tra poco.');
  }
}

export async function updateDeckAction(
  input: unknown
): Promise<{ deck: Deck } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessione scaduta.' };

  const parsed = deckActionSchemas.updateDeckSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dati non validi.' };
  }

  try {
    const { deckId, main, side } = parsed.data;
    const deck =
      main !== undefined || side !== undefined
        ? await saveDeckCards(session.user.id, deckId, main ?? [], side ?? [])
        : await getDeckById(session.user.id, deckId);
    if (!deck) return { error: 'Mazzo non trovato.' };
    revalidatePath('/mazzi');
    return { deck };
  } catch (error) {
    return deckActionError(error, 'Impossibile aggiornare il mazzo.');
  }
}

/** Salvataggio esplicito finale: ricontrolla sul server quantità e comandante. */
export async function confirmDeckAction(
  input: unknown,
): Promise<{ deck: Deck } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessione scaduta.' };

  const parsed = deckActionSchemas.confirmDeckSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dati non validi.' };
  }

  try {
    const current = await getDeckById(session.user.id, parsed.data.deckId);
    if (!current) return { error: 'Mazzo non trovato.' };
    const snapshot = { ...current, main: parsed.data.main, side: parsed.data.side };
    const issue = getDeckStructureIssues(snapshot)[0];
    if (issue) return { error: issue.message };

    const deck = await saveDeckCards(
      session.user.id,
      parsed.data.deckId,
      parsed.data.main,
      parsed.data.side,
    );
    if (!deck) return { error: 'Mazzo non trovato.' };
    revalidatePath('/mazzi');
    return { deck };
  } catch (error) {
    return deckActionError(error, 'Impossibile confermare il mazzo.');
  }
}

export async function deleteDeckAction(deckId: string): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessione scaduta.' };

  try {
    const removed = await deleteDeck(session.user.id, deckId);
    if (!removed) return { error: 'Mazzo non trovato.' };
    revalidatePath('/mazzi');
    return { ok: true };
  } catch (error) {
    return deckActionError(error, 'Impossibile eliminare il mazzo.');
  }
}

export async function validateDeckLegalityAction(
  input: unknown
): Promise<{ legal: boolean; issues: DeckLegalityIssue[]; deck?: Deck } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessione scaduta.' };

  const parsed = deckActionSchemas.validateLegalitySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dati non validi.' };
  }

  let deck: Deck | null = null;
  if (parsed.data.deckId) {
    try {
      deck = await getDeckById(session.user.id, parsed.data.deckId);
    } catch (error) {
      return deckActionError(error, 'Impossibile caricare il mazzo.');
    }
    if (!deck) return { error: 'Mazzo non trovato.' };
  } else if (parsed.data.deckSnapshot) {
    deck = {
      id: 'snapshot',
      name: 'Snapshot',
      formatId: parsed.data.deckSnapshot.formatId as Deck['formatId'],
      archetypeId: 'aggro',
      main: parsed.data.deckSnapshot.main as Deck['main'],
      side: parsed.data.deckSnapshot.side as Deck['side'],
      createdAt: new Date().toISOString(),
      verificationStatus: 'none',
    };
  } else {
    return { error: 'Specificare deckId o deckSnapshot.' };
  }

  if (!deck) return { error: 'Mazzo non trovato.' };

  const formatId = (parsed.data.formatId ?? deck.formatId) as Deck['formatId'];
  let result: Awaited<ReturnType<typeof validateDeckLegalityWithScryfall>>;
  try {
    result = await validateDeckLegalityWithScryfall(deck, formatId);
  } catch (error) {
    return deckActionError(error, 'Impossibile verificare la legalità del mazzo.');
  }

  if (parsed.data.deckId) {
    try {
      await updateDeck(session.user.id, parsed.data.deckId, {
        main: result.deck.main,
        side: result.deck.side,
        legalityCheckedAt: new Date().toISOString(),
        legalityErrors: result.issues,
      });
    } catch (error) {
      return deckActionError(error, 'Impossibile salvare la verifica di legalità.');
    }
    return { legal: result.legal, issues: result.issues, deck: result.deck };
  }

  return { legal: result.legal, issues: result.issues };
}

export async function saveDeckVerificationAction(
  input: unknown
): Promise<{ deck: Deck; clean: boolean } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessione scaduta.' };

  const parsed = deckActionSchemas.saveVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dati non validi.' };
  }

  try {
    const deck = await getDeckById(session.user.id, parsed.data.deckId);
    if (!deck) return { error: 'Mazzo non trovato.' };

    const issues = diffDeckVsScanned(deck.main, deck.side, parsed.data.scannedEntries);
    const status = deckDiffIsClean(issues) ? 'verified' : 'mismatch';
    const updated = await saveDeckVerification(session.user.id, parsed.data.deckId, status);
    if (!updated) return { error: 'Impossibile salvare la verifica.' };

    revalidatePath('/mazzi');
    return { deck: updated, clean: status === 'verified' };
  } catch (error) {
    return deckActionError(error, 'Impossibile salvare la verifica.');
  }
}

export async function saveDefaultPlaymatAction(
  input: unknown
): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Sessione scaduta.' };

  const parsed = deckActionSchemas.defaultPlaymatSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dati non validi.' };
  }

  (await cookies()).set(PLAYMAT_PREFERENCE_COOKIE, parsed.data.playmatId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  revalidatePath('/mazzi');
  return { ok: true };
}
