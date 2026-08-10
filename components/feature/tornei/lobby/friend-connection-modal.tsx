'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LobbyModalHeader } from './lobby-modal-header';
import { useLobbyModal } from './use-lobby-modal';
import modalFont from '../tournament-modal-font.module.css';

interface FriendConnectionModalProps {
  open: boolean;
  mode: 'create' | 'join';
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function FriendConnectionModal({
  open,
  mode,
  busy = false,
  error,
  onClose,
  onConfirm,
}: FriendConnectionModalProps) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => setMounted(true), []);
  useLobbyModal(open && mounted, dialogRef, onClose, busy);
  if (!open || !mounted) return null;

  return createPortal(
    <div
      data-lobby-modal-root="true"
      className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        disabled={busy}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="friend-connection-title"
        aria-describedby="friend-connection-description"
        className={cn(
          modalFont.uiSans,
          'relative w-full max-w-lg overflow-hidden rounded-t-[2rem] border border-slate-900/[0.08] bg-white text-header-bg shadow-[0_32px_80px_-24px_rgba(15,23,42,0.4)] sm:rounded-[2rem]',
        )}
      >
        <div className="h-1 bg-gradient-to-r from-[#FF7300] to-[#e0564d]" aria-hidden />
        <LobbyModalHeader
          eyebrow={mode === 'join' ? 'Tavolo P2P' : 'Nuovo tavolo'}
          titleId="friend-connection-title"
          descriptionId="friend-connection-description"
          title="Sfida i tuoi amici"
          description="Gioca in P2P e divertiti."
          onClose={onClose}
          closeDisabled={busy}
        />

        <div className="px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary/[0.05] px-4 py-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#FF7300] to-[#e0564d] text-white">
              <Users className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-sm font-black text-header-bg">Sfida P2P con fallback automatico</p>
          </div>
          {error && (
            <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}
        </div>

        <footer className="flex gap-3 border-t border-slate-900/[0.06] bg-slate-50 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full border border-slate-900/15 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:text-header-bg disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            data-modal-initial-focus="true"
            className="flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-5 py-3 text-sm font-black text-white shadow-[0_8px_20px_-8px_rgba(255,115,0,0.45)] disabled:opacity-50"
          >
            {busy ? 'Attendi…' : mode === 'join' ? 'Continua' : 'Siediti'}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
