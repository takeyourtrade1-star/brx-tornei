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
        // Scryfall rifiuta (HTTP 400) le richieste senza User-Agent, e il fetch
        // server-side di Node non ne manda uno di default.
        'User-Agent': 'EbartexTornei/1.0 (backsoftware.crm@gmail.com)',
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

/**
 * Lookup fuzzy per solo nome. È il fallback più robusto per le legalità: queste
 * dipendono dall'oracle (identiche per tutte le stampe), quindi basta trovare
 * una qualsiasi stampa della carta per averle, anche se id/set non combaciano.
 */
export async function fetchScryfallByName(
  cardName: string
): Promise<ScryfallCardResponse | null> {
  const q = encodeURIComponent(cardName.trim());
  return fetchScryfallJson<ScryfallCardResponse>(`/cards/named?fuzzy=${q}`);
}

export interface ScryfallEnrichment {
  scryfallId?: string;
  oracleId?: string;
  image?: string | null;
  rarity?: string;
  collectorNumber?: string;
  tournamentLegalities: TournamentLegalities;
}

/** Cache dell'enrichment completo, indicizzata sia per scryfallId che per nome. */
const enrichCache = new Map<string, { at: number; enrichment: ScryfallEnrichment }>();

/**
 * Chiavi con cui cercare in cache. La chiave per nome è ammessa solo per i
 * lookup "nome e basta": se l'input specifica una stampa (set/collector o id),
 * servire l'enrichment di un'altra stampa darebbe l'immagine sbagliata.
 */
function enrichCacheKeys(input: {
  cardName: string;
  setCode?: string | null;
  collectorNumber?: string | null;
  scryfallId?: string | null;
}): string[] {
  const keys: string[] = [];
  if (input.scryfallId) keys.push(cacheKey(['enrich-id', input.scryfallId]));
  else if (!input.setCode && !input.collectorNumber && input.cardName) {
    keys.push(cacheKey(['enrich-name', input.cardName.trim().toLowerCase()]));
  }
  return keys;
}

function readEnrichCache(keys: string[]): ScryfallEnrichment | null {
  for (const key of keys) {
    const hit = enrichCache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.enrichment;
  }
  return null;
}

/** Arricchisce una carta con dati Scryfall (legalità + immagine). */
export async function enrichCardFromScryfall(input: {
  cardName: string;
  setCode?: string | null;
  collectorNumber?: string | null;
  scryfallId?: string | null;
}): Promise<ScryfallEnrichment | null> {
  const cached = readEnrichCache(enrichCacheKeys(input));
  if (cached) return cached;

  // Proviamo le strategie in ordine di precisione e ci fermiamo alla prima che
  // restituisce le legalità. Prima usavamo un solo tentativo (if/else): se lo
  // scryfall_id dello scanner non corrispondeva a una stampa reale, il lookup
  // andava a vuoto senza fallback e la carta restava "non ancora verificata".
  const attempts: Array<() => Promise<ScryfallCardResponse | null>> = [];

  if (input.scryfallId) {
    const id = input.scryfallId;
    attempts.push(() => fetchScryfallJson<ScryfallCardResponse>(`/cards/${id}`));
  }
  if (input.setCode && input.collectorNumber) {
    const set = input.setCode;
    const num = input.collectorNumber;
    attempts.push(() => fetchScryfallPrinting(set, num));
  }
  if (input.setCode && input.cardName) {
    const set = input.setCode;
    const name = input.cardName;
    attempts.push(() => fetchScryfallByNameSet(name, set));
  }
  if (input.cardName) {
    const name = input.cardName;
    attempts.push(() => fetchScryfallByName(name));
  }

  let card: ScryfallCardResponse | null = null;
  for (const attempt of attempts) {
    card = await attempt();
    if (card?.legalities) break;
  }

  if (!card?.legalities) return null;

  const enrichment: ScryfallEnrichment = {
    scryfallId: card.id,
    oracleId: card.oracle_id,
    image: imageFromScryfall(card),
    rarity: card.rarity,
    collectorNumber: card.collector_number,
    tournamentLegalities: mapLegalities(card.legalities),
  };

  // Indicizza sotto le chiavi dell'input (quelle con cui verrà ricercata) e
  // sotto il nome risolto da Scryfall, così anche i lookup fuzzy successivi
  // con il nome canonico trovano il risultato.
  const at = Date.now();
  const keys = new Set(enrichCacheKeys(input));
  if (card.id) keys.add(cacheKey(['enrich-id', card.id]));
  if (card.name) keys.add(cacheKey(['enrich-name', card.name.trim().toLowerCase()]));
  for (const key of keys) enrichCache.set(key, { at, enrichment });

  return enrichment;
}

export function isLegalInFormat(
  legalities: TournamentLegalities,
  formatId: FormatId
): boolean {
  return isLegalInFormatStatus(legalities[formatId]);
}
