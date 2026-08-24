'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { Share2, X } from 'lucide-react';
import { buildFriendInviteUrl } from '@/lib/friend-invite';

const QR_MARK_SRC = '/logo-pwa.svg';
const QR_SIZE = 240;
const QR_MARK_SIZE = 58;

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
  const qrCaptureRef = useRef<HTMLDivElement>(null);

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
      const title = `Aggiungi ${gamertag} su BRX Tornei`;
      const text = `${gamertag} ti invita su BRX Tornei. Apri il link per aggiungere l'amicizia.`;
      const qrFile = await canvasToPngFile(
        qrCaptureRef.current?.querySelector('canvas') ?? null,
        `brx-${gamertag}-qr.png`,
      );
      const shared = await shareInvite({ title, text, url: inviteUrl, file: qrFile });
      if (shared === 'copied') setShareHint('Link copiato negli appunti.');
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
              <div ref={qrCaptureRef} className="rounded-[1.55rem] bg-white p-3.5">
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

async function canvasToPngFile(canvas: HTMLCanvasElement | null, filename: string): Promise<File | null> {
  if (!canvas) return null;
  const blob = await new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob((next) => resolve(next), 'image/png');
    } catch {
      resolve(null);
    }
  });
  if (!blob) return null;
  return new File([blob], filename, { type: 'image/png' });
}

async function shareInvite(input: {
  title: string;
  text: string;
  url: string;
  file: File | null;
}): Promise<'shared' | 'copied'> {
  const withFile =
    input.file &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [input.file] });
  if (typeof navigator.share === 'function') {
    await navigator.share(
      withFile && input.file
        ? { title: input.title, text: `${input.text}\n${input.url}`, files: [input.file] }
        : { title: input.title, text: input.text, url: input.url },
    );
    return 'shared';
  }
  await navigator.clipboard.writeText(input.url);
  return 'copied';
}
