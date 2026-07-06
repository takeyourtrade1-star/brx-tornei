'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { identifyCapture } from '@/lib/scanner/identify-capture';
import { snapshotFromVideo } from '@/lib/scanner/snapshot-from-video';

import type { CaptureQueueItem, ScanResult } from './scanner-types';

export interface UseCaptureQueueParams {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  apiBaseUrl: string;
  scanMode: 'auto' | 'fast' | 'full';
  requestTimeoutMs: number;
  isTurboReady: () => boolean;
  runOnnxEmbed: (tensor: Float32Array) => Promise<Float32Array>;
  onnxCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  onnxCtxRef: React.MutableRefObject<CanvasRenderingContext2D | null>;
  tensorBufferRef: React.MutableRefObject<Float32Array | null>;
  /** In modalità singola apre subito la revisione al primo risultato. */
  autoReviewOnReady?: boolean;
  onReviewOpen?: (result: ScanResult) => void;
}

export interface UseCaptureQueueReturn {
  queue: CaptureQueueItem[];
  processingCount: number;
  readyCount: number;
  reviewItemId: string | null;
  reviewResult: ScanResult | null;
  capturePhoto: () => Promise<void>;
  openReview: (id: string) => void;
  openFirstReady: () => boolean;
  openNextReady: () => boolean;
  /** Rimuove la carta corrente e apre la prossima pronta (atomico, no race). */
  dismissAndAdvance: (id: string) => boolean;
  closeReview: () => void;
  dismissItem: (id: string) => void;
  resetQueue: () => void;
}

