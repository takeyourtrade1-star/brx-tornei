/**
 * Dati essenziali di una carta dal catalogo Meilisearch.
 * Usato per arricchire gli item dell'inventario e per mostrare le carte nei mazzi.
 */
export interface CardCatalogHit {
  /** Identificativo interno Meilisearch. */
  id: string;
  /** Nome della carta (solitamente in inglese). */
  name: string;
  /** URL immagine della carta, quando disponibile. */
  image?: string | null;
  /** Nome dell'espansione. */
  setName?: string;
  /** Codice dell'espansione. */
  setCode?: string | null;
  /** Rarità (es. Common, Uncommon, Rare, Mythic). */
  rarity?: string;
  /** Numero collezionista. */
  collectorNumber?: string;
}
