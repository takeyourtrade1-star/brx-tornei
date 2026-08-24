'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { Share2, X } from 'lucide-react';
import { buildFriendInviteShareMessage, buildFriendInviteUrl } from '@/lib/friend-invite';

const QR_MARK_SRC = '/logo-pwa.svg';
const QR_SIZE = 240;
const QR_MARK_SIZE = 58;
const QR_EXPORT_SIZE = 512;

interface FriendQrModalProps {
  open: boolean;
  onClose: () => void;
  gamertag?: string | null;
}

export function FriendQrModal({ open, onClose, gamertag }: FriendQrModalProps) {
  const [mounted, setMounted] = useState(false);
  const [origin, setOrigin] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const qrDisplayRef = useRef<HTMLDivElement>(null);
  const qrExportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!open) return;
    setShareHint(null);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const inviteUrl = useMemo(
    () => (gamertag && origin ? buildFriendInviteUrl(origin, gamertag) : ''),
    [gamertag, origin],
  );

  const handleShare = async () => {
    if (!inviteUrl || !gamertag || sharing) return;
    setSharing(true);
    setShareHint(null);
    try {
      const { title, text } = buildFriendInviteShareMessage(gamertag, inviteUrl);
      const qrCanvas =
        canvasFrom(qrExportRef.current) ?? canvasFrom(qrDisplayRef.current);
      const qrFile = await buildShareCardFile(qrCanvas, gamertag, inviteUrl);
      const shared = await shareInvite({ title, text, url: inviteUrl, file: qrFile });
      if (shared === 'copied') setShareHint('Link copiato negli appunti.');
      if (shared === 'shared-image' && dropsShareCaption()) {
        setShareHint('Se la chat mostra solo il QR, incolla il link (già copiato) sotto.');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setShareHint('Impossibile condividere. Copia il link a mano.');
    } finally {
      setSharing(false);
    }
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-[1000] grid place-items-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Aggiungi amici"
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/15 bg-slate-900/95 p-6 text-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[#FF7300]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-12 h-40 w-40 rounded-full bg-[#3D65C6]/30 blur-3xl" />

        <header className="relative mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0 pr-2">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/45">
              BRX Tornei
            </p>
            <h2 className="font-display text-xl font-black tracking-tight">Aggiungi amici</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {inviteUrl ? (
          <div className="relative space-y-5">
            <div className="mx-auto w-fit rounded-[1.75rem] bg-gradient-to-br from-[#FF7300] via-[#e0564d] to-[#3D65C6] p-[3px] shadow-[0_12px_40px_-12px_rgba(255,115,0,0.65)]">
              <div ref={qrDisplayRef} className="rounded-[1.55rem] bg-white p-3.5">
                <QRCodeCanvas
                  value={inviteUrl}
                  size={QR_SIZE}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#0F172A"
                  imageSettings={{
                    src: QR_MARK_SRC,
                    height: QR_MARK_SIZE,
                    width: QR_MARK_SIZE,
                    excavate: true,
                  }}
                />
              </div>
            </div>
            <div
              ref={qrExportRef}
              aria-hidden
              className="pointer-events-none absolute left-[-9999px] top-0 h-[512px] w-[512px] overflow-hidden"
            >
              <QRCodeCanvas
                value={inviteUrl}
                size={QR_EXPORT_SIZE}
                level="H"
                includeMargin
                bgColor="#ffffff"
                fgColor="#0F172A"
              />
            </div>
            <div className="text-center">
              <p className="truncate font-display text-lg font-black tracking-tight text-white">
                {gamertag}
              </p>
              <p className="mx-auto mt-1.5 max-w-[16.5rem] text-[13px] font-semibold leading-relaxed text-white/70">
                Fai inquadrare il codice: si apre Tornei con la richiesta di
                amicizia già pronta.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleShare()}
              disabled={sharing}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] text-xs font-black uppercase tracking-wider text-white shadow-md hover:brightness-105 disabled:opacity-60"
            >
              <Share2 className="h-4 w-4" />
              {sharing ? 'Condivisione…' : 'Condividi'}
            </button>
            {shareHint ? (
              <p className="text-center text-[12px] font-semibold text-white/65">{shareHint}</p>
            ) : null}
          </div>
        ) : (
          <p className="py-8 text-center text-sm font-semibold text-white/60">
            Imposta un gamertag per generare il tuo QR.
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}

function canvasFrom(root: HTMLElement | null): HTMLCanvasElement | null {
  return root?.querySelector('canvas') ?? null;
}

async function buildShareCardFile(
  qrCanvas: HTMLCanvasElement | null,
  gamertag: string,
  url: string,
): Promise<File | null> {
  if (!qrCanvas) return null;
  try {
    const pad = 40;
    const qrSize = 480;
    const header = 88;
    const footer = 108;
    const width = qrSize + pad * 2;
    const height = header + qrSize + footer;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvasToPngFile(qrCanvas, `brx-${gamertag}-qr.png`);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#FF7300';
    ctx.font = '700 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BRX TORNEI', width / 2, 36);

    ctx.fillStyle = '#0F172A';
    ctx.font = '800 28px system-ui, sans-serif';
    ctx.fillText(truncateCanvasText(ctx, gamertag, width - pad * 2), width / 2, 68);

    ctx.drawImage(qrCanvas, pad, header, qrSize, qrSize);

    ctx.fillStyle = '#64748b';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText('Tocca il link per aggiungere agli amici', width / 2, header + qrSize + 28);

    ctx.fillStyle = '#0F172A';
    ctx.font = '600 14px ui-monospace, SFMono-Regular, Menlo, monospace';
    wrapCanvasText(ctx, url, width / 2, header + qrSize + 52, width - pad * 2, 18);

    const blob = await canvasBlob(canvas);
    if (!blob) return canvasToPngFile(qrCanvas, `brx-${gamertag}-qr.png`);
    return new File([blob], `brx-${gamertag}-invito.png`, { type: 'image/png' });
  } catch {
    return canvasToPngFile(qrCanvas, `brx-${gamertag}-qr.png`);
  }
}

function truncateCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let next = text;
  while (next.length > 1 && ctx.measureText(`${next}…`).width > maxWidth) {
    next = next.slice(0, -1);
  }
  return `${next}…`;
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const chars = [...text];
  let line = '';
  let row = 0;
  for (const char of chars) {
    const trial = line + char;
    if (ctx.measureText(trial).width > maxWidth && line) {
      ctx.fillText(line, x, y + row * lineHeight);
      line = char;
      row += 1;
      if (row >= 2) break;
    } else {
      line = trial;
    }
  }
  if (row < 3 && line) ctx.fillText(line, x, y + row * lineHeight);
}

