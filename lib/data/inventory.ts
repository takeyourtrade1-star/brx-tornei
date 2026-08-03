import 'server-only';
import { config } from '@/lib/config';
import { getAccessToken } from '@/lib/auth/session';
import { getCardsByBlueprintIds } from './catalog-cards';
import {
  getScannedInventoryItems,
  mergeInventoryItems,
} from './scanned-inventory-mock';
import type { InventoryItem } from '@/types/inventory';
import { readBoundedResponseJson } from '@/lib/security/bounded-response';

const MAX_INVENTORY_PAGE_BYTES = 2 * 1024 * 1024;
const INVENTORY_PAGE_SIZE = 100;
const MAX_INVENTORY_ITEMS = 5_000;
const MAX_INVENTORY_PAGES = Math.ceil(MAX_INVENTORY_ITEMS / INVENTORY_PAGE_SIZE);
const MAX_INVENTORY_ELAPSED_MS = 12_000;

export class InventoryBoundaryError extends Error {}

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
    console.warn('[Inventory] SYNC_API_URL non configurato');
    return [];
  }

  const accessToken = await getAccessToken();
  if (!accessToken) return [];

  const limit = INVENTORY_PAGE_SIZE;
  const items: SyncInventoryItem[] = [];
  const seenItemIds = new Set<number>();
  const seenPages = new Set<string>();
  const startedAt = Date.now();
  let offset = 0;
  let pageCount = 0;

  while (true) {
    const remainingMs = MAX_INVENTORY_ELAPSED_MS - (Date.now() - startedAt);
    if (remainingMs <= 0 || pageCount >= MAX_INVENTORY_PAGES) {
      throw new InventoryBoundaryError('Inventory pagination budget exceeded');
    }
    pageCount += 1;
    const url = new URL(
      `/api/v1/sync/inventory/${encodeURIComponent(userId)}`,
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
          'Accept-Encoding': 'identity',
        },
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(Math.min(config.api.timeout, remainingMs)),
      });

      if (!res.ok) {
        console.error(`[Inventory] Sync API errore ${res.status}`);
        return items;
      }

      const data = (await readBoundedResponseJson(
        res,
        MAX_INVENTORY_PAGE_BYTES,
      ).catch(() => null)) as InventoryResponse | null;
      const page = Array.isArray(data?.items) ? data.items : [];
      const total = data?.total ?? page.length;
      if (
        !Number.isSafeInteger(total)
        || total < 0
        || total > MAX_INVENTORY_ITEMS
        || page.length > limit
      ) {
        throw new InventoryBoundaryError('Invalid inventory pagination metadata');
      }
      if (page.length === 0) break;

      const pageIds: number[] = [];
      for (const item of page) {
        if (
          !item
          || !Number.isSafeInteger(item.id)
          || item.id <= 0
          || !Number.isSafeInteger(item.blueprint_id)
          || item.blueprint_id <= 0
          || !Number.isSafeInteger(item.quantity)
          || item.quantity < 0
        ) {
          throw new InventoryBoundaryError('Invalid inventory item identity');
        }
        pageIds.push(item.id);
      }
      const fingerprint = pageIds.join(',');
      if (seenPages.has(fingerprint)) {
        throw new InventoryBoundaryError('Repeated inventory page');
      }
      seenPages.add(fingerprint);
      for (const item of page) {
        if (seenItemIds.has(item.id)) {
          throw new InventoryBoundaryError('Duplicate inventory item');
        }
        seenItemIds.add(item.id);
        items.push(item);
      }
      if (items.length > MAX_INVENTORY_ITEMS) {
        throw new InventoryBoundaryError('Inventory item budget exceeded');
      }

      offset += page.length;
      if (offset >= total) break;
    } catch (error) {
      if (error instanceof InventoryBoundaryError) throw error;
      console.error('[Inventory] Errore fetch inventario');
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
