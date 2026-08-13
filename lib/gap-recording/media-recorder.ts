import {
  chooseGapRecordingMimeType,
  GAP_CLIP_DURATION_MS,
  GAP_VIDEO_BITS_PER_SECOND,
} from '@/lib/gap-recording/policy';
import type { RecordedClip } from '@/lib/gap-recording/types';

export interface RotatingRecorderController {
  stop: () => Promise<void>;
}

interface RecorderSlot {
  recorder: MediaRecorder;
  completion: Promise<void>;
  startedAt: number;
  sequence: number;
}

interface StartRotatingRecorderOptions {
  stream: MediaStream;
  onClip: (clip: RecordedClip) => void | Promise<void>;
  onError: (message: string) => void;
  now?: () => number;
  makeId?: () => string;
}

function recorderErrorMessage(event: Event): string {
  const error = (event as Event & { error?: DOMException }).error;
  if (error?.name === 'QuotaExceededError') {
    return 'Spazio locale insufficiente per proteggere la disconnessione.';
  }
  return 'Registrazione locale della disconnessione non disponibile.';
}

/**
 * Produce clip complete e autonome. La clip successiva parte prima dello stop
 * della precedente: il breve overlap evita buchi dovuti alla finalizzazione
 * asincrona del contenitore.
 */
export function startRotatingGapRecorder({
  stream,
  onClip,
  onError,
  now = Date.now,
  makeId = () => crypto.randomUUID(),
}: StartRotatingRecorderOptions): RotatingRecorderController {
  const videoTracks = stream.getVideoTracks().filter((track) => track.readyState !== 'ended');
  if (videoTracks.length === 0) {
    throw new DOMException('No active video track', 'NotFoundError');
  }
  // La chiamata usa ancora lo stream audio/video originale. Il buffer di
  // sicurezza riceve una vista video-only: il microfono non può essere inciso.
  const recordingStream = new MediaStream(videoTracks);
  const mimeType = chooseGapRecordingMimeType((value) =>
    MediaRecorder.isTypeSupported(value),
  );
  if (!mimeType) {
    throw new DOMException('No supported recording container', 'NotSupportedError');
  }
  const recordingSessionId = makeId();
  const activeSlots = new Set<RecorderSlot>();
  let current: RecorderSlot | null = null;
  let rotationTimer: ReturnType<typeof setTimeout> | null = null;
  let sequence = 0;
  let stopped = false;

  const scheduleRotation = () => {
    if (rotationTimer) clearTimeout(rotationTimer);
    rotationTimer = setTimeout(rotate, GAP_CLIP_DURATION_MS);
  };

  const startSlot = (): RecorderSlot => {
    const options: MediaRecorderOptions = {
      videoBitsPerSecond: GAP_VIDEO_BITS_PER_SECOND,
      mimeType,
    };
    const recorder = new MediaRecorder(recordingStream, options);
    const chunks: Blob[] = [];
    const startedAt = now();
    const slotSequence = sequence;
    sequence += 1;
    let resolveCompletion = () => {};
    const completion = new Promise<void>((resolve) => {
      resolveCompletion = resolve;
    });
    const slot: RecorderSlot = {
      recorder,
      completion,
      startedAt,
      sequence: slotSequence,
    };
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = (event) => onError(recorderErrorMessage(event));
    recorder.onstop = () => {
      const endedAt = now();
      const blob = new Blob(chunks, {
        type: recorder.mimeType || mimeType,
      });
      const wasCurrent = current === slot;
      if (wasCurrent) current = null;
      void Promise.resolve(
        blob.size > 0
          ? onClip({
              id: makeId(),
              recordingSessionId,
              sequence: slot.sequence,
              startedAt: slot.startedAt,
              endedAt,
              mimeType: blob.type,
              blob,
            })
          : undefined,
      ).finally(() => {
        activeSlots.delete(slot);
        resolveCompletion();
      });
      if (wasCurrent && !stopped) {
        try {
          current = startSlot();
          scheduleRotation();
        } catch {
          onError('Impossibile continuare la registrazione locale.');
        }
      }
    };
    recorder.start();
    activeSlots.add(slot);
    return slot;
  };

  function rotate(): void {
    rotationTimer = null;
    if (stopped || !current) return;
    const previous = current;
    try {
      current = startSlot();
      scheduleRotation();
      if (previous.recorder.state !== 'inactive') previous.recorder.stop();
    } catch {
      current = previous;
      onError('Impossibile ruotare il buffer video locale.');
      scheduleRotation();
    }
  }

  current = startSlot();
  scheduleRotation();

  return {
    async stop(): Promise<void> {
      if (!stopped) {
        stopped = true;
        if (rotationTimer) clearTimeout(rotationTimer);
        rotationTimer = null;
        for (const slot of activeSlots) {
          if (slot.recorder.state !== 'inactive') slot.recorder.stop();
        }
      }
      await Promise.all([...activeSlots].map((slot) => slot.completion));
    },
  };
}
