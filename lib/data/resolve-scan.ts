import 'server-only';
import { searchCardByNameSet, searchCardByScryfallId } from './catalog-cards';
import { enrichCardFromScryfall } from './scryfall';
import { addScannedCardToMockInventory } from './scanned-inventory-mock';
import type { CardCatalogHit } from '@/types/card';
import type { InventoryItem } from '@/types/inventory';
import type { ResolveScanInput, ResolveScanResult } from '@/types/resolve-scan';

export type { ResolveScanInput, ResolveScanResult } from '@/types/resolve-scan';

/**
 * Deriva un blueprintId sintetico e *stabile* per una carta riconosciuta da
 * Asso Vision ma non presente nel catalogo Ebartex. Asso Vision si basa su
 * Scryfall, quindi una carta identificata deve comunque finire in inventario
 * (con legalità e immagine) invece di fallire alla conferma.
 *
 * Usiamo un range negativo dedicato per non collidere mai con i blueprint reali
 * (positivi) del catalogo. Lo stesso scan → stesso seed → stesso id, così le
 * copie multiple della stessa carta si sommano invece di duplicarsi.
 */
function syntheticBlueprintId(
  input: ResolveScanInput,
  enrichment: Awaited<ReturnType<typeof enrichCardFromScryfall>>
): number {
  const seed =
    enrichment?.scryfallId ??
    input.scryfallId ??
    enrichment?.oracleId ??
    `${input.cardName.trim().toLowerCase()}|${input.setCode ?? ''}|${input.collectorNumber ?? ''}`;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return -(2_000_000 + (Math.abs(h) % 1_000_000_000));
}

function buildFallbackCard(input: ResolveScanInput, enrichment: Awaited<ReturnType<typeof enrichCardFromScryfall>>): CardCatalogHit {
  return {
    id: enrichment?.scryfallId ?? `scan-${input.cardName}-${input.setCode ?? 'unknown'}`,
    name: input.cardName,
    image: enrichment?.image ?? input.imageUri ?? null,
    setName: input.setName ?? undefined,
    setCode: input.setCode ?? null,
    rarity: enrichment?.rarity,
    collectorNumber: enrichment?.collectorNumber ?? input.collectorNumber ?? undefined,
    oracleId: enrichment?.oracleId,
    scryfallId: enrichment?.scryfallId,
    tournamentLegalities: enrichment?.tournamentLegalities,
  };
}

/**
 * Risolve uno scan Camera Match → carta catalogo + legalità Scryfall + aggiunta inventario.
 */
export async function resolveScanAndAddToInventory(
  userId: string,
  input: ResolveScanInput,
  existingItems: InventoryItem[]
): Promise<{ ok: true; data: ResolveScanResult } | { ok: false; error: string }> {
  const cardName = input.cardName.trim();
  if (!cardName) {
    return { ok: false, error: 'Nome carta mancante dallo scan.' };
  }

  const enrichment = await enrichCardFromScryfall({
    cardName,
    setCode: input.setCode,
    collectorNumber: input.collectorNumber,
    scryfallId: input.scryfallId,
  });

  let catalogCard: CardCatalogHit | null = null;
  if (input.setCode) {
    catalogCard = await searchCardByNameSet(cardName, input.setCode);
  }
  if (!catalogCard && input.scryfallId) {
    catalogCard = await searchCardByScryfallId(input.scryfallId);
  }

  let mergedCard: CardCatalogHit = {
    ...(catalogCard ?? buildFallbackCard(input, enrichment)),
    image:
      catalogCard?.image ??
      enrichment?.image ??
      input.imageUri ??
      null,
    oracleId: catalogCard?.oracleId ?? enrichment?.oracleId,
    scryfallId: catalogCard?.scryfallId ?? enrichment?.scryfallId,
    collectorNumber:
      catalogCard?.collectorNumber ??
      enrichment?.collectorNumber ??
      input.collectorNumber ??
      undefined,
    tournamentLegalities: enrichment?.tournamentLegalities,
  };

  let blueprintId = Number(mergedCard.id);
  if (!Number.isInteger(blueprintId) || blueprintId <= 0) {
    // Non è nel catalogo Ebartex: la aggiungiamo comunque con i dati Asso Vision
    // (Scryfall) e un id sintetico stabile, così legalità e ban restano attivi.
    blueprintId = syntheticBlueprintId(input, enrichment);
    mergedCard = { ...mergedCard, id: String(blueprintId) };
  }

  const existing = existingItems.find((i) => i.blueprintId === blueprintId);
  const previousQuantity = existing?.quantity ?? 0;

  const inventoryItem = addScannedCardToMockInventory(userId, blueprintId, mergedCard, 1);

  return {
    ok: true,
    data: {
      blueprintId,
      card: mergedCard,
      inventoryItem: {
        ...inventoryItem,
        quantity: previousQuantity + 1,
      },
      wasAlreadyOwned: previousQuantity > 0,
      previousQuantity,
    },
  };
}
