'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Lock, Plus, X } from 'lucide-react';
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

  if (!open) return null;

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

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-tournament-title"
        className="brx-glass relative w-full max-w-md rounded-3xl border border-white/15 p-6"
      >
        <header className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2
              id="create-tournament-title"
              className="font-display text-lg font-black uppercase tracking-wide text-white"
            >
              Crea torneo
            </h2>
            <p className="mt-1 text-xs text-white/55">
              {formatName} · {modeName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/15"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex flex-col gap-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              Buy-in
            </span>
            <p className="mt-1 text-sm font-semibold text-white">{getBuyInLabel('for_fun')}</p>
          </div>

          <fieldset>
            <legend className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              Best of
            </legend>
            <div className="mt-2 flex gap-2">
              {BEST_OF_OPTIONS.map((bo) => (
                <button
                  key={bo}
                  type="button"
                  onClick={() => setBestOf(bo)}
                  className={cn(
                    'flex-1 rounded-2xl border px-3 py-2.5 text-sm font-bold transition',
                    bestOf === bo
                      ? 'border-primary/50 bg-primary/15 text-primary'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10',
                  )}
                >
                  {BEST_OF_LABEL[bo]}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
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
            <span className="text-sm text-white/85">
              <span className="font-semibold text-white">Partita privata</span>
              <span className="mt-0.5 block text-xs text-white/50">
                Solo su invito o approvazione
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
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
            <span className="text-sm text-white/85">
              <span className="font-semibold text-white">Torneo ufficiale</span>
              <span className="mt-0.5 block text-xs text-white/50">
                Verifica Scryfall e scan fisico obbligatori al join
              </span>
            </span>
          </label>

          {!isTournament && (
            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">
                Verifica mazzo (opzionale)
              </p>
              <label className="flex items-center gap-2 text-xs text-white/75">
                <input
                  type="checkbox"
                  checked={enableScryfallCheck}
                  onChange={(e) => setEnableScryfallCheck(e.target.checked)}
                />
                Controllo legalità Scryfall
              </label>
              <label className="flex items-center gap-2 text-xs text-white/75">
                <input
                  type="checkbox"
                  checked={enablePhysicalVerification}
                  onChange={(e) => setEnablePhysicalVerification(e.target.checked)}
                />
                Verifica fisica Camera Match
              </label>
            </div>
          )}

          {error && (
            <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
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

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-orange-500 px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {isPending ? 'Creazione…' : 'Crea torneo'}
          </button>
        </div>
      </div>
    </div>
  );
}
