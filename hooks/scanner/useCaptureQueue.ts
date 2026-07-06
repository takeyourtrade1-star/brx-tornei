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
  /**
   * Tetto massimo per identificare una singola foto (embed + rete + verify).
   * Superato questo la foto va in errore e viene chiesto all'utente, così la
   * coda non resta mai bloccata su uno scatto difficile.
   */
  captureMaxMs: number;
  isTurboReady: () => boolean;
  runOnnxEmbed: (tensor: Float32Array) => Promise<Float32Array>;
  onnxCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  onnxCtxRef: React.MutableRefObject<CanvasRenderingContext2D | null>;
  tensorBufferRef: React.MutableRefObject<Float32Array | null>;
  /** In modalità singola apre subito la revisione appena una foto è pronta o fallisce. */
  autoReviewOnReady?: boolean;
  onReviewOpen?: (item: CaptureQueueItem) => void;
}

export interface UseCaptureQueueReturn {
  queue: CaptureQueueItem[];
  processingCount: number;
  readyCount: number;
  /** Foto che richiedono l'attenzione dell'utente (pronte + fallite). */
  pendingReviewCount: number;
  reviewItemId: string | null;
  reviewItem: CaptureQueueItem | null;
  reviewResult: ScanResult | null;
  capturePhoto: () => Promise<void>;
  openReview: (id: string) => void;
  /** Apre la prima foto da rivedere (pronta o fallita). */
  openFirstReady: () => boolean;
  /** Apre la prossima foto da rivedere diversa da quella corrente. */
  openNextReady: () => boolean;
  /** Rimuove la carta corrente e apre la prossima da rivedere (atomico, no race). */
  dismissAndAdvance: (id: string) => boolean;
  /** Rimette in coda una foto fallita per un nuovo tentativo. */
  retryItem: (id: string) => void;
  closeReview: () => void;
  dismissItem: (id: string) => void;
  resetQueue: () => void;
}

/** Una foto è "da rivedere" quando è pronta (conferma) o fallita (chiedi all'utente). */
function isReviewable(item: CaptureQueueItem): boolean {
  return item.status === 'ready' || item.status === 'error';
}

/**
 * Esegue una promise con un tetto massimo di tempo. Non annulla il lavoro
 * sottostante (fetch/worker hanno i loro abort), ma garantisce che la coda
 * avanzi anche se qualcosa resta appeso all'infinito.
 */
function withCeiling<T>(promise: Promise<T>, ms: number): Promise<T | { timedOut: true }> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ timedOut: true }), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      () => {
        clearTimeout(timer);
        resolve({ timedOut: true });
      },
    );
  });
}

