import { afterEach, describe, expect, it, vi } from 'vitest';
import { startRotatingGapRecorder } from '@/lib/gap-recording/media-recorder';

describe('gap recording media boundary', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('passes only video tracks to MediaRecorder and never configures audio', async () => {
    const videoTrack = { kind: 'video', readyState: 'live' } as MediaStreamTrack;
    const audioTrack = { kind: 'audio', readyState: 'live' } as MediaStreamTrack;
    const source = {
      getVideoTracks: () => [videoTrack],
      getAudioTracks: () => [audioTrack],
    } as unknown as MediaStream;
    let recordedTracks: MediaStreamTrack[] = [];
    let recordedOptions: MediaRecorderOptions | null = null;

    class FakeMediaStream {
      constructor(readonly tracks: MediaStreamTrack[]) {}
    }
    class FakeMediaRecorder {
      static isTypeSupported = () => true;
      state: RecordingState = 'inactive';
      mimeType = 'video/webm;codecs=vp8';
      ondataavailable: ((event: BlobEvent) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onstop: (() => void) | null = null;
      constructor(stream: MediaStream, options: MediaRecorderOptions) {
        recordedTracks = (stream as unknown as { tracks: MediaStreamTrack[] }).tracks;
        recordedOptions = options;
      }
      start() { this.state = 'recording'; }
      stop() { this.state = 'inactive'; this.onstop?.(); }
    }
    vi.stubGlobal('MediaStream', FakeMediaStream);
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'recording-id') });

    const controller = startRotatingGapRecorder({
      stream: source,
      onClip: vi.fn(),
      onError: vi.fn(),
    });
    expect(recordedTracks).toEqual([videoTrack]);
    expect(recordedTracks).not.toContain(audioTrack);
    expect(recordedOptions).not.toHaveProperty('audioBitsPerSecond');
    await controller.stop();
  });
});
