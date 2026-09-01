'use client';

import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, KeyRound, LoaderCircle, X } from 'lucide-react';
import { unlockArcadeAction } from '@/actions/arcade';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ArcadeAccessGateProps {
  open: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}

export function ArcadeAccessGate({
  open,
  onClose,
  onUnlocked,
}: ArcadeAccessGateProps) {
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);
  useEffect(() => {
    if (!open) return undefined;
    setError(null);
    setShowPassword(false);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 20);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || pendingRef.current) return;
      event.stopImmediatePropagation();
      onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);
    form.reset();
    startTransition(async () => {
      const result = await unlockArcadeAction(formData);
      if (result.success) {
        onUnlocked();
        return;
      }
      setError(result.error ?? 'Accesso non riuscito.');
      window.setTimeout(() => inputRef.current?.focus(), 20);
    });
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        disabled={pending}
        className="absolute inset-0 bg-header-bg/75 backdrop-blur-md"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="arcade-access-title"
        aria-describedby="arcade-access-description"
        className="relative w-full max-w-md overflow-hidden rounded-t-[2rem] border border-white/10 bg-header-bg text-white shadow-2xl sm:rounded-[2rem]"
      >
        <div className="h-1 bg-gradient-global" aria-hidden="true" />
        <div className="px-6 pb-6 pt-5 sm:px-7 sm:pb-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/20 text-primary">
                <KeyRound className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                  Area riservata
                </p>
                <h2 id="arcade-access-title" className="mt-1 text-xl font-black tracking-tight">
                  Sala Arcade
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              aria-label="Chiudi"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-white/60 transition hover:border-white/25 hover:text-white disabled:opacity-50"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <p id="arcade-access-description" className="mt-5 text-sm leading-6 text-white/65">
            Inserisci la password condivisa con le persone autorizzate per entrare.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            <div>
              <label htmlFor="arcade-password" className="mb-2 block text-xs font-bold text-white/75">
                Password di accesso
              </label>
              <div className="relative">
                <Input
                  ref={inputRef}
                  id="arcade-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="off"
                  required
                  maxLength={256}
                  disabled={pending}
                  className="h-12 border-white/15 bg-white/[0.07] pr-12 text-white placeholder:text-white/30 focus-visible:ring-primary"
                  placeholder="Inserisci la password"
                />
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={pending}
                  aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-white/45 transition hover:text-white disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-destructive/35 bg-destructive/10 px-3 py-2.5 text-sm font-semibold text-red-200">
                {error}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={onClose} disabled={pending} className="text-white/70 hover:bg-white/10 hover:text-white">
                Annulla
              </Button>
              <Button type="submit" disabled={pending} className="min-w-32 bg-gradient-global text-white hover:opacity-90">
                {pending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                {pending ? 'Verifica…' : 'Entra'}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>,
    document.body,
  );
}
