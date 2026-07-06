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
  reviewItemId: string | null;
  reviewResult: ScanResult | null;
  capturePhoto: () => Promise<void>;
  openReview: (id: string) => void;
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

    const onnxCanvas = onnxCanvasRef.current;
    const onnxCtx = onnxCtxRef.current;
    const tensorBuf = tensorBufferRef.current;
    if (!onnxCanvas || !onnxCtx || !tensorBuf) return;

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
    const outcome = await identifyCapture({
      blob,
      apiBaseUrl,
      scanMode,
      requestTimeoutMs,
      isTurboReady,
      runOnnxEmbed,
      onnxCanvas,
      onnxCtx,
      tensorBuffer: tensorBuf,
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

  const reviewResult =
    reviewItemId != null
      ? (queue.find((q) => q.id === reviewItemId)?.result ?? null)
      : null;

  return {
    queue,
    processingCount,
    reviewItemId,
    reviewResult,
    capturePhoto,
    openReview,
    closeReview,
    dismissItem,
    resetQueue,
  };
}
