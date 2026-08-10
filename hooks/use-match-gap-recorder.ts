'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GapRecordingCoordinator } from '@/lib/gap-recording/coordinator';
import { IndexedDbGapRecordingStore } from '@/lib/gap-recording/indexed-db';
import { startRotatingGapRecorder } from '@/lib/gap-recording/media-recorder';
import { isDesktopGapRecordingClient } from '@/lib/gap-recording/policy';
import { uploadPendingGapRecordings } from '@/lib/gap-recording/uploader';
import type {
  GapProtectionSnapshot,
  GapRecorderOptions,
  MatchGapRecorderController,
} from '@/lib/gap-recording/types';

const DISABLED: GapProtectionSnapshot = {
  status: 'disabled',
  pendingIncidents: 0,
  consentRequiredIncidents: 0,
  retainedBytes: 0,
  error: null,
};

const UNSUPPORTED: GapProtectionSnapshot = {
  ...DISABLED,
  status: 'unsupported',
  error: 'Questo browser non supporta la protezione video delle disconnessioni.',
};

const MOBILE_UNSUPPORTED: GapProtectionSnapshot = {
  ...DISABLED,
  status: 'unsupported',
  error: 'La protezione video delle disconnessioni è disponibile solo su PC.',
};

/**
 * Buffer desktop dello stream locale. Non invia video: prepara soltanto la
 * coda IndexedDB che l'uploader svuota dopo una riconnessione.
 */
export function useMatchGapRecorder({
  enabled,
  active,
  matchId,
  webcamSessionId,
  userId,
  peerState,
  localStream,
}: GapRecorderOptions): MatchGapRecorderController {
  const [snapshot, setSnapshot] = useState<GapProtectionSnapshot>(DISABLED);
  const coordinatorRef = useRef<GapRecordingCoordinator | null>(null);
  const uploadRef = useRef<() => void>(() => {});
  const peerStateRef = useRef(peerState);
  peerStateRef.current = peerState;
  const videoTrackId = localStream?.getVideoTracks()[0]?.id ?? null;

  useEffect(() => {
    const supported =
      typeof MediaRecorder !== 'undefined' &&
      typeof indexedDB !== 'undefined' &&
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function';
    if (!enabled || !matchId || !webcamSessionId) {
      setSnapshot(DISABLED);
      return;
    }
    if (!supported) {
      setSnapshot(UNSUPPORTED);
      return;
    }
    if (!isDesktopGapRecordingClient(navigator)) {
      setSnapshot(MOBILE_UNSUPPORTED);
      return;
    }

    let disposed = false;
    const store = new IndexedDbGapRecordingStore();
    let uploadRunning = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let localRefreshTimer: ReturnType<typeof setInterval> | null = null;
    let maybeUpload = () => {};
    const coordinator = new GapRecordingCoordinator({
      store,
      matchId,
      webcamSessionId,
      userId,
      onSnapshot: (next) => {
        if (!disposed) setSnapshot(next);
        if (next.pendingIncidents > next.consentRequiredIncidents) queueMicrotask(maybeUpload);
      },
    });
    coordinatorRef.current = coordinator;
    maybeUpload = () => {
      if (
        disposed ||
        uploadRunning ||
        (active && peerStateRef.current !== 'connected') ||
        !navigator.onLine
      ) return;
      uploadRunning = true;
      void uploadPendingGapRecordings(store, matchId, userId)
        .then(({ nextRetryAt }) => {
          if (disposed) return;
          void coordinator.refresh();
          if (nextRetryAt !== null) {
            if (retryTimer) clearTimeout(retryTimer);
            retryTimer = setTimeout(maybeUpload, Math.max(0, nextRetryAt - Date.now()));
          }
        })
        .catch(() => coordinator.reportError('Caricamento protetto non disponibile.'))
        .finally(() => {
          uploadRunning = false;
        });
    };
    uploadRef.current = maybeUpload;
    window.addEventListener('online', maybeUpload);

    let recorder: ReturnType<typeof startRotatingGapRecorder> | null = null;
    void coordinator.initialize().then(() => {
      if (active) void coordinator.observePeer(peerStateRef.current);
    });
    localRefreshTimer = setInterval(() => void coordinator.refresh(), 1_000);
    if (active && localStream && videoTrackId) {
      try {
        recorder = startRotatingGapRecorder({
          stream: localStream,
          onClip: (clip) => coordinator.acceptClip(clip),
          onError: (message) => coordinator.reportError(message),
        });
      } catch {
        setSnapshot({
          ...UNSUPPORTED,
          status: 'error',
          error: 'Impossibile avviare il buffer video locale.',
        });
      }
    }

    return () => {
      disposed = true;
      window.removeEventListener('online', maybeUpload);
      if (retryTimer) clearTimeout(retryTimer);
      if (localRefreshTimer) clearInterval(localRefreshTimer);
      if (coordinatorRef.current === coordinator) coordinatorRef.current = null;
      uploadRef.current = () => {};
      if (recorder) void recorder.stop().then(() => coordinator.finish(true));
    };
  }, [active, enabled, localStream, matchId, userId, videoTrackId, webcamSessionId]);

  useEffect(() => {
    void coordinatorRef.current?.observePeer(peerState);
  }, [peerState]);

  const grantUploadConsent = useCallback(async () => {
    await coordinatorRef.current?.grantUploadConsent();
    uploadRef.current();
  }, []);
  const declineUpload = useCallback(async () => {
    await coordinatorRef.current?.declineUpload();
  }, []);

  return { snapshot, grantUploadConsent, declineUpload };
}
