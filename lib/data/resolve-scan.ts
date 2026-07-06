import 'server-only';
import { searchCardByNameSet, searchCardByScryfallId } from './catalog-cards';
import { enrichCardFromScryfall } from './scryfall';
import { addScannedCardToMockInventory } from './scanned-inventory-mock';
import type { CardCatalogHit } from '@/types/card';
import type { InventoryItem } from '@/types/inventory';
import type { ResolveScanInput, ResolveScanResult } from '@/types/resolve-scan';

export type { ResolveScanInput, ResolveScanResult } from '@/types/resolve-scan';

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

  const mergedCard: CardCatalogHit = {
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

  const blueprintId = Number(mergedCard.id);
  if (Number.isNaN(blueprintId) || blueprintId <= 0) {
    return {
      ok: false,
      error: 'Carta non trovata nel catalogo Ebartex. Verifica nome e set.',
    };
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
