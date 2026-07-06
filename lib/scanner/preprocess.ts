/** DINOv2 224×224 preprocess — tuned for live scanner (reused buffers). */

export const ONNX_SIZE = 224;
const PIXELS = ONNX_SIZE * ONNX_SIZE;

const IMAGENET_MEAN = [0.485, 0.456, 0.406] as const;
const IMAGENET_STD = [0.229, 0.224, 0.225] as const;
const INV255 = 1 / 255;

export function createTensorBuffer(): Float32Array {
  return new Float32Array(3 * PIXELS);
}

/**
 * Normalizza esposizione/contrasto del crop 224 prima dell'embedding.
 *
 * Le carte scure o poco illuminate producono un embedding lontano dalle
 * immagini di riferimento (Scryfall, ben esposte) e quindi match falliti al
 * primo scatto — bastava "riprovare" finché non capitava un frame più chiaro.
 * Uno stretch dei livelli basato sui percentili di luminanza le riporta nella
 * distribuzione attesa. È quasi un'identità sulle foto già ben esposte, così
 * non peggiora i casi che funzionano già.
 *
 * Muta `imageData` in place.
 */
export function normalizeExposure(imageData: ImageData): void {
  const d = imageData.data;
  const n = d.length >> 2;
  if (n === 0) return;

  const hist = new Uint32Array(256);
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) {
    // Luminanza intera veloce (~0.30R + 0.59G + 0.11B).
    const y = (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8;
    hist[y]++;
    sum += y;
  }
  const mean = sum / n;

  // Percentili low/high con clip all'1.5% per ignorare riflessi e ombre estreme.
  const clip = Math.max(1, Math.round(n * 0.015));
  let lo = 0;
  for (let acc = 0, v = 0; v < 256; v++) {
    acc += hist[v];
    if (acc > clip) {
      lo = v;
      break;
    }
  }
  let hi = 255;
  for (let acc = 0, v = 255; v >= 0; v--) {
    acc += hist[v];
    if (acc > clip) {
      hi = v;
      break;
    }
  }

  const range = hi - lo;
  // Già ben esposta e con buon contrasto → non toccare.
  if (mean >= 118 && mean <= 165 && range >= 200) return;
  // Immagine praticamente piatta: uno stretch amplificherebbe solo rumore.
  if (range < 8) return;

  // Scala limitata a 3× per non far esplodere il rumore delle foto molto buie.
  const scale = Math.min(3, 255 / range);
  const lut = new Uint8Array(256);
  for (let v = 0; v < 256; v++) {
    const nv = (v - lo) * scale;
    lut[v] = nv <= 0 ? 0 : nv >= 255 ? 255 : nv;
  }
  // Stessa mappa su tutti i canali: alza la luminosità preservando la tinta.
  for (let i = 0; i < d.length; i += 4) {
    d[i] = lut[d[i]];
    d[i + 1] = lut[d[i + 1]];
    d[i + 2] = lut[d[i + 2]];
  }
}

export function imageDataToTensor(imageData: ImageData, into: Float32Array): void {
  const { data } = imageData;
  for (let i = 0; i < PIXELS; i++) {
    const o = i * 4;
    into[i] = (data[o] * INV255 - IMAGENET_MEAN[0]) / IMAGENET_STD[0];
    into[PIXELS + i] = (data[o + 1] * INV255 - IMAGENET_MEAN[1]) / IMAGENET_STD[1];
    into[2 * PIXELS + i] = (data[o + 2] * INV255 - IMAGENET_MEAN[2]) / IMAGENET_STD[2];
  }
}

/** Fast frame fingerprint — skip duplicate consecutive frames. */
export function frameFingerprint(imageData: ImageData): number {
  const d = imageData.data;
  let h = 2166136261;
  for (let i = 0; i < d.length; i += 256) {
    h ^= d[i];
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function captureFrame224(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): ImageData | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh || video.readyState < 2) return null;

  const side = Math.min(vw, vh);
  const sx = (vw - side) / 2;
  const sy = (vh - side) / 2;
  ctx.drawImage(video, sx, sy, side, side, 0, 0, ONNX_SIZE, ONNX_SIZE);
  return ctx.getImageData(0, 0, ONNX_SIZE, ONNX_SIZE);
}

export function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function vectorSearchJson(vec: Float32Array, topK: number): string {
  const u8 = new Uint8Array(vec.buffer, vec.byteOffset, vec.byteLength);
  return JSON.stringify({
    vector_b64: bytesToBase64(u8),
    top_k: topK,
    mode: 'fast',
  });
}

export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}
