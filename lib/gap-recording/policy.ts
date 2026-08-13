import type { PeerLinkState } from '@/lib/webrtc/match-peer-types';

export const GAP_CLIP_DURATION_MS = 5_000;
export const GAP_PRE_ROLL_MS = 10_000;
export const GAP_POST_ROLL_MS = 5_000;
export const GAP_MAX_CAPTURE_MS = 120_000;
export const GAP_MAX_BYTES = 32 * 1024 * 1024;
export const GAP_LOCAL_TTL_MS = 72 * 60 * 60 * 1_000;
export const GAP_VIDEO_BITS_PER_SECOND = 1_200_000;

const MIME_TYPE_PREFERENCE = [
  'video/webm;codecs=vp8',
  'video/webm;codecs=vp9',
  'video/webm',
  'video/mp4;codecs=avc1.42E01E',
  'video/mp4',
] as const;

export function isDesktopGapRecordingClient(navigatorLike: {
  userAgent: string;
  maxTouchPoints: number;
  userAgentData?: { mobile: boolean };
}): boolean {
  if (navigatorLike.userAgentData?.mobile === true) return false;
  const userAgent = navigatorLike.userAgent;
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)) return false;
  // iPadOS può presentarsi come Macintosh quando usa la modalità desktop.
  if (/Macintosh/i.test(userAgent) && navigatorLike.maxTouchPoints > 1) return false;
  return true;
}

export function chooseGapRecordingMimeType(
  isSupported: (mimeType: string) => boolean,
): string | undefined {
  return MIME_TYPE_PREFERENCE.find((mimeType) => isSupported(mimeType));
}

export function isGapConnectedState(state: PeerLinkState): boolean {
  return state === 'connected';
}

export function isGapLossState(state: PeerLinkState): boolean {
  return state === 'reconnecting' || state === 'failed';
}

export function clipOverlapsWindow(
  clip: { startedAt: number; endedAt: number },
  from: number,
  until: number | null,
): boolean {
  return clip.endedAt >= from && (until === null || clip.startedAt <= until);
}

export function makeMatchUserKey(matchId: string, userId: string): string {
  return `${matchId}:${userId}`;
}

export function captureCapAt(captureStartedAt: number): number {
  return captureStartedAt + GAP_MAX_CAPTURE_MS;
}

export function rollingCutoff(now: number): number {
  return now - GAP_PRE_ROLL_MS - GAP_CLIP_DURATION_MS;
}