export function useCaptureQueue({
  videoRef,
  canvasRef,
  apiBaseUrl,
  scanMode,
  requestTimeoutMs,
  captureMaxMs,
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
  // Fonte di verità sincrona per il worker: leggere lo stato React dentro un
  // updater di setState non è garantito sincrono e faceva "bloccare" la coda.
  const queueRef = useRef<CaptureQueueItem[]>([]);
  const blobsRef = useRef(new Map<string, Blob>());
  const thumbUrlsRef = useRef(new Set<string>());
  const workerBusyRef = useRef(false);

  // onReviewOpen può cambiare identità ad ogni render: lo teniamo in un ref così
  // pumpWorker resta stabile e non ricrea/riavvia il loop di elaborazione.
  const onReviewOpenRef = useRef(onReviewOpen);
  onReviewOpenRef.current = onReviewOpen;
  const autoReviewRef = useRef(autoReviewOnReady);
  autoReviewRef.current = autoReviewOnReady;

  const setBoth = useCallback(
    (updater: (prev: CaptureQueueItem[]) => CaptureQueueItem[]) => {
      const next = updater(queueRef.current);
      queueRef.current = next;
      setQueue(next);
    },
    [],
  );

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

  const openItem = useCallback((item: CaptureQueueItem) => {
    setReviewItemId(item.id);
    onReviewOpenRef.current?.(item);
  }, []);

  const pumpWorker = useCallback(async () => {
    if (workerBusyRef.current) return;

    // Leggiamo la prossima foto in coda dal ref (sincrono e affidabile).
    const next = queueRef.current.find((q) => q.status === 'queued');
    if (!next) return;

    const tensorBuf = tensorBufferRef.current;
    // Turbo pronto ma buffer non ancora inizializzato: riprova a breve invece di
    // lasciare la foto ferma in coda per sempre.
    if (isTurboReady() && !tensorBuf) {
      setTimeout(() => void pumpWorker(), 120);
      return;
    }

    const nextId = next.id;
    const blob = blobsRef.current.get(nextId);
    if (!blob) {
      setBoth((prev) => removeItemInternal(nextId, prev));
      void pumpWorker();
      return;
    }

    workerBusyRef.current = true;
    setBoth((prev) =>
      prev.map((q) => (q.id === nextId ? { ...q, status: 'processing' as const } : q)),
    );

    const embedCanvas =
      onnxCanvasRef.current ??
      (typeof document !== 'undefined' ? document.createElement('canvas') : null);
    const embedCtx = embedCanvas?.getContext('2d') ?? null;

    let readyItem: CaptureQueueItem | null = null;

    if (!embedCanvas || !embedCtx) {
      setBoth((prev) =>
        prev.map((q) =>
          q.id === nextId
            ? { ...q, status: 'error' as const, error: 'Elaborazione foto non disponibile.' }
            : q,
        ),
      );
    } else {
      const outcome = await withCeiling(
        identifyCapture({
          blob,
          apiBaseUrl,
          scanMode,
          requestTimeoutMs,
          isTurboReady,
          runOnnxEmbed,
          onnxCanvas: embedCanvas,
          onnxCtx: embedCtx,
          tensorBuffer: tensorBuf ?? new Float32Array(0),
        }),
        captureMaxMs,
      );

      setBoth((prev) =>
        prev.map((q) => {
          if (q.id !== nextId) return q;
          if ('timedOut' in outcome) {
            return {
              ...q,
              status: 'error' as const,
              error: 'Non sono riuscito a riconoscerla in tempo.',
            };
          }
          if (outcome.ok) {
            readyItem = { ...q, status: 'ready' as const, result: outcome.result };
            return readyItem;
          }
          return { ...q, status: 'error' as const, error: outcome.error };
        }),
      );
    }

    workerBusyRef.current = false;

    // Modalità singola: appena una foto è pronta (o è fallita) la portiamo subito
    // in revisione, così l'utente non resta in attesa e può decidere.
    if (autoReviewRef.current) {
      const current = queueRef.current.find((q) => q.id === nextId);
      if (current && isReviewable(current)) {
        openItem(readyItem ?? current);
      }
    }

    void pumpWorker();
  }, [
    apiBaseUrl,
    captureMaxMs,
    isTurboReady,
    onnxCanvasRef,
    openItem,
    removeItemInternal,
    requestTimeoutMs,
    runOnnxEmbed,
    scanMode,
    setBoth,
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

    setBoth((prev) => [...prev, { id, thumbnailUrl: snap.thumbnailUrl, status: 'queued' }]);
    void pumpWorker();
  }, [canvasRef, pumpWorker, setBoth, videoRef]);

  const openReview = useCallback(
    (id: string) => {
      const item = queueRef.current.find((q) => q.id === id);
      if (!item || !isReviewable(item)) return;
      openItem(item);
    },
    [openItem],
  );

  const openFirstReady = useCallback((): boolean => {
    const item = queueRef.current.find(isReviewable);
    if (!item) return false;
    openItem(item);
    return true;
  }, [openItem]);

  const openNextReady = useCallback((): boolean => {
    const item = queueRef.current.find((q) => isReviewable(q) && q.id !== reviewItemId);
    if (!item) return false;
    openItem(item);
    return true;
  }, [openItem, reviewItemId]);

  const dismissAndAdvance = useCallback(
    (id: string): boolean => {
      const updated = removeItemInternal(id, queueRef.current);
      queueRef.current = updated;
      setQueue(updated);
      const next = updated.find(isReviewable);
      if (next) {
        openItem(next);
        return true;
      }
      setReviewItemId((cur) => (cur === id ? null : cur));
      return false;
    },
    [openItem, removeItemInternal],
  );

  const retryItem = useCallback(
    (id: string) => {
      if (!blobsRef.current.has(id)) return;
      setBoth((prev) =>
        prev.map((q) =>
          q.id === id ? { ...q, status: 'queued' as const, error: undefined, result: undefined } : q,
        ),
      );
      setReviewItemId((cur) => (cur === id ? null : cur));
      void pumpWorker();
    },
    [pumpWorker, setBoth],
  );

  const closeReview = useCallback(() => {
    setReviewItemId(null);
  }, []);

  const dismissItem = useCallback(
    (id: string) => {
      setBoth((prev) => removeItemInternal(id, prev));
      setReviewItemId((cur) => (cur === id ? null : cur));
    },
    [removeItemInternal, setBoth],
  );

  const resetQueue = useCallback(() => {
    for (const q of queueRef.current) revokeThumb(q.thumbnailUrl);
    queueRef.current = [];
    setQueue([]);
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
  const pendingReviewCount = queue.filter(isReviewable).length;

  const reviewItem =
    reviewItemId != null ? (queue.find((q) => q.id === reviewItemId) ?? null) : null;
  const reviewResult = reviewItem?.result ?? null;

  return {
    queue,
    processingCount,
    readyCount,
    pendingReviewCount,
    reviewItemId,
    reviewItem,
    reviewResult,
    capturePhoto,
    openReview,
    openFirstReady,
    openNextReady,
    dismissAndAdvance,
    retryItem,
    closeReview,
    dismissItem,
    resetQueue,
  };
}
