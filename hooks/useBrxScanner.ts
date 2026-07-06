'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { type OnnxLoadProgress } from '@/lib/scanner/onnx-loader';
import { BALANCED } from '@/lib/scanner/balancedProfile';

import { useCaptureQueue } from './scanner/useCaptureQueue';
import { useOnnxSession, type ModelStatus } from './scanner/useOnnxSession';
import type { CaptureQueueItem, ScannerState, ScanResult } from './scanner/scanner-types';

export type { OnnxLoadProgress } from '@/lib/scanner/onnx-loader';
export type { ModelStatus } from './scanner/useOnnxSession';
export type { ScannerState, ScanResult, CaptureQueueItem } from './scanner/scanner-types';

export interface UseBrxScannerOptions {
  onError?: (message: string) => void;
  apiBaseUrl?: string;
  requestTimeoutMs?: number;
  scanMode?: 'auto' | 'fast' | 'full';
  autoOpenCamera?: boolean;
  /** Apre subito la revisione al primo risultato (modalità singola). */
  autoReviewOnReady?: boolean;
}

export interface UseBrxScannerReturn {
  state: ScannerState;
  result: ScanResult | null;
  errorMessage: string | null;
  modelStatus: ModelStatus;
  modelProgress: OnnxLoadProgress;
  modelError: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  queue: CaptureQueueItem[];
  processingCount: number;
  readyCount: number;
  pendingReviewCount: number;
  reviewItemId: string | null;
  reviewItem: CaptureQueueItem | null;
  capturePhoto: () => Promise<void>;
  openReview: (id: string) => void;
  openFirstReady: () => boolean;
  openNextReady: () => boolean;
  dismissAndAdvance: (id: string) => boolean;
  retryItem: (id: string) => void;
  closeReview: () => void;
  dismissItem: (id: string) => void;
  openCamera: () => Promise<void>;
  stopScanning: () => void;
  retryModelDownload: () => void;
  continueWithStandardMode: () => void;
  turboSkipped: boolean;
}

export function useBrxScanner(options: UseBrxScannerOptions = {}): UseBrxScannerReturn {
  const {
    onError,
    apiBaseUrl = '/brx-match',
    requestTimeoutMs = BALANCED.requestTimeoutMs,
    scanMode = 'auto',
    autoOpenCamera = false,
    autoReviewOnReady = false,
  } = options;

  const [state, setState] = useState<ScannerState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cameraOpenedRef = useRef(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const {
    modelStatus,
    modelProgress,
    modelError,
    turboSkipped,
    retryModelDownload,
    continueWithStandardMode,
    runOnnxEmbed,
    isTurboReady,
    onnxCanvasRef,
    onnxCtxRef,
    tensorBufferRef,
  } = useOnnxSession({ apiBaseUrl });

  const handleReviewOpen = useCallback(() => {
    setState('matched');
  }, []);

  const {
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
  } = useCaptureQueue({
    videoRef,
    canvasRef,
    apiBaseUrl,
    scanMode,
    requestTimeoutMs,
    captureMaxMs: BALANCED.captureMaxMs,
    isTurboReady,
    runOnnxEmbed,
    onnxCanvasRef,
    onnxCtxRef,
    tensorBufferRef,
    autoReviewOnReady,
    onReviewOpen: handleReviewOpen,
  });

  const stopScanning = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    resetQueue();
    setState('idle');
  }, [resetQueue]);

  useEffect(() => () => stopScanning(), [stopScanning]);

  const openCamera = useCallback(async (): Promise<void> => {
    setState('requesting_camera');
    setErrorMessage(null);
    resetQueue();

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      });
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Permesso fotocamera negato. Consenti l\'accesso e riprova.'
          : 'Impossibile accedere alla fotocamera.';
      setErrorMessage(msg);
      setState('error');
      onError?.(msg);
      return;
    }

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => {});
    }

    setState('scanning');
  }, [onError, resetQueue]);

  useEffect(() => {
    if (!autoOpenCamera || cameraOpenedRef.current) return;
    if (turboSkipped || modelStatus === 'ready') {
      cameraOpenedRef.current = true;
      void openCamera();
    }
  }, [autoOpenCamera, modelStatus, turboSkipped, openCamera]);

  const handleCloseReview = useCallback(() => {
    closeReview();
    if (state === 'matched') setState('scanning');
  }, [closeReview, state]);

  return {
    state,
    result: reviewResult,
    errorMessage,
    modelStatus,
    modelProgress,
    modelError,
    videoRef,
    canvasRef,
    queue,
    processingCount,
    readyCount,
    pendingReviewCount,
    reviewItemId,
    reviewItem,
    capturePhoto,
    openReview: (id: string) => {
      openReview(id);
      setState('matched');
    },
    openFirstReady: () => {
      const opened = openFirstReady();
      if (opened) setState('matched');
      return opened;
    },
    openNextReady: () => {
      const opened = openNextReady();
      if (opened) setState('matched');
      return opened;
    },
    dismissAndAdvance: (id: string) => {
      const opened = dismissAndAdvance(id);
      if (opened) setState('matched');
      else setState((s) => (s === 'matched' ? 'scanning' : s));
      return opened;
    },
    retryItem: (id: string) => {
      retryItem(id);
      setState((s) => (s === 'matched' ? 'scanning' : s));
    },
    closeReview: handleCloseReview,
    dismissItem,
    openCamera,
    stopScanning,
    retryModelDownload,
    continueWithStandardMode,
    turboSkipped,
  };
}
