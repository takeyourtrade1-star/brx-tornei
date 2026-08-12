const LOCK_DATABASE_NAME = 'ebartex-match-gap-upload-lock-v1';
const LOCK_STORE = 'leases';
const LEASE_TTL_MS = 60_000;
const LEASE_RENEW_MS = 20_000;

interface GapUploadLease {
  key: string;
  ownerId: string;
  expiresAt: number;
}

export interface GapUploadLeaseBackend {
  acquire: (key: string, ownerId: string, now: number) => Promise<boolean>;
  renew: (key: string, ownerId: string, now: number) => Promise<boolean>;
  release: (key: string, ownerId: string) => Promise<void>;
}

let lockDatabasePromise: Promise<IDBDatabase> | null = null;

function openLockDatabase(): Promise<IDBDatabase> {
  if (lockDatabasePromise) return lockDatabasePromise;
  lockDatabasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(LOCK_DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(LOCK_STORE, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      lockDatabasePromise = null;
      reject(request.error ?? new Error('Upload lock database failed'));
    };
  });
  return lockDatabasePromise;
}

function updateLease(
  openDatabase: () => Promise<IDBDatabase>,
  key: string,
  ownerId: string,
  now: number,
  mode: 'acquire' | 'renew',
): Promise<boolean> {
  return openDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(LOCK_STORE, 'readwrite');
    const store = transaction.objectStore(LOCK_STORE);
    let updated = false;
    const request = store.get(key) as IDBRequest<GapUploadLease | undefined>;
    request.onsuccess = () => {
      const current = request.result;
      const mayAcquire = !current || current.expiresAt <= now || current.ownerId === ownerId;
      const mayRenew = current?.ownerId === ownerId && current.expiresAt > now;
      if ((mode === 'acquire' && mayAcquire) || (mode === 'renew' && mayRenew)) {
        store.put({ key, ownerId, expiresAt: now + LEASE_TTL_MS });
        updated = true;
      }
    };
    transaction.oncomplete = () => resolve(updated);
    transaction.onerror = () => reject(transaction.error ?? new Error('Upload lease failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Upload lease aborted'));
  }));
}

function releaseLease(
  openDatabase: () => Promise<IDBDatabase>,
  key: string,
  ownerId: string,
): Promise<void> {
  return openDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(LOCK_STORE, 'readwrite');
    const store = transaction.objectStore(LOCK_STORE);
    const request = store.get(key) as IDBRequest<GapUploadLease | undefined>;
    request.onsuccess = () => {
      if (request.result?.ownerId === ownerId) store.delete(key);
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Upload lease failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Upload lease aborted'));
  }));
}

export function createGapUploadLeaseBackend(
  openDatabase: () => Promise<IDBDatabase>,
): GapUploadLeaseBackend {
  return {
    acquire: (key, ownerId, now) => updateLease(openDatabase, key, ownerId, now, 'acquire'),
    renew: (key, ownerId, now) => updateLease(openDatabase, key, ownerId, now, 'renew'),
    release: (key, ownerId) => releaseLease(openDatabase, key, ownerId),
  };
}

const indexedDbLeaseBackend = createGapUploadLeaseBackend(openLockDatabase);

export interface GapUploadLockOptions {
  leaseBackend?: GapUploadLeaseBackend;
  lockManager?: LockManager | null;
  ownerId?: string;
  now?: () => number;
  renewIntervalMs?: number;
}

export interface GapUploadLockResult<T> {
  acquired: boolean;
  value?: T;
}

export async function withGapUploadLock<T>(
  key: string,
  work: (signal: AbortSignal) => Promise<T>,
  options: GapUploadLockOptions = {},
): Promise<GapUploadLockResult<T>> {
  const lockManager = options.lockManager === undefined ? navigator.locks ?? null : options.lockManager;
  if (lockManager) {
    return lockManager.request(`ebartex-gap-upload:${key}`, {
      mode: 'exclusive', ifAvailable: true,
    }, async (lock) => lock
      ? { acquired: true, value: await work(new AbortController().signal) }
      : { acquired: false });
  }

  const backend = options.leaseBackend ?? indexedDbLeaseBackend;
  const ownerId = options.ownerId ?? crypto.randomUUID();
  const now = options.now ?? Date.now;
  if (!await backend.acquire(key, ownerId, now())) return { acquired: false };
  const controller = new AbortController();
  const heartbeat = setInterval(() => {
    void backend.renew(key, ownerId, now()).then((renewed) => {
      if (!renewed) controller.abort();
    }).catch(() => controller.abort());
  }, options.renewIntervalMs ?? LEASE_RENEW_MS);
  try {
    return { acquired: true, value: await work(controller.signal) };
  } finally {
    clearInterval(heartbeat);
    await backend.release(key, ownerId);
  }
}