async function canvasToPngFile(canvas: HTMLCanvasElement | null, filename: string): Promise<File | null> {
  if (!canvas) return null;
  const blob = await canvasBlob(canvas);
  if (!blob) return null;
  return new File([blob], filename, { type: 'image/png' });
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((next) => resolve(next), 'image/png');
    } catch {
      resolve(null);
    }
  });
}

function dropsShareCaption(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function canSharePayload(data: ShareData): boolean {
  if (typeof navigator.canShare !== 'function') return !data.files;
  try {
    return navigator.canShare(data);
  } catch {
    return false;
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

async function shareInvite(input: {
  title: string;
  text: string;
  url: string;
  file: File | null;
}): Promise<'shared' | 'shared-image' | 'copied'> {
  const linkOnly: ShareData = { title: input.title, text: input.text, url: input.url };
  const imageAndCaption: ShareData | null = input.file
    ? { title: input.title, text: input.text, files: [input.file] }
    : null;
  const imageCaptionAndUrl: ShareData | null = input.file
    ? { title: input.title, text: input.text, url: input.url, files: [input.file] }
    : null;

  if (typeof navigator.share !== 'function') {
    const copied = await copyText(input.url);
    if (!copied) throw new Error('clipboard-failed');
    return 'copied';
  }

  const attempts: Array<{ payload: ShareData; kind: 'shared' | 'shared-image' }> = [];
  if (imageCaptionAndUrl && canSharePayload(imageCaptionAndUrl)) {
    attempts.push({ payload: imageCaptionAndUrl, kind: 'shared-image' });
  }
  if (imageAndCaption && canSharePayload(imageAndCaption)) {
    attempts.push({ payload: imageAndCaption, kind: 'shared-image' });
  }
  if (canSharePayload(linkOnly) || typeof navigator.canShare !== 'function') {
    attempts.push({ payload: linkOnly, kind: 'shared' });
  }
  attempts.push({ payload: { title: input.title, text: input.text }, kind: 'shared' });

  let lastError: unknown;
  for (const attempt of attempts) {
    if (attempt.kind === 'shared-image' && dropsShareCaption()) {
      await copyText(input.url);
    }
    try {
      await navigator.share(attempt.payload);
      return attempt.kind;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      lastError = error;
    }
  }

  const copied = await copyText(input.url);
  if (copied) return 'copied';
  throw lastError instanceof Error ? lastError : new Error('share-failed');
}
