/** Cattura JPEG dalla preview video + miniatura per la coda. */

const CAPTURE_W = 768;
const THUMB_W = 96;

function drawCenterCrop(
  source: CanvasImageSource,
  sw: number,
  sh: number,
  canvas: HTMLCanvasElement,
  outW: number,
): CanvasRenderingContext2D | null {
  const side = Math.min(sw, sh);
  const sx = (sw - side) / 2;
  const sy = (sh - side) / 2;
  const outH = Math.round(outW * (side / side));
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(source, sx, sy, side, side, 0, 0, outW, outH);
  return ctx;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
  });
}

export async function snapshotFromVideo(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): Promise<{ blob: Blob; thumbnailUrl: string } | null> {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh || video.readyState < 2) return null;

  const ctx = drawCenterCrop(video, vw, vh, canvas, CAPTURE_W);
  if (!ctx) return null;

  const blob = await canvasToBlob(canvas, 0.85);
  if (!blob) return null;

  drawCenterCrop(video, vw, vh, canvas, THUMB_W);
  const thumbBlob = await canvasToBlob(canvas, 0.72);
  if (!thumbBlob) return null;

  const thumbnailUrl = URL.createObjectURL(thumbBlob);
  return { blob, thumbnailUrl };
}
