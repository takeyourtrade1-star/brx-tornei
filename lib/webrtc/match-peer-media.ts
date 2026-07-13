'use client';

import { fetchIceConfig } from './ice-config';
import type { PeerTransport, SignalEnvelope } from './match-peer-types';

const MAX_VIDEO_BITRATE = 2_500_000;
const TARGET_FPS = 30;

export function parseEnvelope(data: unknown): SignalEnvelope | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  if (typeof record.attemptId !== 'string' || !('payload' in record)) return null;
  return { attemptId: record.attemptId, payload: record.payload };
}

export async function detectTransport(pc: RTCPeerConnection): Promise<PeerTransport> {
  try {
    const stats = await pc.getStats();
    let selectedPairId: string | undefined;
    stats.forEach((report) => {
      if (report.type === 'transport' && typeof report.selectedCandidatePairId === 'string') {
        selectedPairId = report.selectedCandidatePairId;
      }
      if (!selectedPairId && report.type === 'candidate-pair' && report.state === 'succeeded' && report.nominated) {
        selectedPairId = report.id;
      }
    });
    if (!selectedPairId) return 'unknown';
    const pair = stats.get(selectedPairId);
    const local = pair?.localCandidateId ? stats.get(pair.localCandidateId) : null;
    const remote = pair?.remoteCandidateId ? stats.get(pair.remoteCandidateId) : null;
    return local?.candidateType === 'relay' || remote?.candidateType === 'relay' ? 'relay' : 'direct';
  } catch {
    return 'unknown';
  }
}

export async function newPeerConnection(
  sessionId: string,
  allowDirect: boolean,
): Promise<RTCPeerConnection> {
  const { iceServers, forceRelay } = await fetchIceConfig(sessionId, allowDirect);
  return new RTCPeerConnection({
    iceServers,
    bundlePolicy: 'max-bundle',
    iceTransportPolicy: forceRelay ? 'relay' : 'all',
  });
}

export function applyLowLatencyReceiverHints(receiver: RTCRtpReceiver): void {
  try {
    (receiver as unknown as { jitterBufferTarget?: number }).jitterBufferTarget = 0;
  } catch { /* non supportato */ }
  try {
    (receiver as unknown as { playoutDelayHint?: number }).playoutDelayHint = 0;
  } catch { /* non supportato */ }
}

export function preferLowLatencyCodecs(pc: RTCPeerConnection): void {
  try {
    const caps = RTCRtpSender.getCapabilities?.('video');
    if (!caps) return;
    const order = ['video/H264', 'video/VP8', 'video/VP9', 'video/AV1'];
    const rank = (mime: string) => (order.indexOf(mime) === -1 ? 99 : order.indexOf(mime));
    const sorted = [...caps.codecs].sort((a, b) => rank(a.mimeType) - rank(b.mimeType));
    for (const transceiver of pc.getTransceivers()) {
      const kind = transceiver.sender?.track?.kind ?? transceiver.receiver?.track?.kind;
      if (kind === 'video') transceiver.setCodecPreferences?.(sorted);
    }
  } catch { /* API non supportata */ }
}

function mergeTrackIntoStream(track: MediaStreamTrack, inbound: MediaStream | null): MediaStream {
  const stream = inbound ?? new MediaStream();
  if (!stream.getTracks().some((item) => item.id === track.id)) stream.addTrack(track);
  return stream;
}

export function streamFromTrackEvent(event: RTCTrackEvent, inbound: MediaStream | null): MediaStream | null {
  if (event.streams[0]) return event.streams[0];
  return event.track ? mergeTrackIntoStream(event.track, inbound) : null;
}

export function harvestRemoteStream(pc: RTCPeerConnection, inbound: MediaStream | null): MediaStream | null {
  let stream = inbound;
  for (const receiver of pc.getReceivers()) {
    const track = receiver.track;
    if (track && track.readyState !== 'ended') {
      if (track.kind === 'video') applyLowLatencyReceiverHints(receiver);
      stream = mergeTrackIntoStream(track, stream);
    }
  }
  return stream && stream.getTracks().length > 0 ? stream : null;
}

export async function tuneSenders(pc: RTCPeerConnection): Promise<void> {
  for (const sender of pc.getSenders()) {
    if (sender.track?.kind !== 'video') continue;
    const parameters = sender.getParameters();
    if (!parameters.encodings?.length) parameters.encodings = [{}];
    parameters.encodings[0].maxBitrate = MAX_VIDEO_BITRATE;
    parameters.encodings[0].maxFramerate = TARGET_FPS;
    (parameters as RTCRtpSendParameters & { degradationPreference?: string }).degradationPreference = 'maintain-framerate';
    try {
      await sender.setParameters(parameters);
    } catch { /* parametro non supportato */ }
  }
}
