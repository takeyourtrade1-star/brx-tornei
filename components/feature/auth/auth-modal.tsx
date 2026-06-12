'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { LoginForm } from '@/components/feature/auth/login-form';
import { config } from '@/lib/config';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

/**
 * Popup "Accedi o Registrati" per azioni protette.
 * Il form delega al login server-side; i token restano in cookie HttpOnly.
 */
export function AuthModal({ open, onClose, onLoginSuccess }: AuthModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Chiudi"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-md animate-auth-enter"
      >
        <div className="brx-glass rounded-3xl border border-white/20 p-6 shadow-2xl">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2
                id="auth-modal-title"
                className="font-display text-2xl font-black uppercase tracking-wide text-white"
              >
                Accedi o Registrati
              </h2>
              <p className="mt-1 text-sm text-white/70">
                Per continuare devi avere un account Ebartex.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Chiudi finestra"
              className="rounded-full bg-white/10 p-2 ring-1 ring-white/20 transition-colors hover:bg-white/20"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          <LoginForm />

          <p className="mt-4 text-center text-sm text-white/75">
            Non hai un account?{' '}
            <Link
              href="/registrati"
              className="font-semibold text-marquee hover:underline"
              onClick={onClose}
            >
              Registrati
            </Link>{' '}
            oppure accedi prima su{' '}
            <a
              href={config.app.mainSiteUrl}
              className="font-semibold text-marquee hover:underline"
            >
              Ebartex
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
