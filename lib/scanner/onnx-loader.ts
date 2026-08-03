/**
 * useOnnxLoader — IndexedDB-backed ONNX model cache for the browser.
 *
 * Flow:
 *   1. Check IndexedDB for a cached copy of the model bytes.
 *   2. Cache hit  → return ArrayBuffer from IDB (< 100 ms).
 *   3. Cache miss → fetch from the authenticated same-origin proxy, store in
 *      IDB, return ArrayBuffer.
 *
 * Uses only the raw IDB API — no external libraries required.
 *
 * IDB store: "brx-onnx-cache" / digest-versioned model key.
 */

const IDB_DB_NAME = 'brx-onnx-cache';
const IDB_STORE_NAME = 'models';
const LEGACY_MODEL_KEYS = ['dinov2_small_v2'];

/** Current dinov2_small.onnx size, used only for progress when length is absent. */
export const ESTIMATED_ONNX_BYTES = 87_654_321;
/** Hard browser-memory ceiling for the signed model artifact. */
export const MAX_ONNX_MODEL_BYTES = 96 * 1024 * 1024;

export interface OnnxModelIntegrity {
  size: number;
  sha256: string;
}

function validateIntegrity(integrity: OnnxModelIntegrity): void {
  if (
    !Number.isSafeInteger(integrity.size) ||
    integrity.size <= 100_000 ||
    integrity.size > MAX_ONNX_MODEL_BYTES ||
    !/^[0-9a-f]{64}$/.test(integrity.sha256)
  ) {
    throw new Error('Metadati integrità modello ONNX non validi');
  }
}

function modelCacheKey(integrity: OnnxModelIntegrity): string {
  return `dinov2_small_sha256_${integrity.sha256}`;
}

