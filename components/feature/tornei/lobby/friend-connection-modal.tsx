'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ShieldCheck, Users, Wifi, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ConnectionChoice = 'protected' | 'direct';

interface FriendConnectionModalProps {
  open: boolean;
  mode: 'create' | 'join';
  busy?: boolean;
  onClose: () => void;
  onConfirm: (withFriend: boolean) => void;
}

export function FriendConnectionModal({
  open,
  mode,
  busy = false,
  onClose,
  onConfirm,
}: FriendConnectionModalProps) {
  const [mounted, setMounted] = useState(false);
  const [choice, setChoice] = useState<ConnectionChoice>('protected');
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    setChoice(mode === 'join' ? 'direct' : 'protected');
    setAcknowledged(false);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, mode, onClose]);

  if (!open || !mounted) return null;

  const direct = choice === 'direct';
  const canConfirm = !busy && (!direct || acknowledged);
  const title = mode === 'join' ? 'Connessione diretta' : 'Come vuoi giocare?';

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Chiudi"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="friend-connection-title"
        className="simple-panel-solid relative w-full max-w-lg rounded-b-none p-5 sm:rounded-3xl sm:p-6"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
              Video partita
            </p>
            <h2 id="friend-connection-title" className="mt-1 font-display text-xl font-black uppercase">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {mode === 'create' && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ChoiceCard
              selected={choice === 'protected'}
              icon={ShieldCheck}
              title="Connessione protetta"
              description="Il video passa dal relay TURN e il tuo IP resta nascosto."
              onClick={() => setChoice('protected')}
            />
            <ChoiceCard
              selected={direct}
              icon={Users}
              title="Gioca con amici"
              description="Prova prima il P2P diretto, con fallback TURN automatico."
              onClick={() => setChoice('direct')}
            />
          </div>
        )}

        {direct && (
          <div className="mt-4 rounded-2xl border border-amber-400/35 bg-amber-400/10 p-4 text-amber-50">
            <div className="flex gap-3">
              <Wifi className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <div>
                <p className="text-sm font-black">Il tuo IP pubblico sarà visibile all’altro giocatore</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-100/75">
                  Usa questa modalità solo con persone fidate. Il flusso diretto non usa banda relay;
                  se la rete lo impedisce, WebRTC passa automaticamente al TURN.
                </p>
              </div>
            </div>
            <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl bg-black/20 p-3">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
                className="sr-only"
              />
              <span
                className={cn(
                  'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border',
                  acknowledged ? 'border-primary bg-primary text-white' : 'border-white/30',
                )}
              >
                {acknowledged && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
              <span className="text-xs font-bold leading-relaxed">
                Ho capito e accetto di condividere il mio IP pubblico con l’altro giocatore.
              </span>
            </label>
          </div>
        )}

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white/80"
          >
            Annulla
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm(direct)}
            className="flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-primary to-orange-500 px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'Attendi\u2026' : mode === 'join' ? 'Continua' : 'Crea tavolo'}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

function ChoiceCard({
  selected,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  icon: typeof ShieldCheck;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'rounded-2xl border p-4 text-left transition',
        selected
          ? 'border-primary/60 bg-primary/10 ring-1 ring-primary/30'
          : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]',
      )}
    >
      <Icon className={cn('h-6 w-6', selected ? 'text-primary' : 'text-white/55')} />
      <p className="mt-3 text-sm font-black text-white">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-white/50">{description}</p>
    </button>
  );
}
