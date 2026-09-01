export const CLIPS_STORE = 'clips';
export const INCIDENTS_STORE = 'incidents';
export const RESERVATIONS_STORE = 'incident-reservations';

const DATABASE_NAME = 'ebartex-match-gap-v1';
const DATABASE_VERSION = 3;
let databasePromise: Promise<IDBDatabase> | null = null;

export function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

export function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(
      transaction.error ?? new Error('IndexedDB transaction failed'),
    );
    transaction.onabort = () => reject(
      transaction.error ?? new Error('IndexedDB transaction aborted'),
    );
  });
}

export function openGapDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = (event) => {
      const database = request.result;
      const oldVersion = (event as IDBVersionChangeEvent).oldVersion;
      if (oldVersion === 0) {
        const clips = database.createObjectStore(CLIPS_STORE, { keyPath: 'id' });
        clips.createIndex('matchUser', 'matchUserKey', { unique: false });
        clips.createIndex('incident', 'incidentId', { unique: false });
        clips.createIndex('endedAt', 'endedAt', { unique: false });
        const incidents = database.createObjectStore(INCIDENTS_STORE, { keyPath: 'id' });
        incidents.createIndex('matchUser', 'matchUserKey', { unique: false });
        incidents.createIndex('status', 'status', { unique: false });
        incidents.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
      if (oldVersion > 0 && oldVersion < 2) {
        request.transaction?.objectStore(CLIPS_STORE).clear();
        request.transaction?.objectStore(INCIDENTS_STORE).clear();
      }
      if (oldVersion < 3) {
        const reservations = database.createObjectStore(RESERVATIONS_STORE, {
          keyPath: 'matchUserKey',
        });
        reservations.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      databasePromise = null;
      reject(request.error ?? new Error('IndexedDB open failed'));
    };
  });
  return databasePromise;
}

export function getAllFromIndex<T>(
  store: IDBObjectStore,
  indexName: string,
  key: IDBValidKey,
): Promise<T[]> {
  return requestResult(store.index(indexName).getAll(IDBKeyRange.only(key)) as IDBRequest<T[]>);
}
