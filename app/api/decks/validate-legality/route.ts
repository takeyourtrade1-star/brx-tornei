import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDeckById } from '@/lib/data/decks';
import { validateDeckLegalityWithScryfall } from '@/lib/deck-legality-with-scryfall';
import { validateLegalitySchema } from '@/lib/validations/deck-actions';
import { config } from '@/lib/config';
import { isJsonContentType, readBoundedJson } from '@/lib/security/bounded-json';
import { isSameOriginMutation } from '@/lib/security/request-origin';
import {
  enforceServerRateLimit,
  statusForServerRateLimitError,
} from '@/lib/security/server-rate-limit';
import type { Deck } from '@/types/deck';

const MAX_BODY_BYTES = 128 * 1024;

export async function POST(request: Request) {
  if (!isSameOriginMutation(request, config.app.siteUrl)) {
    return NextResponse.json(
      { error: 'Richiesta cross-site rifiutata' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  if (!isJsonContentType(request.headers.get('content-type'))) {
    return NextResponse.json(
      { error: 'Content-Type non supportato' },
      { status: 415, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  try {
    await enforceServerRateLimit({
      scope: 'deck-legality',
      subject: session.user.id,
      limit: 12,
    });
  } catch (error) {
    const status = statusForServerRateLimitError(error);
    return NextResponse.json(
      { error: status === 429 ? 'Troppe richieste' : 'Servizio non disponibile' },
      {
        status,
        headers: status === 429 ? { 'Retry-After': '60' } : undefined,
      },
    );
  }

  const decoded = await readBoundedJson(request, MAX_BODY_BYTES);
  if (!decoded.ok) {
    return NextResponse.json(
      { error: decoded.status === 413 ? 'Payload troppo grande' : 'Body JSON non valido' },
      { status: decoded.status },
    );
  }

  const parsed = validateLegalitySchema.safeParse(decoded.value);
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
  return NextResponse.json(
    { legal: result.legal, issues: result.issues },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
