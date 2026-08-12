import type { GapIncidentRecord } from '@/lib/gap-recording/types';
import { TerminalGapUploadError } from '@/lib/gap-recording/upload-api';
import { GapClipUploadError } from '@/lib/gap-recording/upload-transport';

const MAX_RETRY_DELAY_MS = 5 * 60 * 1_000;
export const MAX_GAP_UPLOAD_ATTEMPTS = 5;

export function nextGapUploadRetryAt(incident: GapIncidentRecord, now: number): number {
  const delay = Math.min(5_000 * 2 ** incident.retryCount, MAX_RETRY_DELAY_MS);
  return now + delay;
}

export function isRetryableGapUploadError(error: unknown): boolean {
  if (error instanceof TerminalGapUploadError) return false;
  if (error instanceof GapClipUploadError) {
    if (error.status === null) return error.retryable;
    return error.status === 401 || error.status === 403 || error.status === 409 ||
      error.status === 408 || error.status === 429 || error.status >= 500;
  }
  return true;
}
