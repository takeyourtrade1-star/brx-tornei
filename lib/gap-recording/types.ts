import type { PeerLinkState } from '@/lib/webrtc/match-peer-types';
import type { GapRecordingStore } from '@/lib/gap-recording/indexed-db';

export type GapIncidentStatus =
  | 'capturing'
  | 'closing'
  | 'awaiting-consent'
  | 'queued'
  | 'preparing'
  | 'uploading'
  | 'finalizing'
  | 'retrying'
  | 'failed';

export type GapUploadPhase =
  | 'preparing'
  | 'uploading'
  | 'finalizing'
  | 'retrying'
  | 'failed'
  | 'sent';

export interface GapUploadProgress {
  phase: GapUploadPhase;
  incidentId: string;
  uploadedBytes: number;
  totalBytes: number;
  completedClips: number;
  totalClips: number;
  error: string | null;
  retryAt: number | null;
  retryable: boolean;
}

export interface GapClipRecord {
  id: string;
  matchId: string;
  userId: string;
  matchUserKey: string;
  recordingSessionId: string;
  sequence: number;
  startedAt: number;
  endedAt: number;
  mimeType: string;
  byteLength: number;
  incidentId: string | null;
  blob: Blob;
}

export interface GapIncidentRecord {
  id: string;
  matchId: string;
  webcamSessionId: string;
  userId: string;
  matchUserKey: string;
  detectedAt: number;
  captureStartedAt: number;
  captureEndedAt: number | null;
  status: GapIncidentStatus;
  clipIds: string[];
  byteLength: number;
  captureCapped: boolean;
  interrupted: boolean;
  uploadConsentedAt: number | null;
  uploadConsentVersion: 'peer-gap-review-v1' | null;
  remoteIncidentId: string | null;
  retryCount: number;
  nextRetryAt: number | null;
  lastError: string | null;
  failureKind?: 'retryable' | 'terminal' | null;
  createdAt: number;
  updatedAt: number;
}

export type GapProtectionStatus =
  | 'disabled'
  | 'unsupported'
  | 'armed'
  | 'capturing'
  | 'closing'
  | 'queued'
  | 'error';

export interface GapProtectionSnapshot {
  status: GapProtectionStatus;
  pendingIncidents: number;
  consentRequiredIncidents: number;
  consentRequest: {
    incidentId: string;
    detectedAt: number;
    byteLength: number;
    durationMs: number;
  } | null;
  retryingIncidents: number;
  failedIncidents: number;
  retryableFailedIncidents: number;
  waitingForNetwork: boolean;
  retainedBytes: number;
  error: string | null;
  uploadError: string | null;
  upload: GapUploadProgress | null;
}

export const MATCH_GAP_NOTICE_VERSION = 'peer-gap-review-v1' as const;

export interface GapCoordinatorOptions {
  store: GapRecordingStore;
  matchId: string;
  webcamSessionId: string;
  userId: string;
  onSnapshot: (snapshot: GapProtectionSnapshot) => void;
  now?: () => number;
  makeId?: () => string;
}

export interface MatchGapRecorderController {
  snapshot: GapProtectionSnapshot;
  grantUploadConsent: (incidentId: string) => Promise<void>;
  declineUpload: (incidentId: string) => Promise<void>;
  retryUpload: () => Promise<void>;
}

export interface GapRecorderOptions {
  enabled: boolean;
  active: boolean;
  matchId?: string | null;
  webcamSessionId?: string | null;
  userId: string;
  peerState: PeerLinkState;
  localStream?: MediaStream | null;
}

export interface RecordedClip {
  id: string;
  recordingSessionId: string;
  sequence: number;
  startedAt: number;
  endedAt: number;
  mimeType: string;
  blob: Blob;
}
