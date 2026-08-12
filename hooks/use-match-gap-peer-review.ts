'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  loadGapPeerClipViews,
  type GapPeerClipView,
} from '@/lib/gap-recording/peer-review-tickets';
import {
  gapPeerDetailResponseSchema,
  gapPeerListResponseSchema,
  type GapPeerRecording,
} from '@/lib/validations/gap-recording';

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

  const loadViews = useCallback(async (recordingId: string) => {
    if (!matchId) throw new Error('Video non disponibile.');
    const base = `/api/tournaments/match/${encodeURIComponent(matchId)}/gap-recordings/${encodeURIComponent(recordingId)}`;
    const detailResponse = await fetch(`${base}/peer-review`, {
      cache: 'no-store',
      credentials: 'same-origin',
      signal: AbortSignal.timeout(15_000),
    });
    const detail = gapPeerDetailResponseSchema.safeParse(await jsonResponse(detailResponse));
    if (!detailResponse.ok || !detail.success) throw new Error('Video non disponibile.');
    const views = await loadGapPeerClipViews(base, detail.data.data.clips);
    setClips((current) => ({ ...current, [recordingId]: views }));
  }, [matchId]);

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
      await loadViews(recordingId);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Verifica video non disponibile.');
    } finally {
      setBusyId(null);
    }
  }, [loadViews, matchId, refresh]);

  const reload = useCallback(async (recordingId: string): Promise<boolean> => {
    setBusyId(recordingId);
    setError(null);
    try {
      await loadViews(recordingId);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Video non disponibile.');
      return false;
    } finally {
      setBusyId(null);
    }
  }, [loadViews]);

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

  return { recordings, clips, busyId, error, open, reload, review };
}
