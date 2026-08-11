'use client';

import { useCallback, useEffect, useState } from 'react';
import { publicConfig } from '@/lib/public-config';
import {
  gapPeerDetailResponseSchema,
  gapPeerListResponseSchema,
  gapViewTicketResponseSchema,
  type GapPeerRecording,
} from '@/lib/validations/gap-recording';

export interface GapPeerClipView {
  clipId: string;
  sequence: number;
  contentType: string;
  byteLength: number;
  url: string;
  expiresAt: string;
}

async function jsonResponse(response: Response): Promise<unknown> {
  return response.json().catch(() => ({}));
}

export function useMatchGapPeerReview(matchId: string | null, active: boolean) {
  const [recordings, setRecordings] = useState<GapPeerRecording[]>([]);
  const [clips, setClips] = useState<Record<string, GapPeerClipView[]>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!active || !matchId) return;
    const response = await fetch(
      `/api/tournaments/match/${encodeURIComponent(matchId)}/gap-recordings/peer-review`,
      { cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(15_000) },
    );
    const parsed = gapPeerListResponseSchema.safeParse(await jsonResponse(response));
    if (!response.ok || !parsed.success) throw new Error('Verifica video non disponibile.');
    setError(null);
    setRecordings(parsed.data.data);
  }, [active, matchId]);

  useEffect(() => {
    if (!active || !matchId) {
      setRecordings([]);
      setClips({});
      return;
    }
    let disposed = false;
    const run = () => {
      void refresh().catch(() => {
        if (!disposed) setError('Impossibile aggiornare la verifica video.');
      });
    };
    run();
    const interval = setInterval(run, 5_000);
    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, [active, matchId, refresh]);

  const open = useCallback(async (recordingId: string) => {
    if (!matchId) return;
    setBusyId(recordingId);
    setError(null);
    try {
      const base = `/api/tournaments/match/${encodeURIComponent(matchId)}/gap-recordings/${encodeURIComponent(recordingId)}`;
      const notice = await fetch(`${base}/peer-review/notice`, {
        method: 'POST',
        cache: 'no-store',
        credentials: 'same-origin',
        signal: AbortSignal.timeout(15_000),
      });
      if (!notice.ok) throw new Error('Presa visione non registrata.');
      const detailResponse = await fetch(`${base}/peer-review`, {
        cache: 'no-store',
        credentials: 'same-origin',
        signal: AbortSignal.timeout(15_000),
      });
      const detail = gapPeerDetailResponseSchema.safeParse(await jsonResponse(detailResponse));
      if (!detailResponse.ok || !detail.success) throw new Error('Video non disponibile.');
      const views = await Promise.all(detail.data.data.clips.map(async (clip) => {
        const response = await fetch(
          `${base}/clips/${encodeURIComponent(clip.clip_id)}/view-ticket`,
          {
            method: 'POST',
            cache: 'no-store',
            credentials: 'same-origin',
            signal: AbortSignal.timeout(15_000),
          },
        );
        const ticket = gapViewTicketResponseSchema.safeParse(await jsonResponse(response));
        if (!response.ok || !ticket.success) throw new Error('Accesso al video negato.');
        const mediaUrl = new URL(ticket.data.data.url);
        const isLoopbackDevelopment =
          process.env.NODE_ENV !== 'production' &&
          mediaUrl.protocol === 'http:' &&
          ['localhost', '127.0.0.1', '[::1]'].includes(mediaUrl.hostname.toLowerCase());
        if (
          mediaUrl.origin !== publicConfig.storage.matchGapUploadOrigin ||
          (mediaUrl.protocol !== 'https:' && !isLoopbackDevelopment) ||
          mediaUrl.username ||
          mediaUrl.password
        ) throw new Error('Origine video non autorizzata.');
        return {
          clipId: clip.clip_id,
          sequence: clip.sequence,
          contentType: ticket.data.data.content_type,
          byteLength: ticket.data.data.byte_length,
          url: mediaUrl.toString(),
          expiresAt: ticket.data.data.expires_at,
        };
      }));
      setClips((current) => ({ ...current, [recordingId]: views }));
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Verifica video non disponibile.');
    } finally {
      setBusyId(null);
    }
  }, [matchId, refresh]);

  const review = useCallback(async (
    recordingId: string,
    decision: 'verified' | 'rejected',
    reasonCode: 'gap_consistent' | 'dispute_resolved' | 'gap_incomplete' | 'gap_unusable' | 'gap_unexpected_content',
  ) => {
    if (!matchId) return;
    setBusyId(recordingId);
    setError(null);
    try {
      const response = await fetch(
        `/api/tournaments/match/${encodeURIComponent(matchId)}/gap-recordings/${encodeURIComponent(recordingId)}/peer-review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision,
            reason_code: reasonCode,
            notice_version: 'peer-gap-review-v1',
            notice_acknowledged: true,
          }),
          cache: 'no-store',
          credentials: 'same-origin',
          signal: AbortSignal.timeout(15_000),
        },
      );
      if (!response.ok) throw new Error('Decisione non registrata.');
      if (decision === 'verified') {
        setClips((current) => {
          const next = { ...current };
          delete next[recordingId];
          return next;
        });
      }
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Decisione non registrata.');
    } finally {
      setBusyId(null);
    }
  }, [matchId, refresh]);

  return { recordings, clips, busyId, error, open, review };
}
