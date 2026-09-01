import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDeckById } from '@/lib/data/decks';
import {
  resolveTrustedDeck,
  resolveTrustedDeckCards,
} from '@/lib/deck-card-boundary';
import { validateDeckLegalityWithScryfall } from '@/lib/deck-legality-with-scryfall';
import { enforceDeckLegalityRateLimit } from '@/lib/deck-legality-rate-limit';
import { validateLegalitySchema } from '@/lib/validations/deck-actions';
import { config } from '@/lib/config';
import { isJsonContentType, readBoundedJson } from '@/lib/security/bounded-json';
import { isSameOriginMutation } from '@/lib/security/request-origin';
import {
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
    await enforceDeckLegalityRateLimit(session.user.id);
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
  try {
    if (parsed.data.deckId) {
      const stored = await getDeckById(session.user.id, parsed.data.deckId);
      deck = stored ? await resolveTrustedDeck(stored) : null;
      if (!deck) {
        return NextResponse.json({ error: 'Mazzo non trovato' }, { status: 404 });
      }
    } else if (parsed.data.deckSnapshot) {
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
    } else {
      return NextResponse.json({ error: 'deckId o deckSnapshot richiesto' }, { status: 400 });
    }
  } catch {
    return NextResponse.json(
      { error: 'Impossibile verificare le carte del mazzo' },
      { status: 422, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (!deck) {
    return NextResponse.json({ error: 'Mazzo non trovato' }, { status: 404 });
  }

  const formatId = parsed.data.deckId
    ? deck.formatId
    : (parsed.data.formatId ?? deck.formatId);
  const result = await validateDeckLegalityWithScryfall(deck, formatId);
  return NextResponse.json(
    { legal: result.legal, issues: result.issues },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
