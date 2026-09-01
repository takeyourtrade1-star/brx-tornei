import 'server-only';
import { FORMATS } from '@/lib/data/catalog';
import type { DeckCard } from '@/types/deck';
import type { ScryfallLegalityStatus, TournamentLegalities } from '@/types/card-legality';
import { FORMAT_TO_SCRYFALL } from '@/types/card-legality';
import { readBoundedResponseJson } from '@/lib/security/bounded-response';

const SCRYFALL_BASE = 'https://api.scryfall.com';
const MAX_COLLECTION_IDENTIFIERS = 700;

export interface ScryfallCardResponse {
  id?: string;
  oracle_id?: string;
  name?: string;
  set?: string;
  set_name?: string;
  collector_number?: string;
  image_uris?: { normal?: string; small?: string };
  card_faces?: Array<{ image_uris?: { normal?: string; small?: string } }>;
  legalities?: Record<string, string>;
  rarity?: string;
}

export function imageFromScryfall(card: ScryfallCardResponse): string | null {
  const direct = card.image_uris?.normal ?? card.image_uris?.small;
  if (direct) return direct;
  const face = card.card_faces?.[0]?.image_uris;
  return face?.normal ?? face?.small ?? null;
}

export function mapLegalities(raw: Record<string, string> | undefined): TournamentLegalities {
  const out = {} as TournamentLegalities;
  for (const format of FORMATS) {
    const scryKey = FORMAT_TO_SCRYFALL[format.id];
    const status = raw?.[scryKey];
    if (
      status === 'legal' ||
      status === 'not_legal' ||
      status === 'restricted' ||
      status === 'banned'
    ) {
      out[format.id] = status;
    } else {
      out[format.id] = 'not_legal';
    }
  }
  return out;
}

async function fetchScryfallRequest<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const timeoutSignal = AbortSignal.timeout(15_000);
    const signal = init?.signal
      ? AbortSignal.any([init.signal, timeoutSignal])
      : timeoutSignal;
    const res = await fetch(`${SCRYFALL_BASE}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'identity',
        // Scryfall rifiuta (HTTP 400) le richieste senza User-Agent, e il fetch
        // server-side di Node non ne manda uno di default.
        'User-Agent': 'EbartexTornei/1.0 (backsoftware.crm@gmail.com)',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
      cache: 'no-store',
      redirect: 'error',
      signal,
    });
    if (!res.ok) return null;
    return (await readBoundedResponseJson(res, 2 * 1024 * 1024)) as T;
  } catch {
    return null;
  }
}

export async function fetchScryfallJson<T>(path: string): Promise<T | null> {
  return fetchScryfallRequest<T>(path);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type ScryfallCollectionIdentifier =
  | { id: string }
  | { set: string; collector_number: string }
  | { name: string };

function collectionIdentifierKey(identifier: ScryfallCollectionIdentifier): string {
  if ('id' in identifier) return `id:${identifier.id}`;
  if ('name' in identifier) return `name:${identifier.name.trim().toLowerCase()}`;
  return `set:${identifier.set.trim().toLowerCase()}:${identifier.collector_number.trim()}`;
}

/** Batch lookup fino a 75 stampe per richiesta (Scryfall /cards/collection). */
export async function fetchScryfallCollection(
  identifiers: ScryfallCollectionIdentifier[],
  options: { signal?: AbortSignal } = {},
): Promise<ScryfallCardResponse[]> {
  if (identifiers.length === 0) return [];
  const unique = [...new Map(
    identifiers.map((identifier) => [collectionIdentifierKey(identifier), identifier]),
  ).values()];
  if (unique.length > MAX_COLLECTION_IDENTIFIERS) {
    throw new Error('Budget lookup Scryfall superato');
  }

  const results: ScryfallCardResponse[] = [];
  const chunkSize = 75;

  for (let i = 0; i < unique.length; i += chunkSize) {
    if (options.signal?.aborted) break;
    if (i > 0) await sleep(100);

    const chunk = unique.slice(i, i + chunkSize);
    const data = await fetchScryfallRequest<{ data?: ScryfallCardResponse[] }>(
      '/cards/collection',
      {
        method: 'POST',
        body: JSON.stringify({ identifiers: chunk }),
        signal: options.signal,
      }
    );
    if (Array.isArray(data?.data)) {
      results.push(...data.data);
    }
  }

  return results;
}

export function tournamentLegalitiesFromScryfallCard(
  card: ScryfallCardResponse
): TournamentLegalities {
  return mapLegalities(card.legalities);
}

export function applyScryfallToDeckCard(deckCard: DeckCard, scryfall: ScryfallCardResponse): DeckCard {
  return {
    ...deckCard,
    scryfallId: scryfall.id,
    oracleId: scryfall.oracle_id,
    rarity: scryfall.rarity ?? deckCard.rarity,
    collectorNumber: scryfall.collector_number ?? deckCard.collectorNumber,
    image: deckCard.image ?? imageFromScryfall(scryfall),
    tournamentLegalities: tournamentLegalitiesFromScryfallCard(scryfall),
  };
}