export async function verifyOnnxModelIntegrity(
  data: ArrayBuffer,
  integrity: OnnxModelIntegrity,
): Promise<boolean> {
  validateIntegrity(integrity);
  if (data.byteLength !== integrity.size || !globalThis.crypto?.subtle) return false;
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  const actual = [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
  return actual === integrity.sha256;
}

// ---------------------------------------------------------------------------
// Progress type
// ---------------------------------------------------------------------------

export type OnnxLoadProgress = {
  loaded: number;
  total: number;
  /** 0–100 when known or estimated; -1 = indeterminate (no bytes yet) */
  percent: number;
  phase: 'idle' | 'downloading' | 'caching' | 'initializing' | 'ready' | 'failed';
  /** Human-readable detail for UI / console (last error, retry hint, etc.) */
  reason?: string;
};

export const ONNX_LOAD_PROGRESS_IDLE: OnnxLoadProgress = {
  loaded: 0,
  total: 0,
  percent: 0,
  phase: 'idle',
};

// ---------------------------------------------------------------------------
// Low-level IDB helpers
// ---------------------------------------------------------------------------

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const req = indexedDB.open(IDB_DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Try to load the cached ONNX model bytes from IndexedDB.
 * Returns null on any error or cache miss.
 */
export async function loadModelFromIDB(
  integrity: OnnxModelIntegrity,
): Promise<ArrayBuffer | null> {
  validateIntegrity(integrity);
  try {
    const db = await openIdb();
    const result = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.get(modelCacheKey(integrity));
      req.onsuccess = () => {
        db.close();
        resolve(req.result);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
    if (
      result instanceof ArrayBuffer &&
      await verifyOnnxModelIntegrity(result, integrity)
    ) {
      return result;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Persist ONNX model bytes to IndexedDB.
 * Silently swallows any storage errors (quota exceeded, private browsing, etc.).
 */
export async function storeModelToIDB(
  data: ArrayBuffer,
  integrity: OnnxModelIntegrity,
): Promise<void> {
  if (!(await verifyOnnxModelIntegrity(data, integrity))) return;
  try {
    const db = await openIdb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      for (const legacyKey of LEGACY_MODEL_KEYS) store.delete(legacyKey);
      const req = store.put(data, modelCacheKey(integrity));
      req.onsuccess = () => {
        db.close();
        resolve();
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch (err) {
    console.warn('[useOnnxLoader] IDB store failed:', err);
  }
}

// ---------------------------------------------------------------------------
// Stream helpers
// ---------------------------------------------------------------------------

function concatChunks(chunks: Uint8Array[], totalLength: number): ArrayBuffer {
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged.buffer;
}

function computeDownloadPercent(loaded: number, contentLength: number): number {
  if (contentLength > 0) {
    return Math.min(100, Math.round((loaded / contentLength) * 100));
  }
  if (loaded <= 0) return -1;
  return Math.min(99, Math.round((loaded / ESTIMATED_ONNX_BYTES) * 100));
}

function displayTotal(contentLength: number, loaded: number): number {
  if (contentLength > 0) return contentLength;
  if (loaded > 0) return ESTIMATED_ONNX_BYTES;
  return 0;
}

async function readResponseWithProgress(
  response: Response,
  integrity: OnnxModelIntegrity,
  onProgress?: (progress: OnnxLoadProgress) => void,
): Promise<ArrayBuffer> {
  validateIntegrity(integrity);
  const contentEncoding = response.headers.get('content-encoding')?.trim().toLowerCase();
  if (contentEncoding && contentEncoding !== 'identity') {
    await response.body?.cancel('compressed model response rejected').catch(() => undefined);
    throw new Error('Content-Encoding modello ONNX non consentito');
  }
  const declaredLength = response.headers.get('content-length');
  if (declaredLength && !/^\d+$/.test(declaredLength)) {
    await response.body?.cancel('invalid model content length').catch(() => undefined);
    throw new Error('Content-Length modello ONNX non valido');
  }
  const contentLength = declaredLength ? Number(declaredLength) : 0;
  if (
    !Number.isSafeInteger(contentLength) ||
    contentLength > MAX_ONNX_MODEL_BYTES ||
    (contentLength !== 0 && contentLength !== integrity.size)
  ) {
    await response.body?.cancel('model exceeds declared safety limit').catch(() => undefined);
    throw new Error('Modello ONNX oltre il limite di sicurezza');
  }
  const body = response.body;

  if (!body) {
    throw new Error('Risposta modello ONNX priva di stream bounded');
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  const emitDownload = () => {
    const percent = computeDownloadPercent(loaded, contentLength);
    onProgress?.({
      loaded,
      total: displayTotal(contentLength, loaded),
      percent,
      phase: 'downloading',
    });
  };

  emitDownload();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    loaded += value.byteLength;
    if (loaded > integrity.size) {
      await reader.cancel('model exceeds safety limit').catch(() => undefined);
      throw new Error('Modello ONNX oltre il limite di sicurezza');
    }
    chunks.push(value);
    emitDownload();
  }

  if (loaded !== integrity.size) {
    throw new Error('Dimensione modello ONNX diversa dal manifest');
  }
  return concatChunks(chunks, loaded);
}

function shortFetchLabel(url: string): string {
  try {
    const u = new URL(url, typeof window !== 'undefined' ? window.location.origin : undefined);
    return `${u.hostname}${u.pathname}`;
  } catch {
    return 'origine sconosciuta';
  }
}

async function fetchOnnxFromUrl(
  url: string,
  integrity: OnnxModelIntegrity,
  onProgress?: (progress: OnnxLoadProgress) => void,
): Promise<ArrayBuffer> {
  const emit = (progress: OnnxLoadProgress) => onProgress?.(progress);
  const label = shortFetchLabel(url);

  emit({ loaded: 0, total: 0, percent: -1, phase: 'downloading', reason: label });

  let resp: Response;
  try {
    const resolved = new URL(
      url,
      typeof window !== 'undefined' ? window.location.origin : 'https://local.invalid',
    );
    if (
      typeof window !== 'undefined' &&
      resolved.origin !== window.location.origin
    ) {
      throw new Error('ONNX model URL must be same-origin');
    }
    resp = await fetch(resolved.toString(), {
      mode: 'same-origin',
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'error',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[useOnnxLoader] fetch network error:', label, msg);
    emit({
      loaded: 0,
      total: 0,
      percent: 0,
      phase: 'failed',
      reason: `Rete: ${msg}`,
    });
    throw new Error(`Network error fetching ONNX from ${label}: ${msg}`);
  }

  if (!resp.ok) {
    await resp.body?.cancel('non-success model response').catch(() => undefined);
    const reason = `HTTP ${resp.status} da ${url}`;
    console.error('[useOnnxLoader]', reason);
    emit({ loaded: 0, total: 0, percent: 0, phase: 'failed', reason });
    throw new Error(`Failed to fetch ONNX model: ${reason}`);
  }

  const data = await readResponseWithProgress(resp, integrity, onProgress);

  if (data.byteLength < 100_000) {
    const reason = `File troppo piccolo (${data.byteLength} B) — probabile errore HTML/JSON`;
    emit({
      loaded: data.byteLength,
      total: data.byteLength,
      percent: 0,
      phase: 'failed',
      reason,
    });
    throw new Error(reason);
  }

  if (!(await verifyOnnxModelIntegrity(data, integrity))) {
    throw new Error('SHA-256 modello ONNX non corrisponde al manifest');
  }
  return data;
}

// ---------------------------------------------------------------------------
// Main export: fetch + cache (with URL fallbacks)
// ---------------------------------------------------------------------------

/**
 * Load ONNX model, using IndexedDB as a persistent cache.
 *
 * - First call: tries each URL in order, stores in IDB, returns ArrayBuffer.
 * - Subsequent calls: loads from IDB in < 100 ms, returns ArrayBuffer.
 *
 * Throws if both IDB and all network URLs fail.
 */
export async function fetchAndCacheOnnxModel(
  urls: string | string[],
  integrity: OnnxModelIntegrity,
  onProgress?: (progress: OnnxLoadProgress) => void,
): Promise<ArrayBuffer> {
  validateIntegrity(integrity);
  const urlList = (Array.isArray(urls) ? urls : [urls]).filter(Boolean);
  const emit = (progress: OnnxLoadProgress) => onProgress?.(progress);

  if (urlList.length === 0) {
    const reason = 'Nessun URL modello ONNX configurato';
    emit({ loaded: 0, total: 0, percent: 0, phase: 'failed', reason });
    throw new Error(reason);
  }

  // 1. IDB fast path
  const cached = await loadModelFromIDB(integrity);
  if (cached !== null) {
    emit({
      loaded: cached.byteLength,
      total: cached.byteLength,
      percent: 100,
      phase: 'ready',
    });
    return cached;
  }

  // 2. Network — try each URL until one succeeds
  let lastError: Error | null = null;

  for (let i = 0; i < urlList.length; i++) {
    const url = urlList[i];
    const isLast = i === urlList.length - 1;

    try {
      if (i > 0) {
        console.warn('[useOnnxLoader] Trying fallback URL:', url);
        emit({
          loaded: 0,
          total: 0,
          percent: -1,
          phase: 'downloading',
          reason: `Nuovo tentativo (${i + 1}/${urlList.length})…`,
        });
      }

      const data = await fetchOnnxFromUrl(url, integrity, onProgress);

      emit({
        loaded: data.byteLength,
        total: data.byteLength,
        percent: 100,
        phase: 'caching',
      });
      await storeModelToIDB(data, integrity);

      emit({
        loaded: data.byteLength,
        total: data.byteLength,
        percent: 100,
        phase: 'ready',
      });

      return data;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (!isLast) continue;
    }
  }

  const reason =
    lastError?.message ??
    'Download modello fallito — verificare il proxy scanner';
  console.error('[useOnnxLoader] All URLs failed:', urlList, reason);
  emit({ loaded: 0, total: 0, percent: 0, phase: 'failed', reason });
  throw lastError ?? new Error(reason);
}
