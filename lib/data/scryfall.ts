import 'server-only';
import type { FormatId } from '@/lib/data/catalog';
import { FORMATS } from '@/lib/data/catalog';
import type { DeckCard } from '@/types/deck';
import type { ScryfallLegalityStatus, TournamentLegalities } from '@/types/card-legality';
import { FORMAT_TO_SCRYFALL } from '@/types/card-legality';
import { isLegalInFormatStatus } from '@/lib/card-legality-label';

const SCRYFALL_BASE = 'https://api.scryfall.com';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface ScryfallCardResponse {
  id?: string;
  oracle_id?: string;
  name?: string;
  set?: string;
  collector_number?: string;
  image_uris?: { normal?: string; small?: string };
  card_faces?: Array<{ image_uris?: { normal?: string; small?: string } }>;
  legalities?: Record<string, string>;
  rarity?: string;
}

const legalityCache = new Map<string, { at: number; legalities: TournamentLegalities }>();

function cacheKey(parts: string[]): string {
  return parts.join('|');
}

function imageFromScryfall(card: ScryfallCardResponse): string | null {
  const direct = card.image_uris?.normal ?? card.image_uris?.small;
  if (direct) return direct;
  const face = card.card_faces?.[0]?.image_uris;
  return face?.normal ?? face?.small ?? null;
}

function mapLegalities(raw: Record<string, string> | undefined): TournamentLegalities {
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
    const res = await fetch(`${SCRYFALL_BASE}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchScryfallJson<T>(path: string): Promise<T | null> {
  return fetchScryfallRequest<T>(path);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type ScryfallCollectionIdentifier =
  | { id: string }
  | { set: string; collector_number: string };

/** Batch lookup fino a 75 stampe per richiesta (Scryfall /cards/collection). */
export async function fetchScryfallCollection(
  identifiers: ScryfallCollectionIdentifier[]
): Promise<ScryfallCardResponse[]> {
  if (identifiers.length === 0) return [];

  const results: ScryfallCardResponse[] = [];
  const chunkSize = 75;

  for (let i = 0; i < identifiers.length; i += chunkSize) {
    if (i > 0) await sleep(100);

    const chunk = identifiers.slice(i, i + chunkSize);
    const data = await fetchScryfallRequest<{ data?: ScryfallCardResponse[] }>(
      '/cards/collection',
      {
        method: 'POST',
        body: JSON.stringify({ identifiers: chunk }),
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
    scryfallId: deckCard.scryfallId ?? scryfall.id,
    oracleId: deckCard.oracleId ?? scryfall.oracle_id,
    rarity: deckCard.rarity ?? scryfall.rarity,
    collectorNumber: deckCard.collectorNumber ?? scryfall.collector_number,
    image: deckCard.image ?? imageFromScryfall(scryfall),
    tournamentLegalities: tournamentLegalitiesFromScryfallCard(scryfall),
  };
}

/** Recupera legalità torneo per UUID stampa Scryfall. */
export async function getTournamentLegalitiesByScryfallId(
  scryfallId: string
): Promise<TournamentLegalities | null> {
  const key = cacheKey(['id', scryfallId]);
  const cached = legalityCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.legalities;
  }

  const card = await fetchScryfallJson<ScryfallCardResponse>(`/cards/${scryfallId}`);
  if (!card?.legalities) return null;

  const legalities = mapLegalities(card.legalities);
  legalityCache.set(key, { at: Date.now(), legalities });
  return legalities;
}

/** Lookup stampa per set + collector number. */
export async function fetchScryfallPrinting(
  setCode: string,
  collectorNumber: string
): Promise<ScryfallCardResponse | null> {
  const set = encodeURIComponent(setCode.trim().toLowerCase());
  const num = encodeURIComponent(collectorNumber.trim());
  return fetchScryfallJson<ScryfallCardResponse>(`/cards/${set}/${num}`);
}

/** Lookup per nome esatto + set (fallback senza collector number). */
export async function fetchScryfallByNameSet(
  cardName: string,
  setCode: string
): Promise<ScryfallCardResponse | null> {
  const q = encodeURIComponent(`!"${cardName}" set:${setCode}`);
  const data = await fetchScryfallJson<{ data?: ScryfallCardResponse[] }>(
    `/cards/search?q=${q}&unique=prints`
  );
  const first = data?.data?.[0];
  return first ?? null;
}

export interface ScryfallEnrichment {
  scryfallId?: string;
  oracleId?: string;
  image?: string | null;
  rarity?: string;
  collectorNumber?: string;
  tournamentLegalities: TournamentLegalities;
}

/** Arricchisce una carta con dati Scryfall (legalità + immagine). */
export async function enrichCardFromScryfall(input: {
  cardName: string;
  setCode?: string | null;
  collectorNumber?: string | null;
  scryfallId?: string | null;
}): Promise<ScryfallEnrichment | null> {
  let card: ScryfallCardResponse | null = null;

  if (input.scryfallId) {
    card = await fetchScryfallJson<ScryfallCardResponse>(`/cards/${input.scryfallId}`);
  } else if (input.setCode && input.collectorNumber) {
    card = await fetchScryfallPrinting(input.setCode, input.collectorNumber);
  } else if (input.setCode && input.cardName) {
    card = await fetchScryfallByNameSet(input.cardName, input.setCode);
  }

  if (!card?.legalities) return null;

  const tournamentLegalities = mapLegalities(card.legalities);
  const key = cacheKey(['enrich', card.id ?? input.cardName]);
  legalityCache.set(key, { at: Date.now(), legalities: tournamentLegalities });

  return {
    scryfallId: card.id,
    oracleId: card.oracle_id,
    image: imageFromScryfall(card),
    rarity: card.rarity,
    collectorNumber: card.collector_number,
    tournamentLegalities,
  };
}

export function isLegalInFormat(
  legalities: TournamentLegalities,
  formatId: FormatId
): boolean {
  return isLegalInFormatStatus(legalities[formatId]);
}
