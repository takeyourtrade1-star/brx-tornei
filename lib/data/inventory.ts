import 'server-only';
import { config } from '@/lib/config';
import { getAccessToken } from '@/lib/auth/session';
import { getCardsByBlueprintIds } from './catalog-cards';
import {
  getScannedInventoryItems,
  mergeInventoryItems,
} from './scanned-inventory-mock';
import type { InventoryItem } from '@/types/inventory';

export interface SyncInventoryItem {
  id: number;
  blueprint_id: number;
  quantity: number;
  price_cents?: number;
  properties?: Record<string, unknown> | null;
  external_stock_id?: string | null;
  description?: string | null;
  user_data_field?: string | null;
  graded?: boolean | null;
  updated_at?: string;
  created_at?: string | null;
}

interface InventoryResponse {
  user_id?: string;
  items?: SyncInventoryItem[];
  total?: number;
}

/**
 * Recupera tutto l'inventario di un utente dal microservizio Sync.
 * Pagina automaticamente se ci sono più di 100 item.
 */
export async function getUserInventory(
  userId: string
): Promise<SyncInventoryItem[]> {
  if (!config.api.syncBaseURL) {
    console.warn('[Inventory] NEXT_PUBLIC_SYNC_API_URL non configurato');
    return [];
  }

  const accessToken = await getAccessToken();
  if (!accessToken) return [];

  const limit = 100;
  const items: SyncInventoryItem[] = [];
  let offset = 0;

  while (true) {
    const url = new URL(
      `/api/v1/sync/inventory/${userId}`,
      config.api.syncBaseURL
    );
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));

    try {
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(config.api.timeout),
      });

      if (!res.ok) {
        console.error(
          `[Inventory] Sync API errore ${res.status}: ${await res.text().catch(() => '')}`
        );
        return items;
      }

      const data = (await res.json().catch(() => null)) as InventoryResponse | null;
      const page = Array.isArray(data?.items) ? data.items : [];
      items.push(...page);

      const total = typeof data?.total === 'number' ? data.total : page.length;
      offset += page.length;
      if (offset >= total || page.length === 0) break;
    } catch (err) {
      console.error('[Inventory] Errore fetch inventario:', err);
      return items;
    }
  }

  return items;
}

/**
 * Recupera l'inventario completo di un utente, arricchito con i dati catalogo.
 * Include carte aggiunte via scan (overlay mock fino a API Sync write).
 */
export async function getMyInventory(userId: string): Promise<InventoryItem[]> {
  const rawItems = await getUserInventory(userId);

  let syncItems: InventoryItem[] = [];
  if (rawItems.length > 0) {
    const blueprintIds = rawItems.map((item) => item.blueprint_id);
    const cardMap = await getCardsByBlueprintIds(blueprintIds);

    syncItems = rawItems
      .map((item) => {
        const card = cardMap[item.blueprint_id];
        if (!card) return null;
        return {
          id: item.id,
          blueprintId: item.blueprint_id,
          quantity: item.quantity,
          card,
        };
      })
      .filter((item): item is InventoryItem => item !== null);
  }

  const scannedItems = getScannedInventoryItems(userId);
  return mergeInventoryItems(syncItems, scannedItems);
}
