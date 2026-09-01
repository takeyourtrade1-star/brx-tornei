import type {
  GapClipRecord,
  GapIncidentRecord,
} from '@/lib/gap-recording/types';
import { expiredGapIncidentIds } from '@/lib/gap-recording/retention';
import {
  CLIPS_STORE,
  getAllFromIndex,
  INCIDENTS_STORE,
  openGapDatabase,
  requestResult,
  RESERVATIONS_STORE,
  transactionDone,
} from '@/lib/gap-recording/indexed-db-core';

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
  deleteUnassigned: (matchUserKey: string) => Promise<void>;
  deleteIncidentData: (incidentId: string) => Promise<void>;
  deleteExpired: (before: number) => Promise<void>;
  tryReserveIncident: (
    matchUserKey: string,
    maxIncidents: number,
    reservedAt: number,
  ) => Promise<boolean>;
}


export class IndexedDbGapRecordingStore implements GapRecordingStore {
  async tryReserveIncident(
    matchUserKey: string,
    maxIncidents: number,
    reservedAt: number,
  ): Promise<boolean> {
    const database = await openGapDatabase();
    const transaction = database.transaction(RESERVATIONS_STORE, 'readwrite');
    const done = transactionDone(transaction);
    const store = transaction.objectStore(RESERVATIONS_STORE);
    const current = await requestResult(store.get(matchUserKey) as IDBRequest<
      { matchUserKey: string; count: number; updatedAt: number } | undefined
    >);
    if ((current?.count ?? 0) >= maxIncidents) {
      await done;
      return false;
    }
    store.put({
      matchUserKey,
      count: (current?.count ?? 0) + 1,
      updatedAt: reservedAt,
    });
    await done;
    return true;
  }

  async putClip(clip: GapClipRecord): Promise<void> {
    const database = await openGapDatabase();
    const transaction = database.transaction(CLIPS_STORE, 'readwrite');
    const done = transactionDone(transaction);
    transaction.objectStore(CLIPS_STORE).put(clip);
    await done;
  }

  async putIncident(incident: GapIncidentRecord): Promise<void> {
    const database = await openGapDatabase();
    const transaction = database.transaction(INCIDENTS_STORE, 'readwrite');
    const done = transactionDone(transaction);
    transaction.objectStore(INCIDENTS_STORE).put(incident);
    await done;
  }

  async getIncident(incidentId: string): Promise<GapIncidentRecord | undefined> {
    const database = await openGapDatabase();
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
    const database = await openGapDatabase();
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
    const database = await openGapDatabase();
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
    const database = await openGapDatabase();
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
    const database = await openGapDatabase();
    const transaction = database.transaction(CLIPS_STORE, 'readwrite');
    const done = transactionDone(transaction);
    const store = transaction.objectStore(CLIPS_STORE);
    const clips = await getAllFromIndex<GapClipRecord>(store, 'matchUser', matchUserKey);
    for (const clip of clips) {
      if (clip.incidentId === null && clip.endedAt < cutoff) store.delete(clip.id);
    }
    await done;
  }

  async deleteUnassigned(matchUserKey: string): Promise<void> {
    const database = await openGapDatabase();
    const transaction = database.transaction(CLIPS_STORE, 'readwrite');
    const done = transactionDone(transaction);
    const store = transaction.objectStore(CLIPS_STORE);
    const clips = await getAllFromIndex<GapClipRecord>(store, 'matchUser', matchUserKey);
    for (const clip of clips) {
      if (clip.incidentId === null) store.delete(clip.id);
    }
    await done;
  }

  async deleteIncidentData(incidentId: string): Promise<void> {
    const database = await openGapDatabase();
    const transaction = database.transaction([CLIPS_STORE, INCIDENTS_STORE], 'readwrite');
    const done = transactionDone(transaction);
    const clipStore = transaction.objectStore(CLIPS_STORE);
    const clips = await getAllFromIndex<GapClipRecord>(clipStore, 'incident', incidentId);
    for (const clip of clips) clipStore.delete(clip.id);
    transaction.objectStore(INCIDENTS_STORE).delete(incidentId);
    await done;
  }

  async deleteExpired(before: number): Promise<void> {
    const database = await openGapDatabase();
    const transaction = database.transaction(
      [CLIPS_STORE, INCIDENTS_STORE],
      'readwrite',
    );
    const done = transactionDone(transaction);
    const incidentStore = transaction.objectStore(INCIDENTS_STORE);
    const incidents = await requestResult(
      incidentStore.getAll() as IDBRequest<GapIncidentRecord[]>,
    );
    const expiredIds = expiredGapIncidentIds(incidents, before);
    const clipStore = transaction.objectStore(CLIPS_STORE);
    const clips = await requestResult(clipStore.getAll() as IDBRequest<GapClipRecord[]>);
    for (const clip of clips) {
      if (
        (clip.incidentId === null && clip.endedAt < before) ||
        (clip.incidentId !== null && expiredIds.has(clip.incidentId))
      ) clipStore.delete(clip.id);
    }
    if (expiredIds.size > 0) {
      for (const incidentId of expiredIds) incidentStore.delete(incidentId);
    }
    // Il filmato scade dopo 72 ore; il contatore di sicurezza no. Mantenerlo
    // monotono impedisce che lo stesso match riapra altri cinque incidenti.
    await done;
  }
}
