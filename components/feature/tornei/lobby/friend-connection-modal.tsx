'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Gamepad2, ShieldCheck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LobbyModalHeader } from './lobby-modal-header';
import { useLobbyModal } from './use-lobby-modal';
import modalFont from '../tournament-modal-font.module.css';

type GameChoice = 'normal' | 'friends';

interface FriendConnectionModalProps {
  open: boolean;
  mode: 'create' | 'join';
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (withFriend: boolean) => void;
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
  const [choice, setChoice] = useState<GameChoice>('normal');
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    setChoice(mode === 'join' ? 'friends' : 'normal');
  }, [open, mode]);

  useLobbyModal(open && mounted, dialogRef, onClose, busy);

  if (!open || !mounted) return null;

  const withFriend = mode === 'join' || choice === 'friends';
  const title = mode === 'join' ? 'Entra nel tavolo di un amico' : 'Come vuoi giocare?';
  const description = mode === 'join'
    ? 'Questo tavolo è pensato per persone che si conoscono.'
    : 'Scegli il tipo di partita. Potrai sederti subito dopo.';

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
          'relative w-full max-w-xl overflow-hidden rounded-t-[2rem] border border-slate-900/[0.08] bg-white text-header-bg shadow-[0_32px_80px_-24px_rgba(15,23,42,0.4)] sm:rounded-[2rem]',
        )}
      >
        <div className="h-1 bg-gradient-to-r from-[#FF7300] to-[#e0564d]" aria-hidden="true" />
        <LobbyModalHeader
          eyebrow="Nuovo tavolo"
          titleId="friend-connection-title"
          descriptionId="friend-connection-description"
          title={title}
          description={description}
          onClose={onClose}
          closeDisabled={busy}
        />

        <div className="space-y-4 px-5 py-5 sm:px-6">
          {mode === 'create' && (
            <div
              className="grid auto-rows-fr grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-1.5"
              role="group"
              aria-label="Tipo di partita"
            >
              <ChoiceCard
                selected={choice === 'normal'}
                icon={Gamepad2}
                title="Partita normale"
                description="Entra nella lobby e gioca con la community."
                onClick={() => setChoice('normal')}
                initialFocus
              />
              <ChoiceCard
                selected={withFriend}
                icon={Users}
                title="Gioca con amici"
                description="Crea un tavolo dedicato a chi conosci."
                onClick={() => setChoice('friends')}
              />
            </div>
          )}

          {withFriend && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-50 p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-extrabold text-header-bg">Un consiglio per giocare sereni</p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-slate-600">
                  Gioca solo con persone che conosci davvero.
                </p>
              </div>
            </div>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
            >
              {error}
            </p>
          )}
        </div>

        <footer className="flex gap-3 border-t border-slate-900/[0.06] bg-slate-50 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full border border-slate-900/15 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-header-bg disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onConfirm(withFriend)}
            data-modal-initial-focus={mode === 'join' ? 'true' : undefined}
            className="flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-5 py-3 text-sm font-black text-white shadow-[0_8px_20px_-8px_rgba(255,115,0,0.45)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Attendi…' : mode === 'join' ? 'Continua' : 'Siediti'}
          </button>
        </footer>
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
  initialFocus = false,
}: {
  selected: boolean;
  icon: typeof Gamepad2;
  title: string;
  description: string;
  onClick: () => void;
  initialFocus?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      data-modal-initial-focus={initialFocus ? 'true' : undefined}
      className={cn(
        'group relative isolate flex h-full min-h-40 flex-col overflow-hidden rounded-[1.6rem] border p-3.5 text-left transition duration-200 sm:p-4',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        selected
          ? 'border-primary/50 bg-white shadow-[0_10px_28px_-14px_rgba(255,115,0,0.4)] ring-1 ring-primary/25'
          : 'border-slate-900/[0.08] bg-white hover:border-primary/30 hover:shadow-[0_12px_30px_-14px_rgba(15,23,42,0.22)]',
      )}
    >
      <span
        className={cn(
          'absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border transition',
          selected
            ? 'border-primary/50 bg-primary/10 text-primary'
            : 'border-slate-900/15 bg-slate-50 text-transparent',
        )}
        aria-hidden="true"
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      <span
        className={cn(
          'grid h-10 w-10 place-items-center rounded-xl transition sm:h-11 sm:w-11',
          selected
            ? 'bg-gradient-to-br from-[#FF7300] to-[#e0564d] text-white shadow-md shadow-orange-500/30'
            : 'bg-slate-100 text-slate-400 group-hover:bg-header-bg group-hover:text-white',
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-black leading-tight text-header-bg sm:text-base">{title}</p>
      <p className="mt-1.5 text-xs font-semibold leading-relaxed text-slate-500 sm:text-sm">{description}</p>
      <span
        className={cn(
          'mt-auto pt-3 text-[10px] font-black uppercase tracking-[0.14em]',
          selected ? 'text-primary' : 'text-slate-300',
        )}
      >
        {selected ? 'Selezionata' : 'Seleziona'}
      </span>
    </button>
  );
}
