import { BALANCED, shouldRunOrbVerify } from '@/lib/scanner/balancedProfile';
import {
  imageDataToTensor,
  normalizeExposure,
  ONNX_SIZE,
  vectorSearchJson,
} from '@/lib/scanner/preprocess';

import type { ScanResult } from '@/hooks/scanner/scanner-types';

async function blobToBase64Strip(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = reader.result as string;
      resolve(raw.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function blobToImageData224(
  blob: Blob,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): Promise<ImageData | null> {
  const bitmap = await createImageBitmap(blob);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  canvas.width = ONNX_SIZE;
  canvas.height = ONNX_SIZE;
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, ONNX_SIZE, ONNX_SIZE);
  bitmap.close();
  const imageData = ctx.getImageData(0, 0, ONNX_SIZE, ONNX_SIZE);
  // Riporta le carte scure/poco illuminate verso l'esposizione di riferimento
  // prima dell'embedding: è la causa principale dei match falliti al 1° scatto.
  normalizeExposure(imageData);
  return imageData;
}

export interface IdentifyCaptureParams {
  blob: Blob;
  apiBaseUrl: string;
  scanMode: 'auto' | 'fast' | 'full';
  requestTimeoutMs: number;
  isTurboReady: () => boolean;
  runOnnxEmbed: (tensor: Float32Array) => Promise<Float32Array>;
  onnxCanvas: HTMLCanvasElement;
  onnxCtx: CanvasRenderingContext2D;
  tensorBuffer: Float32Array;
}

export type IdentifyCaptureOutcome =
  | { ok: true; result: ScanResult }
  | { ok: false; error: string };

type VectorCandidate = {
  meta_idx: number;
  card_name: string;
  set_name: string;
  set_code: string;
  image_uri: string | null;
  confidence: number;
  search_url: string;
  search_query: string;
  scryfall_id: string;
};

function toScanResult(
  top1: VectorCandidate,
  finalConfidence: number,
  method: string,
  latencyMs: number,
): ScanResult {
  return {
    card_name: top1.card_name,
    set_name: top1.set_name,
    set_code: top1.set_code,
    image_uri: top1.image_uri ?? null,
    scryfall_id: top1.scryfall_id ?? null,
    confidence: finalConfidence,
    method,
    search_url: top1.search_url,
    search_query: top1.search_query ?? '',
    latency_ms: latencyMs,
  };
}

/**
 * Budget di rete per uno scatto *deliberato* in coda. Il loop live usa
 * requestTimeoutMs (~3.2s) per restare reattivo, ma qui l'utente ha scattato
 * apposta e può attendere: 3.2s sono troppo pochi con server freddo o rete
 * mobile e producevano falsi "errore di rete". Il tetto esterno (captureMaxMs)
 * limita comunque il totale.
 */
function captureNetTimeout(params: IdentifyCaptureParams): number {
  return Math.max(params.requestTimeoutMs, 6000);
}

/**
 * Distingue un vero problema di connessione da un timeout. `err instanceof
 * DOMException` non è affidabile su iOS Safari (un fetch abortito lì lancia un
 * TypeError "Load failed"), quindi ci basiamo sul segnale: se è stato abortito
 * è un timeout, altrimenti è la rete davvero assente.
 */
function fetchFailureMessage(controller: AbortController, err: unknown): string {
  const aborted =
    controller.signal.aborted ||
    (err instanceof DOMException && err.name === 'AbortError');
  return aborted
    ? 'Il server ci ha messo troppo. Riprova.'
    : 'Connessione assente: controlla la rete e riprova.';
}

async function identifyOnnx(params: IdentifyCaptureParams): Promise<IdentifyCaptureOutcome> {
  const t0 = performance.now();
  const imageData = await blobToImageData224(
    params.blob,
    params.onnxCanvas,
    params.onnxCtx,
  );
  if (!imageData) {
    return { ok: false, error: 'Impossibile leggere la foto.' };
  }

  imageDataToTensor(imageData, params.tensorBuffer);
  const vector = await params.runOnnxEmbed(params.tensorBuffer.slice());

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), captureNetTimeout(params));

  let searchResp: Response;
  try {
    searchResp = await fetch(`${params.apiBaseUrl}/search-vector`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: vectorSearchJson(vector, BALANCED.searchTopK),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    return { ok: false, error: fetchFailureMessage(controller, err) };
  }
  clearTimeout(timeoutId);

  if (!searchResp.ok) {
    return { ok: false, error: `Identificazione fallita (HTTP ${searchResp.status}).` };
  }

  const searchData = (await searchResp.json()) as { candidates?: VectorCandidate[] };
  const candidates = searchData.candidates ?? [];
  if (!candidates.length || !candidates[0].card_name) {
    return { ok: false, error: 'Nessuna carta riconosciuta nella foto.' };
  }

  const top1 = candidates[0];
  const top2 = candidates[1];
  const margin = top2 ? top1.confidence - top2.confidence : 1;
  let finalConfidence = top1.confidence;
  let method = 'v3+vec';

  if (shouldRunOrbVerify(margin, top1.confidence)) {
    const verifyController = new AbortController();
    const verifyTimeout = setTimeout(() => verifyController.abort(), params.requestTimeoutMs);
    try {
      const b64 = await blobToBase64Strip(params.blob);
      const verifyResp = await fetch(`${params.apiBaseUrl}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta_idx: top1.meta_idx, image_b64: b64 }),
        signal: verifyController.signal,
      });
      if (verifyResp.ok) {
        const vd = (await verifyResp.json()) as { verified?: boolean; confidence?: number };
        if (vd.verified) {
          finalConfidence = Math.max(finalConfidence, vd.confidence ?? finalConfidence);
          method = 'v3+vec+orb';
        }
      }
    } catch {
      // verifica opzionale — continua con solo vettore
    } finally {
      clearTimeout(verifyTimeout);
    }
  }

  return {
    ok: true,
    result: toScanResult(top1, finalConfidence, method, Math.round(performance.now() - t0)),
  };
}

async function identifyLegacy(params: IdentifyCaptureParams): Promise<IdentifyCaptureOutcome> {
  const t0 = performance.now();
  const formData = new FormData();
  formData.append('image', params.blob, 'capture.jpg');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), captureNetTimeout(params));

  try {
    const resp = await fetch(
      `${params.apiBaseUrl}/scan?mode=${encodeURIComponent(params.scanMode)}`,
      { method: 'POST', body: formData, signal: controller.signal },
    );
    clearTimeout(timeoutId);

    if (!resp.ok) {
      return { ok: false, error: `Identificazione fallita (HTTP ${resp.status}).` };
    }

    const data = (await resp.json()) as {
      card_name?: string;
      set_name?: string;
      set_code?: string;
      image_uri?: string | null;
      scryfall_id?: string | null;
      confidence?: number;
      method?: string;
      search_url?: string;
      search_query?: string;
      latency_ms?: number;
    };

    if (!data.card_name) {
      return { ok: false, error: 'Nessuna carta riconosciuta nella foto.' };
    }

    const elapsed = Math.round(performance.now() - t0);
    return {
      ok: true,
      result: {
        card_name: data.card_name,
        set_name: data.set_name ?? '',
        set_code: data.set_code ?? '',
        image_uri: data.image_uri ?? null,
        scryfall_id: data.scryfall_id ?? null,
        confidence: data.confidence ?? 0,
        method: data.method ?? 'legacy',
        search_url: data.search_url ?? '',
        search_query: data.search_query ?? '',
        latency_ms: data.latency_ms ?? elapsed,
      },
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return { ok: false, error: fetchFailureMessage(controller, err) };
  }
}

/** Identifica una singola foto (turbo ONNX o fallback /scan). */
export async function identifyCapture(
  params: IdentifyCaptureParams,
): Promise<IdentifyCaptureOutcome> {
  if (params.isTurboReady()) return identifyOnnx(params);
  return identifyLegacy(params);
}
