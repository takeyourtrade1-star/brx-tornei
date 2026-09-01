import { describe, expect, it } from 'vitest';
import { GapRecordingCoordinator } from '@/lib/gap-recording/coordinator';
import type { GapRecordingStore } from '@/lib/gap-recording/indexed-db';
import { newGapIncident } from '@/lib/gap-recording/incidents';
import { makeMatchUserKey } from '@/lib/gap-recording/policy';
import type {
  GapClipRecord,
  GapIncidentRecord,
  GapProtectionSnapshot,
  RecordedClip,
} from '@/lib/gap-recording/types';

class MemoryGapStore implements GapRecordingStore {
  readonly clips = new Map<string, GapClipRecord>();
  readonly incidents = new Map<string, GapIncidentRecord>();
  readonly reservations = new Map<string, { count: number; updatedAt: number }>();

  async tryReserveIncident(matchUserKey: string, maxIncidents: number, reservedAt: number) {
    const current = this.reservations.get(matchUserKey);
    if ((current?.count ?? 0) >= maxIncidents) return false;
    this.reservations.set(matchUserKey, {
      count: (current?.count ?? 0) + 1,
      updatedAt: reservedAt,
    });
    return true;
  }

  async putClip(clip: GapClipRecord) {
    this.clips.set(clip.id, clip);
  }

  async putIncident(incident: GapIncidentRecord) {
    this.incidents.set(incident.id, { ...incident });
  }

  async getIncident(id: string) {
    return this.incidents.get(id);
  }

  async listIncidents(matchUserKey: string) {
    return [...this.incidents.values()].filter(
      (incident) => incident.matchUserKey === matchUserKey,
    );
  }

  async listIncidentClips(incidentId: string) {
    return [...this.clips.values()]
      .filter((clip) => clip.incidentId === incidentId)
      .sort((left, right) => left.sequence - right.sequence);
  }

  async assignWindow(
    matchUserKey: string,
    incidentId: string,
    from: number,
    until: number | null,
  ) {
    const selected = [...this.clips.values()].filter(
      (clip) =>
        clip.matchUserKey === matchUserKey &&
        (clip.incidentId === null || clip.incidentId === incidentId) &&
        clip.endedAt >= from &&
        (until === null || clip.startedAt <= until),
    );
    for (const clip of selected) {
      clip.incidentId = incidentId;
      this.clips.set(clip.id, clip);
    }
    return selected.sort((left, right) => left.sequence - right.sequence);
  }

  async pruneRolling(matchUserKey: string, cutoff: number) {
    for (const [id, clip] of this.clips) {
      if (
        clip.matchUserKey === matchUserKey &&
        clip.incidentId === null &&
        clip.endedAt < cutoff
      ) {
        this.clips.delete(id);
      }
    }
  }

  async deleteUnassigned(matchUserKey: string) {
    for (const [id, clip] of this.clips) {
      if (clip.matchUserKey === matchUserKey && clip.incidentId === null) {
        this.clips.delete(id);
      }
    }
  }

  async deleteIncidentData(incidentId: string) {
    for (const [id, clip] of this.clips) {
      if (clip.incidentId === incidentId) this.clips.delete(id);
    }
    this.incidents.delete(incidentId);
  }

  async deleteExpired(before: number) {
    for (const [id, clip] of this.clips) {
      if (clip.incidentId === null && clip.endedAt < before) this.clips.delete(id);
    }
    for (const incident of [...this.incidents.values()]) {
      if (incident.updatedAt < before) await this.deleteIncidentData(incident.id);
    }
    // Le prenotazioni restano monotone anche quando il filmato locale scade.
  }
}

function recordedClip(id: string, sequence: number, startedAt: number, endedAt: number): RecordedClip {
  return {
    id,
    recordingSessionId: 'recording-session',
    sequence,
    startedAt,
    endedAt,
    mimeType: 'video/webm',
    blob: new Blob(['clip-data'], { type: 'video/webm' }),
  };
}

function setup(nowRef: { value: number }) {
  const store = new MemoryGapStore();
  const snapshots: GapProtectionSnapshot[] = [];
  let nextId = 1;
  const coordinator = new GapRecordingCoordinator({
    store,
    matchId: 'match-id',
    webcamSessionId: 'webcam-id',
    userId: 'user-id',
    onSnapshot: (snapshot) => snapshots.push(snapshot),
    now: () => nowRef.value,
    makeId: () => `incident-${nextId++}`,
  });
  return { coordinator, snapshots, store };
}

