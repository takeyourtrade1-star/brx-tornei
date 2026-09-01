'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, X } from 'lucide-react';
import { getEbartexProfileUrl, type DndStatus } from '@/lib/social-preferences';
import {
  getSocialPreferencesAction,
  setSocialDndAction,
  setSocialEbartexVisibilityAction,
} from '@/actions/social-preferences';
import { cn } from '@/lib/utils';

interface SocialSettingsModalProps {
  open: boolean;
  onClose: () => void;
  gamertag?: string | null;
  ebartexUsername?: string | null;
}

export function SocialSettingsModal({ open, onClose, ebartexUsername }: SocialSettingsModalProps) {
  const [dnd, setDnd] = useState<DndStatus>({ active: false, minutesRemaining: 0, expiresAt: null });
  const [showEbartex, setShowEbartex] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setSaving(true);
    setError(null);
    void getSocialPreferencesAction().then((result) => {
      if (cancelled) return;
      setSaving(false);
      if (!result.ok || !result.data) {
        setAvailable(false);
        setError(result.error ?? 'Preferenze social non disponibili.');
        return;
      }
      const expiresAt = result.data.dndUntil;
      setDnd({
        active: Boolean(expiresAt && expiresAt > Date.now()),
        minutesRemaining: expiresAt
          ? Math.max(1, Math.ceil((expiresAt - Date.now()) / 60_000))
          : 0,
        expiresAt,
      });
      setShowEbartex(result.data.showEbartexProfile);
      setAvailable(true);
    });
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      cancelled = true;
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const handleToggleDnd = async (enable: boolean) => {
    setSaving(true);
    setError(null);
    const result = await setSocialDndAction({ active: enable, durationMinutes: 60 });
    if (result.ok && result.data) {
      const expiresAt = result.data.dndUntil;
      setDnd({
        active: Boolean(expiresAt && expiresAt > Date.now()),
        minutesRemaining: expiresAt
          ? Math.max(1, Math.ceil((expiresAt - Date.now()) / 60_000))
          : 0,
        expiresAt,
      });
    } else {
      setError(result.error ?? 'Impossibile aggiornare lo stato.');
    }
    setSaving(false);
  };

  const handleToggleEbartexVisibility = async (visible: boolean) => {
    setSaving(true);
    setError(null);
    const result = await setSocialEbartexVisibilityAction({ visible });
    if (result.ok && result.data) setShowEbartex(result.data.showEbartexProfile);
    else setError(result.error ?? 'Impossibile aggiornare la visibilità.');
    setSaving(false);
  };

  const ebartexUrl = getEbartexProfileUrl(ebartexUsername);
  const accountLabel = ebartexUsername?.trim() || 'account Ebartex';

  return createPortal(
    <div role="presentation" className="fixed inset-0 z-[1000] grid place-items-center p-4 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Impostazioni Social"
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/12 bg-slate-900 p-6 text-white shadow-2xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[#FF7300]/15 blur-3xl" />

        <header className="relative flex items-start justify-between gap-4 pb-5">
          <div>
            <h2 className="text-xl font-black tracking-tight">Impostazioni Social</h2>
            <p className="mt-1 text-sm font-medium text-white/55">
              Visibilità del profilo e inviti di gioco
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/12 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="relative space-y-6">
          <section className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-white/40">
                Profilo Ebartex
              </h3>
              <span className="truncate text-[11px] font-semibold text-white/45">@{accountLabel}</span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <ChoiceCard
                active={showEbartex}
                disabled={!available || saving}
                onClick={() => handleToggleEbartexVisibility(true)}
                title="Visibile"
                description="Le carte in vendita appaiono sul profilo duellante."
              />
              <ChoiceCard
                active={!showEbartex}
                disabled={!available || saving}
                onClick={() => handleToggleEbartexVisibility(false)}
                title="Nascosto"
                description="Gli altri vedono solo le statistiche di torneo."
              />
            </div>

            <a
              href={ebartexUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/80 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
            >
              <span>Apri il profilo su Ebartex</span>
              <ExternalLink className="h-3.5 w-3.5 text-white/40" />
            </a>
          </section>

          <section className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-white/40">
                Inviti di gioco
              </h3>
              {dnd.active && (
                <span className="text-[11px] font-semibold text-amber-300/90">
                  Occupato · {dnd.minutesRemaining} min
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <ChoiceCard
                active={!dnd.active}
                disabled={!available || saving}
                onClick={() => handleToggleDnd(false)}
                title="Disponibile"
                description="Gli amici possono inviarti sfide 1v1."
              />
              <ChoiceCard
                active={dnd.active}
                disabled={!available || saving}
                onClick={() => handleToggleDnd(true)}
                title="Non disturbare"
                description="Niente inviti per 60 minuti."
              />
            </div>
          </section>
          {error && (
            <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ChoiceCard({
  active,
  disabled,
  onClick,
  title,
  description,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-2xl border px-4 py-3.5 text-left transition',
        active
          ? 'border-[#FF7300]/70 bg-[#FF7300]/10'
          : 'border-white/10 bg-white/[0.03] hover:border-white/18 hover:bg-white/[0.06]',
        disabled && 'cursor-not-allowed opacity-55',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-black tracking-tight text-white">{title}</p>
        <span
          className={cn(
            'mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border',
            active ? 'border-[#FF7300] bg-[#FF7300]' : 'border-white/25 bg-transparent',
          )}
        />
      </div>
      <p className="mt-1.5 text-xs font-medium leading-snug text-white/50">{description}</p>
    </button>
  );
}
