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
} from '@/lib/data/decks';
import { TournamentApiError } from '@/lib/data/tournament-api-client';
import { fetchMyReputation } from '@/lib/data/player-api-client';
import { resolveTrustedDeckCards } from '@/lib/deck-card-boundary';
import { getDeckStructureIssues } from '@/lib/deck-structure';
import { deckDiffIsClean, diffDeckVsScanned } from '@/lib/deck-verification';
import { createDeckSchema } from '@/lib/validations/deck';
import * as deckActionSchemas from '@/lib/validations/deck-actions';
import {
  PLAYMAT_HOME_BACKGROUND_COOKIE,
  PLAYMAT_PREFERENCE_COOKIE,
} from '@/lib/playmat-preference';
import { getPlaymatUnlockRequirement, isPlaymatUnlocked } from '@/lib/playmats';
import type { Deck } from '@/types/deck';

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
    let deck: Deck | null;
    if (main !== undefined || side !== undefined) {
      const [trustedMain, trustedSide] = await Promise.all([
        resolveTrustedDeckCards(main ?? []),
        resolveTrustedDeckCards(side ?? []),
      ]);
      deck = await saveDeckCards(session.user.id, deckId, trustedMain, trustedSide);
    } else {
      deck = await getDeckById(session.user.id, deckId);
    }
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
    const [main, side] = await Promise.all([
      resolveTrustedDeckCards(parsed.data.main),
      resolveTrustedDeckCards(parsed.data.side),
    ]);
    const snapshot = { ...current, main, side };
    const issue = getDeckStructureIssues(snapshot)[0];
    if (issue) return { error: issue.message };

    const deck = await saveDeckCards(
      session.user.id,
      parsed.data.deckId,
      main,
      side,
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

  const required = getPlaymatUnlockRequirement(parsed.data.playmatId) ?? 0;
  if (required > 0) {
    try {
      const reputation = await fetchMyReputation();
      if (!isPlaymatUnlocked(parsed.data.playmatId, reputation.qualifiedMatches30m)) {
        return {
          error: `Tappetino bloccato: servono ${required} partite da almeno 30 minuti.`,
        };
      }
    } catch {
      return {
        error: 'Impossibile verificare gli sblocchi. Riprova tra poco.',
      };
    }
  }

  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };
  cookieStore.set(PLAYMAT_PREFERENCE_COOKIE, parsed.data.playmatId, cookieOptions);
  if (parsed.data.homeBackgroundEnabled !== undefined) {
    cookieStore.set(
      PLAYMAT_HOME_BACKGROUND_COOKIE,
      parsed.data.homeBackgroundEnabled ? '1' : '0',
      cookieOptions,
    );
  }
  revalidatePath('/mazzi');
  revalidatePath('/tornei');
  return { ok: true };
}
