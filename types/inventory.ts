import type { CardCatalogHit } from './card';

/**
 * Singola riga dell'inventario utente, arricchita con i dati catalogo.
 */
export interface InventoryItem {
  /** ID della riga inventario sul Sync microservice. */
  id: number;
  /** ID della stampa/bluprint della carta. */
  blueprintId: number;
  /** Quantità posseduta. */
  quantity: number;
  /** Dati catalogo della carta. */
  card: CardCatalogHit;
}
