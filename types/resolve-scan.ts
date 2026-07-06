import type { CardCatalogHit } from './card';
import type { InventoryItem } from './inventory';

export interface ResolveScanInput {
  cardName: string;
  setCode?: string | null;
  setName?: string | null;
  collectorNumber?: string | null;
  scryfallId?: string | null;
  imageUri?: string | null;
}

export interface ResolveScanResult {
  blueprintId: number;
  card: CardCatalogHit;
  inventoryItem: InventoryItem;
  wasAlreadyOwned: boolean;
  previousQuantity: number;
}
