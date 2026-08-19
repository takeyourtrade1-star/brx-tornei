'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellOff, CheckCircle2, ExternalLink, Eye, EyeOff, Settings, Sparkles, X } from 'lucide-react';
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
  const displayAccountName = ebartexUsername?.trim() || 'il tuo account';

  return createPortal(
    <div role="presentation" className="fixed inset-0 z-[1000] grid place-items-center p-4 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-all" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Impostazioni Social e Privacy"
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-slate-900/95 p-6 sm:p-7 text-white shadow-2xl backdrop-blur-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-[#FF7300]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />

        {/* Header */}
        <header className="relative flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 border border-white/15 text-[#FF7300]">
              <Settings className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">Impostazioni Social</h3>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                  Privacy & Inviti
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400">
                Personalizza presenza e visibilità del tuo account
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/15 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Body */}
        <div className="relative mt-5 space-y-5">
          {/* Sezione 1: Marketplace */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#FF7300]" /> Profilo Marketplace Ebartex
              </span>
              <span className="text-[10px] font-semibold text-slate-400">@{displayAccountName}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <OptionCard
                active={showEbartex}
                onClick={() => handleToggleEbartexVisibility(true)}
                icon={<Eye className="h-4 w-4" />}
                title="Visibile a tutti"
                description="Mostra il link alle tue carte in vendita sul tuo profilo duellante."
                accent="emerald"
              />
              <OptionCard
                active={!showEbartex}
                onClick={() => handleToggleEbartexVisibility(false)}
                icon={<EyeOff className="h-4 w-4" />}
                title="Privato"
                description="Nessun collegamento visibile. Mostra solo le tue statistiche torneo."
                accent="slate"
              />
            </div>

            <a
              href={ebartexUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-white/10 hover:text-white transition"
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Apri la tua pagina utente su Ebartex</span>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </a>
          </section>

          {/* Sezione 2: Inviti */}
          <section className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 text-[#FF7300]" /> Disponibilità Inviti di Gioco
              </span>
              {dnd.active && (
                <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-black text-amber-400 animate-pulse">
                  DND: {dnd.minutesRemaining} min
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <OptionCard
                active={!dnd.active}
                disabled={saving}
                onClick={() => handleToggleDnd(false)}
                icon={<Bell className="h-4 w-4" />}
                title="Disponibile"
                description="Ricevi inviti a sfide 1v1 dagli amici nella lobby dei tornei."
                accent="orange"
              />
              <OptionCard
                active={dnd.active}
                disabled={saving}
                onClick={() => handleToggleDnd(true)}
                icon={<BellOff className="h-4 w-4" />}
                title="Non disturbare"
                description="Pausa inviti di 60 min. Gli altri vedranno che sei occupato."
                accent="amber"
              />
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function OptionCard({
  active,
  disabled,
  onClick,
  icon,
  title,
  description,
  accent,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: 'emerald' | 'orange' | 'amber' | 'slate';
}) {
  const accentStyles = {
    emerald: active ? 'border-emerald-500/80 bg-emerald-950/40 ring-1 ring-emerald-500/50' : '',
    orange: active ? 'border-[#FF7300] bg-orange-950/40 ring-1 ring-[#FF7300]/50' : '',
    amber: active ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500/50' : '',
    slate: active ? 'border-slate-400 bg-slate-800/60 ring-1 ring-slate-400/50' : '',
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'group flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all duration-200',
        active
          ? accentStyles[accent]
          : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]',
        disabled && 'opacity-60 cursor-not-allowed',
      )}
    >
      <div className="flex items-start justify-between">
        <span className={cn('grid h-8 w-8 place-items-center rounded-xl border', active ? 'bg-white/15 border-white/25 text-white' : 'bg-white/5 border-white/10 text-slate-400')}>
          {icon}
        </span>
        {active && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
      </div>
      <div className="mt-2.5">
        <p className="text-xs font-black text-white">{title}</p>
        <p className="mt-0.5 text-[11px] font-medium text-slate-400 leading-snug">{description}</p>
      </div>
    </button>
  );
}
