import {
  captureCapAt,
  GAP_CLIP_DURATION_MS,
  GAP_LOCAL_TTL_MS,
  GAP_MAX_BYTES,
  GAP_POST_ROLL_MS,
  GAP_PRE_ROLL_MS,
  isGapConnectedState,
  isGapLossState,
  makeMatchUserKey,
} from '@/lib/gap-recording/policy';
import type { GapRecordingStore } from '@/lib/gap-recording/indexed-db';
import {
  declinePendingGapUploads,
  grantPendingGapConsent,
  persistGapClip,
  retryFailedGapUploads,
} from '@/lib/gap-recording/coordinator-storage';
import {
  buildGapSnapshot,
  finalizeGapIncident,
  newGapIncident,
  recoverInterruptedIncidents,
  withClipSummary,
} from '@/lib/gap-recording/incidents';
import type { GapCoordinatorOptions, GapIncidentRecord, GapProtectionSnapshot, RecordedClip } from '@/lib/gap-recording/types';
import type { PeerLinkState } from '@/lib/webrtc/match-peer-types';

export class GapRecordingCoordinator {
  private readonly store: GapRecordingStore;
  private readonly matchId: string;
  private readonly webcamSessionId: string;
  private readonly userId: string;
  private readonly matchUserKey: string;
  private readonly onSnapshot: (snapshot: GapProtectionSnapshot) => void;
  private readonly now: () => number;
  private readonly makeId: () => string;
  private work: Promise<void> = Promise.resolve();
  private activeIncident: GapIncidentRecord | null = null;
  private everConnected = false;
  private suppressUntilReconnect = false;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private capTimer: ReturnType<typeof setTimeout> | null = null;
  private lastError: string | null = null;

  constructor({ store, matchId, webcamSessionId, userId, onSnapshot,
    now = Date.now, makeId = () => crypto.randomUUID() }: GapCoordinatorOptions) {
    this.store = store;
    this.matchId = matchId;
    this.webcamSessionId = webcamSessionId;
    this.userId = userId;
    this.matchUserKey = makeMatchUserKey(matchId, userId);
    this.onSnapshot = onSnapshot;
    this.now = now;
    this.makeId = makeId;
  }

  initialize(): Promise<void> {
    return this.enqueue(async () => {
      await this.store.deleteExpired(this.now() - GAP_LOCAL_TTL_MS);
      await recoverInterruptedIncidents(this.store, this.matchUserKey, this.now());
      await this.publishSnapshot();
    });
  }

  observePeer(state: PeerLinkState): Promise<void> {
    return this.enqueue(async () => {
      if (isGapConnectedState(state)) {
        this.everConnected = true;
        this.suppressUntilReconnect = false;
        if (this.activeIncident?.status === 'capturing') await this.beginClosing();
      } else if (isGapLossState(state) && this.everConnected) {
        if (this.activeIncident?.status === 'closing') await this.resumeCapture();
        else if (!this.activeIncident && !this.suppressUntilReconnect) await this.openIncident();
      }
      await this.publishSnapshot();
    });
  }

  acceptClip(clip: RecordedClip): Promise<void> {
    return this.enqueue(async () => {
      const belongsToIncident = await persistGapClip({
        store: this.store,
        matchId: this.matchId,
        userId: this.userId,
        matchUserKey: this.matchUserKey,
        incident: this.activeIncident,
        clip,
        now: this.now(),
      });
      if (belongsToIncident) await this.refreshActiveIncident();
      await this.publishSnapshot();
    });
  }

  finish(interrupted = false): Promise<void> {
    return this.enqueue(async () => {
      if (this.activeIncident) {
        this.activeIncident.captureEndedAt = this.now();
        this.activeIncident.interrupted ||= interrupted;
        await this.finalizeActive();
      }
      this.clearTimers();
      await this.store.deleteUnassigned(this.matchUserKey);
      await this.publishSnapshot();
    });
  }

  reportError(message: string): void {
    this.lastError = message;
    void this.enqueue(() => this.publishSnapshot());
  }

  refresh(): Promise<void> {
    return this.enqueue(() => this.publishSnapshot());
  }

  grantUploadConsent(): Promise<void> {
    return this.enqueue(async () => {
      await grantPendingGapConsent(this.store, this.matchUserKey, this.now());
      await this.publishSnapshot();
    });
  }

