import type { PeerLinkState } from '@/lib/webrtc/match-peer-types';

export type GapIncidentStatus =
  | 'capturing'
  | 'closing'
  | 'queued'
  | 'uploading'
  | 'failed';

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
  remoteIncidentId: string | null;
  retryCount: number;
  nextRetryAt: number | null;
  lastError: string | null;
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
  retainedBytes: number;
  error: string | null;
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