describe('gap recording coordinator', () => {
  it('does not create an incident during the first P2P handshake', async () => {
    const now = { value: 20_000 };
    const { coordinator, store } = setup(now);
    await coordinator.initialize();
    await coordinator.observePeer('reconnecting');
    await coordinator.acceptClip(recordedClip('clip-1', 1, 15_000, 20_000));
    await coordinator.finish();
    expect(store.incidents.size).toBe(0);
    expect(store.clips.size).toBe(0);
  });

  it('keeps the ten second pre-roll and five second post-roll policy', async () => {
    const now = { value: 30_000 };
    const { coordinator, store } = setup(now);
    await coordinator.initialize();
    await coordinator.observePeer('connected');
    await coordinator.acceptClip(recordedClip('pre-roll', 1, 20_000, 25_000));
    await coordinator.observePeer('reconnecting');
    const [incident] = [...store.incidents.values()];
    expect(incident.captureStartedAt).toBe(20_000);
    now.value = 35_000;
    await coordinator.observePeer('connected');
    expect(store.incidents.get(incident.id)?.captureEndedAt).toBe(40_000);
  });

  it('retains pre-roll and gap clips only after a real connection loss', async () => {
    const now = { value: 15_000 };
    const { coordinator, snapshots, store } = setup(now);
    await coordinator.initialize();
    await coordinator.acceptClip(recordedClip('pre-roll', 1, 10_000, 15_000));
    await coordinator.observePeer('connected');
    now.value = 20_000;
    await coordinator.observePeer('reconnecting');
    now.value = 25_000;
    await coordinator.acceptClip(recordedClip('gap', 2, 20_000, 25_000));
    await coordinator.finish();

    const [incident] = [...store.incidents.values()];
    expect(incident.status).toBe('awaiting-consent');
    expect(incident.clipIds).toEqual(['pre-roll', 'gap']);
    expect(snapshots.at(-1)?.pendingIncidents).toBe(1);
    expect(snapshots.at(-1)?.consentRequiredIncidents).toBe(1);

    now.value = 30_000;
    await coordinator.grantUploadConsent(incident.id);
    expect(store.incidents.get(incident.id)).toMatchObject({
      status: 'queued',
      uploadConsentedAt: 30_000,
      uploadConsentVersion: 'peer-gap-review-v1',
    });
  });

  it('consente un solo incidente e conserva gli altri in attesa', async () => {
    const now = { value: 20_000 };
    const { coordinator, store } = setup(now);
    await coordinator.initialize();
    await coordinator.observePeer('connected');
    await coordinator.observePeer('reconnecting');
    await coordinator.acceptClip(recordedClip('clip-a', 1, 10_000, 20_000));
    await coordinator.finish();

    now.value = 40_000;
    await coordinator.observePeer('connected');
    await coordinator.observePeer('reconnecting');
    await coordinator.acceptClip(recordedClip('clip-b', 2, 30_000, 40_000));
    await coordinator.finish();

    await coordinator.grantUploadConsent('incident-1');
    expect(store.incidents.get('incident-1')?.status).toBe('queued');
    expect(store.incidents.get('incident-2')?.status).toBe('awaiting-consent');
    await coordinator.declineUpload('incident-2');
    expect(store.incidents.has('incident-2')).toBe(false);
  });

  it('mantiene il limite cumulativo di cinque incidenti anche dopo il rifiuto', async () => {
    const now = { value: 20_000 };
    const { coordinator, store } = setup(now);
    await coordinator.initialize();
    for (let index = 1; index <= 6; index += 1) {
      now.value += 20_000;
      await coordinator.observePeer('connected');
      await coordinator.observePeer('reconnecting');
      await coordinator.acceptClip(recordedClip(
        `clip-${index}`,
        index,
        now.value - 5_000,
        now.value,
      ));
      await coordinator.finish();
      await coordinator.declineUpload(`incident-${index}`);
    }
    expect(store.reservations.get(makeMatchUserKey('match-id', 'user-id'))?.count).toBe(5);
    expect(store.incidents.size).toBe(0);

    now.value += 73 * 60 * 60 * 1_000;
    await store.deleteExpired(now.value - 72 * 60 * 60 * 1_000);
    expect(await store.tryReserveIncident(
      makeMatchUserKey('match-id', 'user-id'),
      5,
      now.value,
    )).toBe(false);
  });

  it('recovers an open browser incident as interrupted without inventing footage', async () => {
    const now = { value: 50_000 };
    const { coordinator, store } = setup(now);
    const matchUserKey = makeMatchUserKey('match-id', 'user-id');
    const incident = newGapIncident({
      id: 'old-incident',
      matchId: 'match-id',
      webcamSessionId: 'webcam-id',
      userId: 'user-id',
      matchUserKey,
      detectedAt: 30_000,
      captureStartedAt: 20_000,
    });
    await store.putIncident(incident);
    await store.putClip({
      ...recordedClip('old-clip', 1, 20_000, 25_000),
      matchId: 'match-id',
      userId: 'user-id',
      matchUserKey,
      byteLength: 9,
      incidentId: incident.id,
    });

    await coordinator.initialize();
    expect(store.incidents.get(incident.id)).toMatchObject({
      status: 'awaiting-consent',
      interrupted: true,
      captureEndedAt: 25_000,
    });
  });
});