  declineUpload(): Promise<void> {
    return this.enqueue(async () => {
      await declinePendingGapUploads(this.store, this.matchUserKey);
      await this.publishSnapshot();
    });
  }

  async retryUpload(): Promise<void> {
    await retryFailedGapUploads(this.store, this.matchUserKey, this.now());
    await this.refresh();
  }
  private enqueue(operation: () => Promise<void>): Promise<void> {
    const next = this.work.then(operation, operation);
    this.work = next.catch((error: unknown) => {
      this.lastError =
        error instanceof Error ? error.message : 'Errore nel buffer locale della partita.';
      void this.publishSnapshot().catch(() => {});
    });
    return this.work;
  }

  private async openIncident(): Promise<void> {
    const detectedAt = this.now();
    const incident = newGapIncident({
      id: this.makeId(),
      matchId: this.matchId,
      webcamSessionId: this.webcamSessionId,
      userId: this.userId,
      matchUserKey: this.matchUserKey,
      detectedAt,
      captureStartedAt: detectedAt - GAP_PRE_ROLL_MS,
    });
    this.activeIncident = incident;
    await this.store.putIncident(incident);
    await this.store.assignWindow(
      this.matchUserKey,
      incident.id,
      incident.captureStartedAt,
      null,
    );
    await this.refreshActiveIncident();
    const capDelay = Math.max(0, captureCapAt(incident.captureStartedAt) - this.now());
    this.capTimer = setTimeout(() => void this.capIncident(), capDelay);
  }

  private async beginClosing(): Promise<void> {
    if (!this.activeIncident) return;
    this.activeIncident = {
      ...this.activeIncident,
      captureEndedAt: this.now() + GAP_POST_ROLL_MS,
      status: 'closing',
      updatedAt: this.now(),
    };
    await this.store.putIncident(this.activeIncident);
    const delay = GAP_POST_ROLL_MS + GAP_CLIP_DURATION_MS + 250;
    this.closeTimer = setTimeout(() => void this.finalizeAfterPostRoll(), delay);
  }

  private async resumeCapture(): Promise<void> {
    if (!this.activeIncident) return;
    if (this.closeTimer) clearTimeout(this.closeTimer);
    this.closeTimer = null;
    this.activeIncident = {
      ...this.activeIncident,
      captureEndedAt: null,
      status: 'capturing',
      updatedAt: this.now(),
    };
    await this.store.putIncident(this.activeIncident);
  }

  private capIncident(): Promise<void> {
    return this.enqueue(async () => {
      if (!this.activeIncident) return;
      this.activeIncident.captureEndedAt = captureCapAt(
        this.activeIncident.captureStartedAt,
      );
      this.activeIncident.captureCapped = true;
      this.suppressUntilReconnect = true;
      await this.finalizeActive();
      await this.publishSnapshot();
    });
  }

  private finalizeAfterPostRoll(): Promise<void> {
    return this.enqueue(async () => {
      await this.finalizeActive();
      await this.publishSnapshot();
    });
  }

  private async finalizeActive(): Promise<void> {
    const incident = this.activeIncident;
    if (!incident) return;
    this.clearTimers();
    await finalizeGapIncident(this.store, incident, this.now());
    this.activeIncident = null;
  }

  private async refreshActiveIncident(): Promise<void> {
    const incident = this.activeIncident;
    if (!incident) return;
    const clips = await this.store.listIncidentClips(incident.id);
    this.activeIncident = withClipSummary(incident, clips, this.now());
    if (this.activeIncident.byteLength >= GAP_MAX_BYTES) {
      this.activeIncident.captureCapped = true;
      this.activeIncident.captureEndedAt = clips.at(-1)?.endedAt ?? this.now();
      this.suppressUntilReconnect = true;
      await this.finalizeActive();
      return;
    }
    await this.store.putIncident(this.activeIncident);
  }

  private async publishSnapshot(): Promise<void> {
    this.onSnapshot(
      await buildGapSnapshot(this.store, this.matchUserKey, this.activeIncident, this.lastError),
    );
  }

  private clearTimers(): void {
    if (this.closeTimer) clearTimeout(this.closeTimer);
    if (this.capTimer) clearTimeout(this.capTimer);
    this.closeTimer = null;
    this.capTimer = null;
  }
}
