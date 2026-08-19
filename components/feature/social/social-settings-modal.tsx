'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellOff, Eye, EyeOff, ExternalLink, Settings, ShieldCheck, X } from 'lucide-react';
import {
  getDndStatus,
  getEbartexProfileUrl,
  getEbartexVisibility,
  setDndStatus,
  setEbartexVisibility,
} from '@/lib/social-preferences';
import { setSocialDndAction, setSocialEbartexVisibilityAction } from '@/actions/social';
import { cn } from '@/lib/utils';

interface SocialSettingsModalProps {
  open: boolean;
  onClose: () => void;
  gamertag?: string | null;
  ebartexUsername?: string | null;
}

export function SocialSettingsModal({ open, onClose, ebartexUsername }: SocialSettingsModalProps) {
  const [dnd, setDnd] = useState(() => getDndStatus());
  const [showEbartex, setShowEbartex] = useState(() => getEbartexVisibility());
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setDnd(getDndStatus());
    setShowEbartex(getEbartexVisibility());
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const handleToggleDnd = async (enable: boolean) => {
    setSaving(true);
    const updated = setDndStatus(enable, 60);
    setDnd(updated);
    await setSocialDndAction(enable, 60);
    setSaving(false);
  };

  const handleToggleEbartexVisibility = async (visible: boolean) => {
    setShowEbartex(visible);
    setEbartexVisibility(visible);
    await setSocialEbartexVisibilityAction(visible);
  };

  const ebartexUrl = getEbartexProfileUrl(ebartexUsername);

  return createPortal(
    <div role="presentation" className="fixed inset-0 z-[1000] grid place-items-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Impostazioni Social e Profilo"
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white shadow-sm">
              <Settings className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-slate-900 sm:text-lg">Impostazioni Social</h3>
              <p className="text-xs font-semibold text-slate-400">Profilo Ebartex & Disponibilità</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="mt-5 space-y-6">
          {/* Sezione 1: Profilo Ebartex & Privacy Visibilità */}
          <section className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Profilo Marketplace Ebartex
              </h4>
            </div>
            <p className="text-xs font-medium leading-relaxed text-slate-500 mb-3.5">
              Scegli se permettere agli altri duellanti di vedere il link al tuo account Ebartex e alle carte che vendi.
            </p>

            {/* Opzioni di visibilità */}
            <div className="space-y-2 mb-3.5">
              <button
                type="button"
                onClick={() => handleToggleEbartexVisibility(true)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition',
                  showEbartex
                    ? 'border-slate-900 bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/10'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-white',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Eye className={cn('h-4 w-4', showEbartex ? 'text-slate-900' : 'text-slate-400')} />
                  <div>
                    <p className="text-xs font-bold">Visibile a tutti</p>
                    <p className="text-[10px] text-slate-500">Mostra il link alle mie carte sul profilo</p>
                  </div>
                </div>
                {showEbartex && <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => handleToggleEbartexVisibility(false)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition',
                  !showEbartex
                    ? 'border-slate-900 bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/10'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-white',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <EyeOff className={cn('h-4 w-4', !showEbartex ? 'text-slate-900' : 'text-slate-400')} />
                  <div>
                    <p className="text-xs font-bold">Nascosto (Privato)</p>
                    <p className="text-[10px] text-slate-500">Nessun collegamento al profilo Ebartex</p>
                  </div>
                </div>
                {!showEbartex && <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />}
              </button>
            </div>

            <a
              href={ebartexUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
            >
              <span>Apri il mio profilo Ebartex</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </a>
          </section>

          {/* Sezione 2: Disponibilità Sfide / Non Disturbare */}
          <section className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Ricezione Inviti di Gioco
              </h4>
              {dnd.active && (
                <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700">
                  {dnd.minutesRemaining} min rimasti
                </span>
              )}
            </div>
            <p className="text-xs font-medium leading-relaxed text-slate-500 mb-4">
              Puoi bloccare temporaneamente le sfide dirette dagli amici se vuoi giocare senza interruzioni.
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleToggleDnd(false)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl border p-3 text-left transition',
                  !dnd.active
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-400/30'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn('grid h-8 w-8 place-items-center rounded-lg', !dnd.active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400')}>
                    <Bell className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-black">Disponibile alle sfide</p>
                    <p className="text-[10px] font-medium text-slate-500">Gli amici possono invitarti a duellare</p>
                  </div>
                </div>
                {!dnd.active && <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => handleToggleDnd(true)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl border p-3 text-left transition',
                  dnd.active
                    ? 'border-amber-500 bg-amber-50/70 text-amber-900 ring-1 ring-amber-400/30'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn('grid h-8 w-8 place-items-center rounded-lg', dnd.active ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-400')}>
                    <BellOff className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-black">Non disturbare (60 min)</p>
                    <p className="text-[10px] font-medium text-slate-500">Blocca gli inviti; gli altri vedranno che sei occupato</p>
                  </div>
                </div>
                {dnd.active && <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
