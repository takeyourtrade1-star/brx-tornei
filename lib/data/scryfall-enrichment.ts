import 'server-only';

import type { FormatId } from '@/lib/data/catalog';
import { isLegalInFormatStatus } from '@/lib/card-legality-label';
import {
  fetchScryfallJson,
  imageFromScryfall,
  mapLegalities,
  type ScryfallCardResponse,
} from '@/lib/data/scryfall';
import type { TournamentLegalities } from '@/types/card-legality';

const CACHE_TTL_MS = 24 * 60 * 60 * 1_000;
const MAX_CACHE_ENTRIES = 2_000;

export interface ScryfallEnrichment {
  name: string;
  setCode?: string;
  setName?: string;
  scryfallId?: string;
  oracleId?: string;
  image?: string | null;
  rarity?: string;
  collectorNumber?: string;
  tournamentLegalities: TournamentLegalities;
}

const enrichCache = new Map<string, { at: number; enrichment: ScryfallEnrichment }>();

function setBoundedCache(key: string, value: { at: number; enrichment: ScryfallEnrichment }) {
  if (!enrichCache.has(key) && enrichCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = enrichCache.keys().next().value;
    if (oldest !== undefined) enrichCache.delete(oldest);
  }
  enrichCache.set(key, value);
}

interface ScryfallLookupInput {
  cardName: string;
  setCode?: string | null;
  collectorNumber?: string | null;
  scryfallId?: string | null;
}

function lookupKey(input: ScryfallLookupInput): string {
  if (input.scryfallId) return `id:${input.scryfallId.trim().toLowerCase()}`;
  if (input.setCode && input.collectorNumber) {
    return `print:${input.setCode.trim().toLowerCase()}:${input.collectorNumber.trim()}`;
  }
  if (input.setCode) {
    return `name-set:${input.cardName.trim().toLowerCase()}:${input.setCode.trim().toLowerCase()}`;
  }
  return `name:${input.cardName.trim().toLowerCase()}`;
}

function readCache(key: string): ScryfallEnrichment | null {
  const hit = enrichCache.get(key);
  return hit && Date.now() - hit.at < CACHE_TTL_MS ? hit.enrichment : null;
}

async function fetchPrinting(setCode: string, collectorNumber: string) {
  const set = encodeURIComponent(setCode.trim().toLowerCase());
  const number = encodeURIComponent(collectorNumber.trim());
  return fetchScryfallJson<ScryfallCardResponse>(`/cards/${set}/${number}`);
}

async function fetchByNameSet(cardName: string, setCode: string) {
  const query = encodeURIComponent(`!"${cardName}" set:${setCode}`);
  const data = await fetchScryfallJson<{ data?: ScryfallCardResponse[] }>(
    `/cards/search?q=${query}&unique=prints`,
  );
  return data?.data?.[0] ?? null;
}

async function fetchByName(cardName: string) {
  const query = encodeURIComponent(cardName.trim());
  return fetchScryfallJson<ScryfallCardResponse>(`/cards/named?fuzzy=${query}`);
}

async function fetchCanonicalCard(input: ScryfallLookupInput) {
  if (input.scryfallId) {
    const expectedId = input.scryfallId.trim().toLowerCase();
    const card = await fetchScryfallJson<ScryfallCardResponse>(
      `/cards/${encodeURIComponent(expectedId)}`,
    );
    return card?.id?.toLowerCase() === expectedId ? card : null;
  }
  if (input.setCode && input.collectorNumber) {
    return fetchPrinting(input.setCode, input.collectorNumber);
  }
  if (input.setCode) return fetchByNameSet(input.cardName, input.setCode);
  return fetchByName(input.cardName);
}

function responseCacheKeys(card: ScryfallCardResponse): string[] {
  const keys: string[] = [];
  if (card.id) keys.push(`id:${card.id.toLowerCase()}`);
  if (card.set && card.collector_number) {
    keys.push(`print:${card.set.toLowerCase()}:${card.collector_number}`);
  }
  if (card.name && card.set) {
    keys.push(`name-set:${card.name.trim().toLowerCase()}:${card.set.toLowerCase()}`);
  }
  if (card.name) keys.push(`name:${card.name.trim().toLowerCase()}`);
  return keys;
}

/** Arricchisce una scansione singola; errori transitori non entrano in negative cache. */
export async function enrichCardFromScryfall(
  input: ScryfallLookupInput,
): Promise<ScryfallEnrichment | null> {
  const key = lookupKey(input);
  const cached = readCache(key);
  if (cached) return cached;

  const card = await fetchCanonicalCard(input);
  if (!card?.name || !card.legalities) return null;

  const enrichment: ScryfallEnrichment = {
    name: card.name,
    setCode: card.set,
    setName: card.set_name,
    scryfallId: card.id,
    oracleId: card.oracle_id,
    image: imageFromScryfall(card),
    rarity: card.rarity,
    collectorNumber: card.collector_number,
    tournamentLegalities: mapLegalities(card.legalities),
  };
  const at = Date.now();
  for (const trustedKey of responseCacheKeys(card)) {
    setBoundedCache(trustedKey, { at, enrichment });
  }
  return enrichment;
}

export function isLegalInFormat(
  legalities: TournamentLegalities,
  formatId: FormatId,
): boolean {
  return isLegalInFormatStatus(legalities[formatId]);
}
