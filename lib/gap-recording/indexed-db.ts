import type {
  GapClipRecord,
  GapIncidentRecord,
} from '@/lib/gap-recording/types';

const DATABASE_NAME = 'ebartex-match-gap-v1';
const DATABASE_VERSION = 1;
const CLIPS_STORE = 'clips';
const INCIDENTS_STORE = 'incidents';

export interface GapRecordingStore {
  putClip: (clip: GapClipRecord) => Promise<void>;
  putIncident: (incident: GapIncidentRecord) => Promise<void>;
  getIncident: (incidentId: string) => Promise<GapIncidentRecord | undefined>;
  listIncidents: (matchUserKey: string) => Promise<GapIncidentRecord[]>;
  listIncidentClips: (incidentId: string) => Promise<GapClipRecord[]>;
  assignWindow: (
    matchUserKey: string,
    incidentId: string,
    from: number,
    until: number | null,
  ) => Promise<GapClipRecord[]>;
  pruneRolling: (matchUserKey: string, cutoff: number) => Promise<void>;
  deleteIncidentData: (incidentId: string) => Promise<void>;
  deleteExpired: (before: number) => Promise<void>;
}

let databasePromise: Promise<IDBDatabase> | null = null;

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      const clips = database.createObjectStore(CLIPS_STORE, { keyPath: 'id' });
      clips.createIndex('matchUser', 'matchUserKey', { unique: false });
      clips.createIndex('incident', 'incidentId', { unique: false });
      clips.createIndex('endedAt', 'endedAt', { unique: false });
      const incidents = database.createObjectStore(INCIDENTS_STORE, { keyPath: 'id' });
      incidents.createIndex('matchUser', 'matchUserKey', { unique: false });
      incidents.createIndex('status', 'status', { unique: false });
      incidents.createIndex('updatedAt', 'updatedAt', { unique: false });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      databasePromise = null;
      reject(request.error ?? new Error('IndexedDB open failed'));
    };
  });
  return databasePromise;
}

async function getAllFromIndex<T>(
  store: IDBObjectStore,
  indexName: string,
  key: IDBValidKey,
): Promise<T[]> {
  return requestResult(store.index(indexName).getAll(IDBKeyRange.only(key)) as IDBRequest<T[]>);
}

export class IndexedDbGapRecordingStore implements GapRecordingStore {
  async putClip(clip: GapClipRecord): Promise<void> {
    const database = await openDatabase();
    const transaction = database.transaction(CLIPS_STORE, 'readwrite');
    const done = transactionDone(transaction);
    transaction.objectStore(CLIPS_STORE).put(clip);
    await done;
  }

  async putIncident(incident: GapIncidentRecord): Promise<void> {
    const database = await openDatabase();
    const transaction = database.transaction(INCIDENTS_STORE, 'readwrite');
    const done = transactionDone(transaction);
    transaction.objectStore(INCIDENTS_STORE).put(incident);
    await done;
  }

  async getIncident(incidentId: string): Promise<GapIncidentRecord | undefined> {
    const database = await openDatabase();
    const transaction = database.transaction(INCIDENTS_STORE, 'readonly');
    const done = transactionDone(transaction);
    const result = await requestResult(
      transaction.objectStore(INCIDENTS_STORE).get(incidentId) as IDBRequest<
        GapIncidentRecord | undefined
      >,
    );
    await done;
    return result;
  }

  async listIncidents(matchUserKey: string): Promise<GapIncidentRecord[]> {
    const database = await openDatabase();
    const transaction = database.transaction(INCIDENTS_STORE, 'readonly');
    const done = transactionDone(transaction);
    const result = await getAllFromIndex<GapIncidentRecord>(
      transaction.objectStore(INCIDENTS_STORE),
      'matchUser',
      matchUserKey,
    );
    await done;
    return result;
  }

  async listIncidentClips(incidentId: string): Promise<GapClipRecord[]> {
    const database = await openDatabase();
    const transaction = database.transaction(CLIPS_STORE, 'readonly');
    const done = transactionDone(transaction);
    const result = await getAllFromIndex<GapClipRecord>(
      transaction.objectStore(CLIPS_STORE),
      'incident',
      incidentId,
    );
    await done;
    return result.sort((left, right) => left.sequence - right.sequence);
  }

  async assignWindow(
    matchUserKey: string,
    incidentId: string,
    from: number,
    until: number | null,
  ): Promise<GapClipRecord[]> {
    const database = await openDatabase();
    const transaction = database.transaction(CLIPS_STORE, 'readwrite');
    const done = transactionDone(transaction);
    const store = transaction.objectStore(CLIPS_STORE);
    const clips = await getAllFromIndex<GapClipRecord>(store, 'matchUser', matchUserKey);
    const selected = clips.filter(
      (clip) =>
        (clip.incidentId === null || clip.incidentId === incidentId) &&
        clip.endedAt >= from &&
        (until === null || clip.startedAt <= until),
    );
    for (const clip of selected) {
      clip.incidentId = incidentId;
      store.put(clip);
    }
    await done;
    return selected.sort((left, right) => left.sequence - right.sequence);
  }

  async pruneRolling(matchUserKey: string, cutoff: number): Promise<void> {
    const database = await openDatabase();
    const transaction = database.transaction(CLIPS_STORE, 'readwrite');
    const done = transactionDone(transaction);
    const store = transaction.objectStore(CLIPS_STORE);
    const clips = await getAllFromIndex<GapClipRecord>(store, 'matchUser', matchUserKey);
    for (const clip of clips) {
      if (clip.incidentId === null && clip.endedAt < cutoff) store.delete(clip.id);
    }
    await done;
  }

  async deleteIncidentData(incidentId: string): Promise<void> {
    const database = await openDatabase();
    const transaction = database.transaction([CLIPS_STORE, INCIDENTS_STORE], 'readwrite');
    const done = transactionDone(transaction);
    const clipStore = transaction.objectStore(CLIPS_STORE);
    const clips = await getAllFromIndex<GapClipRecord>(clipStore, 'incident', incidentId);
    for (const clip of clips) clipStore.delete(clip.id);
    transaction.objectStore(INCIDENTS_STORE).delete(incidentId);
    await done;
  }

  async deleteExpired(before: number): Promise<void> {
    const database = await openDatabase();
    const transaction = database.transaction([CLIPS_STORE, INCIDENTS_STORE], 'readwrite');
    const done = transactionDone(transaction);
    const incidentStore = transaction.objectStore(INCIDENTS_STORE);
    const incidents = await requestResult(
      incidentStore.getAll() as IDBRequest<GapIncidentRecord[]>,
    );
    const expiredIds = new Set(
      incidents.filter((incident) => incident.updatedAt < before).map((incident) => incident.id),
    );
    if (expiredIds.size > 0) {
      const clipStore = transaction.objectStore(CLIPS_STORE);
      const clips = await requestResult(clipStore.getAll() as IDBRequest<GapClipRecord[]>);
      for (const clip of clips) {
        if (clip.incidentId && expiredIds.has(clip.incidentId)) clipStore.delete(clip.id);
      }
      for (const incidentId of expiredIds) incidentStore.delete(incidentId);
    }
    await done;
  }
}
