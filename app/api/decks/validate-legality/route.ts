import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDeckById } from '@/lib/data/decks';
import { validateDeckLegalityWithScryfall } from '@/lib/deck-legality-with-scryfall';
import { validateLegalitySchema } from '@/lib/validations/deck-actions';
import type { Deck } from '@/types/deck';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const parsed = validateLegalitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Dati non validi' },
      { status: 400 }
    );
  }

  let deck: Deck | null = null;
  if (parsed.data.deckId) {
    deck = await getDeckById(session.user.id, parsed.data.deckId);
    if (!deck) {
      return NextResponse.json({ error: 'Mazzo non trovato' }, { status: 404 });
    }
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
    return NextResponse.json({ error: 'deckId o deckSnapshot richiesto' }, { status: 400 });
  }

  const formatId = (parsed.data.formatId ?? deck.formatId) as Deck['formatId'];
  const result = await validateDeckLegalityWithScryfall(deck, formatId);
  return NextResponse.json({ legal: result.legal, issues: result.issues });
}
