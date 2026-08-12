import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createGapUploadLeaseBackend,
  withGapUploadLock,
  type GapUploadLeaseBackend,
} from '@/lib/gap-recording/upload-lease';

interface LeaseValue { key: string; ownerId: string; expiresAt: number }

class MemoryLeaseDatabase {
  readonly values = new Map<string, LeaseValue>();

  asDatabase(): IDBDatabase { return this as unknown as IDBDatabase; }

  transaction() {
    const database = this;
    const transaction = {
      oncomplete: null as (() => void) | null,
      onerror: null as (() => void) | null,
      onabort: null as (() => void) | null,
      error: null,
      objectStore() {
        return {
          get(key: string) {
            const request = {
              result: undefined as LeaseValue | undefined,
              onsuccess: null as (() => void) | null,
            };
            queueMicrotask(() => {
              request.result = database.values.get(key);
              request.onsuccess?.();
              queueMicrotask(() => transaction.oncomplete?.());
            });
            return request;
          },
          put(value: LeaseValue) { database.values.set(value.key, value); },
          delete(key: string) { database.values.delete(key); },
        };
      },
    };
    return transaction;
  }
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('gap upload cross-tab lock', () => {
  it('does not run when Web Locks reports the lock as unavailable', async () => {
    const work = vi.fn(async () => 'unexpected');
    const lockManager = {
      request: vi.fn(async (
        _name: string,
        _options: LockOptions,
        callback: (lock: Lock | null) => Promise<unknown>,
      ) => callback(null)),
    } as unknown as LockManager;

    await expect(withGapUploadLock('match:user', work, { lockManager }))
      .resolves.toEqual({ acquired: false });
    expect(work).not.toHaveBeenCalled();
  });

  it('atomically excludes a second owner through the IndexedDB lease backend', async () => {
    const database = new MemoryLeaseDatabase();
    const backend = createGapUploadLeaseBackend(async () => database.asDatabase());
    let releaseFirst: (() => void) | undefined;
    const firstWork = new Promise<void>((resolve) => { releaseFirst = resolve; });
    const first = withGapUploadLock('match:user', async () => firstWork, {
      lockManager: null, leaseBackend: backend, ownerId: 'tab-1', now: () => 1,
    });
    await vi.waitFor(() => expect(database.values.get('match:user')?.ownerId).toBe('tab-1'));

    await expect(withGapUploadLock('match:user', async () => {}, {
      lockManager: null, leaseBackend: backend, ownerId: 'tab-2', now: () => 2,
    })).resolves.toEqual({ acquired: false });
    releaseFirst?.();
    await first;
  });

  it('renews an owned IndexedDB lease but not an expired one', async () => {
    const database = new MemoryLeaseDatabase();
    const backend = createGapUploadLeaseBackend(async () => database.asDatabase());

    await expect(backend.acquire('match:user', 'tab-1', 1)).resolves.toBe(true);
    await expect(backend.renew('match:user', 'tab-1', 20_000)).resolves.toBe(true);
    expect(database.values.get('match:user')?.expiresAt).toBe(80_000);
    await expect(backend.renew('match:user', 'tab-1', 80_000)).resolves.toBe(false);
  });

  it('renews ownership and aborts work when the heartbeat loses the lease', async () => {
    vi.useFakeTimers();
    const backend: GapUploadLeaseBackend = {
      acquire: vi.fn(async () => true),
      renew: vi.fn(async () => false),
      release: vi.fn(async () => {}),
    };
    const run = withGapUploadLock('match:user', (signal) => new Promise<string>((resolve) => {
      signal.addEventListener('abort', () => resolve('stopped'), { once: true });
    }), {
      lockManager: null, leaseBackend: backend, ownerId: 'tab-1',
      now: () => 10, renewIntervalMs: 20,
    });

    await vi.advanceTimersByTimeAsync(20);

    await expect(run).resolves.toEqual({ acquired: true, value: 'stopped' });
    expect(backend.renew).toHaveBeenCalledWith('match:user', 'tab-1', 10);
    expect(backend.release).toHaveBeenCalledWith('match:user', 'tab-1');
  });

  it('does not delete a lease that changed owner before release', async () => {
    const database = new MemoryLeaseDatabase();
    const backend = createGapUploadLeaseBackend(async () => database.asDatabase());

    await withGapUploadLock('match:user', async () => {
      database.values.set('match:user', { key: 'match:user', ownerId: 'tab-2', expiresAt: 99 });
    }, {
      lockManager: null, leaseBackend: backend, ownerId: 'tab-1', now: () => 1,
    });

    expect(database.values.get('match:user')?.ownerId).toBe('tab-2');
  });
});
