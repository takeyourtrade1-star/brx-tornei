import 'server-only';
import type { CardCatalogHit } from '@/types/card';
import type { InventoryItem } from '@/types/inventory';

/**
 * Overlay inventario per carte aggiunte via scan (MVP).
 * Quando Sync espone POST inventory, sostituire con chiamata reale.
 */
interface ScannedEntry {
  blueprintId: number;
  quantity: number;
  card: CardCatalogHit;
}

const scannedByUser = new Map<string, Map<number, ScannedEntry>>();

let nextMockId = -1_000_000;

function userStore(userId: string): Map<number, ScannedEntry> {
  let store = scannedByUser.get(userId);
  if (!store) {
    store = new Map();
    scannedByUser.set(userId, store);
  }
  return store;
}

export function addScannedCardToMockInventory(
  userId: string,
  blueprintId: number,
  card: CardCatalogHit,
  quantity = 1
): InventoryItem {
  const store = userStore(userId);
  const existing = store.get(blueprintId);
  if (existing) {
    existing.quantity += quantity;
    existing.card = { ...existing.card, ...card };
    return {
      id: existing.blueprintId,
      blueprintId,
      quantity: existing.quantity,
      card: existing.card,
    };
  }

  const entry: ScannedEntry = { blueprintId, quantity, card };
  store.set(blueprintId, entry);
  return {
    id: nextMockId--,
    blueprintId,
    quantity,
    card,
  };
}

export function getScannedInventoryItems(userId: string): InventoryItem[] {
  const store = userStore(userId);
  return [...store.values()].map((entry) => ({
    id: entry.blueprintId,
    blueprintId: entry.blueprintId,
    quantity: entry.quantity,
    card: entry.card,
  }));
}

/** Unisce inventario Sync con overlay scan (somma quantità per blueprint). */
export function mergeInventoryItems(
  syncItems: InventoryItem[],
  scannedItems: InventoryItem[]
): InventoryItem[] {
  const merged = new Map<number, InventoryItem>();

  for (const item of syncItems) {
    merged.set(item.blueprintId, { ...item });
  }

  for (const scanned of scannedItems) {
    const existing = merged.get(scanned.blueprintId);
    if (existing) {
      merged.set(scanned.blueprintId, {
        ...existing,
        quantity: existing.quantity + scanned.quantity,
        card: {
          ...existing.card,
          ...scanned.card,
          tournamentLegalities:
            scanned.card.tournamentLegalities ?? existing.card.tournamentLegalities,
        },
      });
    } else {
      merged.set(scanned.blueprintId, { ...scanned });
    }
  }

  return [...merged.values()].sort((a, b) => a.card.name.localeCompare(b.card.name));
}
