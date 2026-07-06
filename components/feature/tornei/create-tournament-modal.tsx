'use client';

import { useEffect, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Lock, Plus, ShieldCheck, Trophy, X } from 'lucide-react';
import { createTournamentAction } from '@/actions/tournaments';
import type { Selection } from '@/lib/validations/selection';
import type { BestOf } from '@/types/tournament';
import { BEST_OF_LABEL } from './tournament-mock-details';
import { getBuyInLabel } from '@/lib/data/buy-in';
import { cn } from '@/lib/utils';

const BEST_OF_OPTIONS: BestOf[] = ['BO1', 'BO3', 'BO5'];

export interface CreateTournamentResult {
  createdId: string;
  webcamSessionId?: string;
}

interface CreateTournamentModalProps {
  open: boolean;
  selection: Selection;
  formatName: string;
  modeName: string;
  onClose: () => void;
  onCreated: (result: CreateTournamentResult) => void;
}

export function CreateTournamentModal({
  open,
  selection,
  formatName,
  modeName,
  onClose,
  onCreated,
}: CreateTournamentModalProps) {
  const [bestOf, setBestOf] = useState<BestOf>('BO3');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isTournament, setIsTournament] = useState(false);
  const [enableScryfallCheck, setEnableScryfallCheck] = useState(false);
  const [enablePhysicalVerification, setEnablePhysicalVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  // Portal + scroll-lock: la modale deve vivere sotto <body>, non dentro la
  // vista tornei — quel container ha un transform (animate-auth-enter) che
  // altrimenti "cattura" il position:fixed e disallinea l'overlay.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  function handleSubmit() {
    const formData = new FormData();
    formData.set('format', selection.format);
    formData.set('mode', selection.mode);
    formData.set('bestOf', bestOf);
    if (isPrivate) formData.set('isPrivate', 'true');
    if (isTournament) formData.set('isTournament', 'true');
    if (enableScryfallCheck) formData.set('enableScryfallCheck', 'true');
    if (enablePhysicalVerification) formData.set('enablePhysicalVerification', 'true');

    setError(null);
    setErrorCode(null);
    startTransition(async () => {
      const result = await createTournamentAction(formData);
      if (result.error) {
        setError(result.error);
        setErrorCode(result.errorCode ?? null);
        return;
      }
      if (!result.createdId) {
        setError('Risposta inattesa dal server');
        return;
      }
      onCreated({ createdId: result.createdId, webcamSessionId: result.webcamSessionId });
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-tournament-title"
        className="brx-glass relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-white/15 shadow-[0_-12px_48px_rgba(0,0,0,0.5)] sm:rounded-3xl sm:shadow-[0_24px_64px_rgba(0,0,0,0.5)]"
      >
        {/* Header con accento arancione coerente col sito */}
        <header className="relative shrink-0 border-b border-white/10 p-6 pb-5">
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/25 blur-3xl"
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-orange-500 shadow-[0_8px_24px_rgba(255,115,0,0.35)]">
                <Trophy className="h-5 w-5 text-white" strokeWidth={2.2} />
              </div>
              <div>
                <h2
                  id="create-tournament-title"
                  className="font-display text-lg font-black uppercase tracking-wide text-white"
                >
                  Crea torneo
                </h2>
                <p className="mt-0.5 text-xs font-medium text-white/55">
                  {formatName} · {modeName}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Chiudi"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/15"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Corpo scrollabile — nessun overflow oltre il viewport */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              Buy-in
            </span>
            <span className="text-sm font-bold text-white">{getBuyInLabel('for_fun')}</span>
          </div>

          <fieldset>
            <legend className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              Best of
            </legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {BEST_OF_OPTIONS.map((bo) => (
                <button
                  key={bo}
                  type="button"
                  onClick={() => setBestOf(bo)}
                  aria-pressed={bestOf === bo}
                  className={cn(
                    'rounded-2xl border px-3 py-2.5 text-sm font-bold transition',
                    bestOf === bo
                      ? 'border-primary/50 bg-primary/15 text-primary shadow-[0_4px_14px_rgba(255,115,0,0.2)]'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10',
                  )}
                >
                  {BEST_OF_LABEL[bo]}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="sr-only"
            />
            <span
              className={cn(
                'grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition',
                isPrivate
                  ? 'border-amber-500/50 bg-amber-500/15 text-amber-400'
                  : 'border-white/15 bg-white/5 text-white/40',
              )}
            >
              <Lock className="h-4 w-4" />
            </span>
            <span className="flex-1 text-sm text-white/85">
              <span className="font-semibold text-white">Partita privata</span>
              <span className="mt-0.5 block text-xs text-white/50">Solo su invito o approvazione</span>
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]">
            <input
              type="checkbox"
              checked={isTournament}
              onChange={(e) => {
                setIsTournament(e.target.checked);
                if (e.target.checked) {
                  setEnableScryfallCheck(true);
                  setEnablePhysicalVerification(true);
                }
              }}
              className="sr-only"
            />
            <span
              className={cn(
                'grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition',
                isTournament
                  ? 'border-primary/50 bg-primary/15 text-primary'
                  : 'border-white/15 bg-white/5 text-white/40',
              )}
            >
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="flex-1 text-sm text-white/85">
              <span className="font-semibold text-white">Torneo ufficiale</span>
              <span className="mt-0.5 block text-xs text-white/50">
                Verifica Scryfall e scan fisico obbligatori al join
              </span>
            </span>
          </label>

          {!isTournament && (
            <div className="space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.02] p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">
                Verifica mazzo (opzionale)
              </p>
              <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-white/75">
                <input
                  type="checkbox"
                  checked={enableScryfallCheck}
                  onChange={(e) => setEnableScryfallCheck(e.target.checked)}
                  className="h-4 w-4 accent-[#FF7300]"
                />
                Controllo legalità Scryfall
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-white/75">
                <input
                  type="checkbox"
                  checked={enablePhysicalVerification}
                  onChange={(e) => setEnablePhysicalVerification(e.target.checked)}
                  className="h-4 w-4 accent-[#FF7300]"
                />
                Verifica fisica Asso Vision
              </label>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
            >
              <p>{error}</p>
              {errorCode === 'MEMBERSHIP_REQUIRED' && (
                <Link
                  href="/associazione"
                  className="mt-2 inline-block font-semibold text-primary underline-offset-2 hover:underline"
                >
                  Completa l’iscrizione →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Footer azione — sempre visibile, fuori dallo scroll */}
        <div className="shrink-0 border-t border-white/10 bg-black/20 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-orange-500 px-4 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_8px_24px_rgba(255,115,0,0.3)] transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {isPending ? 'Creazione…' : 'Crea torneo'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
