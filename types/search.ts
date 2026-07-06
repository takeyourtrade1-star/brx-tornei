/** Hit Meilisearch restituita da GET /api/search */
export interface SearchHit {
  id: string;
  name: string;
  set_name: string;
  set_code?: string | null;
  set_icon_uri?: string | null;
  game_slug: string;
  category_id: number;
  category_name?: string;
  image?: string | null;
  keywords_localized?: string[];
  rarity?: string;
  collector_number?: string;
  available_languages?: string[];
  oracle_id?: string;
  scryfall_id?: string;
  cardtrader_id?: number;
}

export interface SearchApiResponse {
  hits: SearchHit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
