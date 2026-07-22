'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Gamepad2, ShieldCheck, Users } from 'lucide-react';
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
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
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
          'simple-panel-solid relative w-full max-w-xl overflow-hidden rounded-b-none sm:rounded-3xl',
        )}
      >
        <div className="h-1 bg-gradient-to-r from-primary to-orange-500" aria-hidden="true" />
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
            <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Tipo di partita">
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
            <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/20 text-primary">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-extrabold text-white">Un consiglio per giocare sereni</p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-white/65">
                  Gioca solo con persone che conosci davvero.
                </p>
              </div>
            </div>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-2xl border border-destructive/40 bg-destructive/15 px-4 py-3 text-sm font-semibold text-white"
            >
              {error}
            </p>
          )}
        </div>

        <footer className="flex gap-3 border-t border-white/10 bg-black/20 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white/80 transition hover:bg-white/10 disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onConfirm(withFriend)}
            data-modal-initial-focus={mode === 'join' ? 'true' : undefined}
            className="flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-primary to-orange-500 px-5 py-3 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
        'group min-h-36 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        selected
          ? 'border-primary/70 bg-primary/15 ring-1 ring-primary/30'
          : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.07]',
      )}
    >
      <span
        className={cn(
          'grid h-10 w-10 place-items-center rounded-xl transition',
          selected ? 'bg-primary text-white' : 'bg-white/10 text-white/65 group-hover:text-white',
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-base font-black text-white">{title}</p>
      <p className="mt-1 text-sm font-medium leading-relaxed text-white/55">{description}</p>
    </button>
  );
}