export function useCaptureQueue({
  videoRef,
  canvasRef,
  apiBaseUrl,
  scanMode,
  requestTimeoutMs,
  isTurboReady,
  runOnnxEmbed,
  onnxCanvasRef,
  onnxCtxRef,
  tensorBufferRef,
  autoReviewOnReady = false,
  onReviewOpen,
}: UseCaptureQueueParams): UseCaptureQueueReturn {
  const [queue, setQueue] = useState<CaptureQueueItem[]>([]);
  const [reviewItemId, setReviewItemId] = useState<string | null>(null);
  const blobsRef = useRef(new Map<string, Blob>());
  const thumbUrlsRef = useRef(new Set<string>());
  const workerBusyRef = useRef(false);

  const revokeThumb = useCallback((url: string) => {
    URL.revokeObjectURL(url);
    thumbUrlsRef.current.delete(url);
  }, []);

  const removeItemInternal = useCallback(
    (id: string, items: CaptureQueueItem[]) => {
      const item = items.find((q) => q.id === id);
      if (item) revokeThumb(item.thumbnailUrl);
      blobsRef.current.delete(id);
      return items.filter((q) => q.id !== id);
    },
    [revokeThumb],
  );

  const pumpWorker = useCallback(async () => {
    if (workerBusyRef.current) return;

    const turboReady = isTurboReady();
    const onnxCanvas = onnxCanvasRef.current;
    const onnxCtx = onnxCtxRef.current;
    const tensorBuf = tensorBufferRef.current;
    if (turboReady && (!onnxCanvas || !onnxCtx || !tensorBuf)) return;

    let nextId: string | null = null;
    setQueue((prev) => {
      const next = prev.find((q) => q.status === 'queued');
      if (!next) return prev;
      nextId = next.id;
      return prev.map((q) => (q.id === next.id ? { ...q, status: 'processing' as const } : q));
    });
    if (!nextId) return;

    const blob = blobsRef.current.get(nextId);
    if (!blob) {
      setQueue((prev) => removeItemInternal(nextId!, prev));
      return;
    }

    workerBusyRef.current = true;
    const embedCanvas =
      onnxCanvas ??
      (typeof document !== 'undefined' ? document.createElement('canvas') : null);
    const embedCtx = embedCanvas?.getContext('2d') ?? null;
    if (!embedCanvas || !embedCtx) {
      setQueue((prev) =>
        prev.map((q) =>
          q.id === nextId
            ? { ...q, status: 'error' as const, error: 'Elaborazione foto non disponibile.' }
            : q,
        ),
      );
      workerBusyRef.current = false;
      void pumpWorker();
      return;
    }

    const outcome = await identifyCapture({
      blob,
      apiBaseUrl,
      scanMode,
      requestTimeoutMs,
      isTurboReady,
      runOnnxEmbed,
      onnxCanvas: embedCanvas,
      onnxCtx: embedCtx,
      tensorBuffer: tensorBuf ?? new Float32Array(0),
    });
    setQueue((prev) =>
      prev.map((q) => {
        if (q.id !== nextId) return q;
        if (outcome.ok) {
          return { ...q, status: 'ready' as const, result: outcome.result };
        }
        return { ...q, status: 'error' as const, error: outcome.error };
      }),
    );

    if (outcome.ok && autoReviewOnReady) {
      setReviewItemId(nextId);
      onReviewOpen?.(outcome.result);
    }

    workerBusyRef.current = false;
    void pumpWorker();
  }, [
    apiBaseUrl,
    autoReviewOnReady,
    isTurboReady,
    onnxCanvasRef,
    onnxCtxRef,
    onReviewOpen,
    removeItemInternal,
    requestTimeoutMs,
    runOnnxEmbed,
    scanMode,
    tensorBufferRef,
  ]);

  const capturePhoto = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const snap = await snapshotFromVideo(video, canvas);
    if (!snap) return;

    const id = crypto.randomUUID();
    blobsRef.current.set(id, snap.blob);
    thumbUrlsRef.current.add(snap.thumbnailUrl);

    setQueue((prev) => [
      ...prev,
      { id, thumbnailUrl: snap.thumbnailUrl, status: 'queued' },
    ]);
    void pumpWorker();
  }, [canvasRef, pumpWorker, videoRef]);

  const openReview = useCallback(
    (id: string) => {
      const item = queue.find((q) => q.id === id);
      if (!item?.result) return;
      setReviewItemId(id);
      onReviewOpen?.(item.result);
    },
    [onReviewOpen, queue],
  );

  const openFirstReady = useCallback((): boolean => {
    const item = queue.find((q) => q.status === 'ready' && q.result);
    if (!item?.result) return false;
    setReviewItemId(item.id);
    onReviewOpen?.(item.result);
    return true;
  }, [onReviewOpen, queue]);

  const openNextReady = useCallback((): boolean => {
    const item = queue.find(
      (q) => q.status === 'ready' && q.result && q.id !== reviewItemId,
    );
    if (!item?.result) return false;
    setReviewItemId(item.id);
    onReviewOpen?.(item.result);
    return true;
  }, [onReviewOpen, queue, reviewItemId]);

  const dismissAndAdvance = useCallback(
    (id: string): boolean => {
      let nextId: string | null = null;
      let nextResult: ScanResult | null = null;
      setQueue((prev) => {
        const updated = removeItemInternal(id, prev);
        const item = updated.find((q) => q.status === 'ready' && q.result);
        if (item?.result) {
          nextId = item.id;
          nextResult = item.result;
        }
        return updated;
      });
      if (nextId && nextResult) {
        setReviewItemId(nextId);
        onReviewOpen?.(nextResult);
        return true;
      }
      setReviewItemId((cur) => (cur === id ? null : cur));
      return false;
    },
    [onReviewOpen, removeItemInternal],
  );

  const closeReview = useCallback(() => {
    setReviewItemId(null);
  }, []);

  const dismissItem = useCallback(
    (id: string) => {
      setQueue((prev) => removeItemInternal(id, prev));
      setReviewItemId((cur) => (cur === id ? null : cur));
    },
    [removeItemInternal],
  );

  const resetQueue = useCallback(() => {
    setQueue((prev) => {
      for (const q of prev) revokeThumb(q.thumbnailUrl);
      return [];
    });
    blobsRef.current.clear();
    setReviewItemId(null);
  }, [revokeThumb]);

  useEffect(
    () => () => {
      for (const url of thumbUrlsRef.current) URL.revokeObjectURL(url);
      thumbUrlsRef.current.clear();
      blobsRef.current.clear();
    },
    [],
  );

  const processingCount = queue.filter(
    (q) => q.status === 'queued' || q.status === 'processing',
  ).length;

  const readyCount = queue.filter((q) => q.status === 'ready').length;

  const reviewResult =
    reviewItemId != null
      ? (queue.find((q) => q.id === reviewItemId)?.result ?? null)
      : null;

  return {
    queue,
    processingCount,
    readyCount,
    reviewItemId,
    reviewResult,
    capturePhoto,
    openReview,
    openFirstReady,
    openNextReady,
    dismissAndAdvance,
    closeReview,
    dismissItem,
    resetQueue,
  };
}
