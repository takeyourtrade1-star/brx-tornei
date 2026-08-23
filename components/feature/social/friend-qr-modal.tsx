'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, X } from 'lucide-react';
import { buildFriendInviteUrl } from '@/lib/friend-invite';

const QR_MARK_SRC = '/images/brx-qr-mark.svg';

interface FriendQrModalProps {
  open: boolean;
  onClose: () => void;
  gamertag?: string | null;
}

export function FriendQrModal({ open, onClose, gamertag }: FriendQrModalProps) {
  const [mounted, setMounted] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setMounted(true);
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!open) return;
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
        aria-label="QR code amici"
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/15 bg-slate-900/95 p-6 text-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[#FF7300]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-12 h-40 w-40 rounded-full bg-[#3D65C6]/30 blur-3xl" />

        <header className="relative mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/15 bg-white/10 text-[#FF7300]">
              <QrCode className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/45">
                BRX Tornei
              </p>
              <h2 className="text-lg font-black tracking-tight">Il tuo QR amici</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {inviteUrl ? (
          <div className="relative space-y-4">
            <div className="mx-auto w-fit rounded-[1.75rem] bg-gradient-to-br from-[#FF7300] via-[#e0564d] to-[#3D65C6] p-[3px] shadow-[0_12px_40px_-12px_rgba(255,115,0,0.65)]">
              <div className="rounded-[1.55rem] bg-white p-3.5">
                <QRCodeSVG
                  value={inviteUrl}
                  size={220}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#0F172A"
                  imageSettings={{
                    src: QR_MARK_SRC,
                    height: 44,
                    width: 44,
                    excavate: true,
                  }}
                />
              </div>
            </div>
            <div className="text-center">
              <p className="truncate text-base font-black tracking-tight">{gamertag}</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-white/60">
                Fai inquadrare questo codice: si apre Tornei con la richiesta
                per aggiungerti agli amici.
              </p>
            </div>
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
