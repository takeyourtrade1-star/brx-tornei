'use client';

import { useEffect, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Check, Lock, ScanLine, ShieldCheck, Swords, Trophy, X } from 'lucide-react';
import { createTournamentAction } from '@/actions/tournaments';
import type { FormatId } from '@/lib/data/catalog';
import type { Selection } from '@/lib/validations/selection';
import type { BestOf } from '@/types/tournament';
import { BEST_OF_LABEL } from './tournament-mock-details';
import { getBuyInLabel } from '@/lib/data/buy-in';
import { cn } from '@/lib/utils';

const BEST_OF_OPTIONS: BestOf[] = ['BO1', 'BO3', 'BO5'];

/** Accento colore per formato (coerente col resto del sito). */
const FORMAT_ACCENT: Record<string, string> = {
  'old-school': '#a86b32',
  premodern: '#7a5a2e',
  pioneer: '#3b82f6',
  modern: '#06b6d4',
  standard: '#9aa3ad',
  legacy: '#a855f7',
  pauper: '#78d64b',
  commander: '#22c55e',
};

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

// ---------------------------------------------------------------------------
// UI atoms
// ---------------------------------------------------------------------------

function Switch({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
        checked ? 'bg-primary' : 'bg-white/15',
      )}
      aria-hidden
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200',
          checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5',
        )}
      />
    </span>
  );
}

function TypeCard({
  active,
  icon,
  title,
  desc,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'group relative flex flex-col gap-2 overflow-hidden rounded-2xl border p-3.5 text-left transition-all',
        active
          ? 'border-primary/60 bg-primary/[0.12] shadow-[inset_0_0_0_1px_rgba(255,115,0,0.35),0_8px_24px_-8px_rgba(255,115,0,0.4)]'
          : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]',
      )}
    >
      <span
        className={cn(
          'grid h-9 w-9 place-items-center rounded-xl transition-colors',
          active ? 'bg-primary text-white' : 'bg-white/8 text-white/60',
        )}
      >
        {icon}
      </span>
      <span>
        <span className="block text-sm font-bold text-white">{title}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-white/50">{desc}</span>
      </span>
      {active && (
        <span className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-white">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

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

  const accent = FORMAT_ACCENT[selection.format as FormatId] ?? '#FF7300';

  function selectFriendly() {
    setIsTournament(false);
  }
  function selectOfficial() {
    setIsTournament(true);
    setEnableScryfallCheck(true);
    setEnablePhysicalVerification(true);
  }

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
    <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        style={{ animation: 'ct-fade 0.2s ease-out' }}
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-tournament-title"
        className="relative flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-t-[1.75rem] border border-white/10 bg-[#0F172A] shadow-[0_-16px_50px_rgba(0,0,0,0.6)] sm:max-h-[90vh] sm:rounded-[1.75rem] sm:shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
        style={{ animation: 'ct-in 0.28s cubic-bezier(0.16,1,0.3,1)' }}
      >
        <style>{`
          @keyframes ct-fade { from { opacity: 0 } to { opacity: 1 } }
          @keyframes ct-in {
            from { opacity: 0; transform: translateY(24px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* Barra accento in cima */}
        <div
          className="h-1 w-full shrink-0"
          style={{ background: `linear-gradient(90deg, ${accent}, #FF7300)` }}
          aria-hidden
        />

        {/* Header */}
        <header className="relative shrink-0 overflow-hidden px-5 pb-4 pt-5">
          <div
            className="pointer-events-none absolute -right-10 -top-14 h-36 w-36 rounded-full blur-3xl"
            style={{ backgroundColor: `${accent}33` }}
            aria-hidden
          />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-orange-500 shadow-[0_10px_28px_-6px_rgba(255,115,0,0.6)]">
                <Trophy className="h-6 w-6 text-white" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <h2
                  id="create-tournament-title"
                  className="font-display text-xl font-black uppercase tracking-wide text-white"
                >
                  Crea torneo
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/80"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: accent }}
                      aria-hidden
                    />
                    {formatName}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/55">
                    {modeName}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Chiudi"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/15 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Corpo scrollabile */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-5 pt-1">
          {/* Tipo partita */}
          <section>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
              Tipo partita
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <TypeCard
                active={!isTournament}
                icon={<Swords className="h-4 w-4" />}
                title="Amichevole"
                desc="Verifiche facoltative"
                onClick={selectFriendly}
              />
              <TypeCard
                active={isTournament}
                icon={<Trophy className="h-4 w-4" />}
                title="Ufficiale"
                desc="Verifiche obbligatorie"
                onClick={selectOfficial}
              />
            </div>
          </section>

          {/* Best of */}
          <section>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
              Formato match
            </p>
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
              {BEST_OF_OPTIONS.map((bo) => (
                <button
                  key={bo}
                  type="button"
                  onClick={() => setBestOf(bo)}
                  aria-pressed={bestOf === bo}
                  className={cn(
                    'rounded-xl px-3 py-2.5 text-sm font-bold transition-all',
                    bestOf === bo
                      ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-[0_4px_14px_-2px_rgba(255,115,0,0.5)]'
                      : 'text-white/60 hover:bg-white/5 hover:text-white',
                  )}
                >
                  {BEST_OF_LABEL[bo]}
                </button>
              ))}
            </div>
          </section>

          {/* Verifiche */}
          <section>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
              Verifica mazzo
            </p>
            {isTournament ? (
              <div className="space-y-2 rounded-2xl border border-primary/25 bg-primary/[0.06] p-3.5">
                <p className="text-xs font-semibold text-primary">
                  Incluse nel torneo ufficiale
                </p>
                <div className="flex items-center gap-2.5 text-sm text-white/85">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                  Controllo legalità Scryfall
                </div>
                <div className="flex items-center gap-2.5 text-sm text-white/85">
                  <ScanLine className="h-4 w-4 shrink-0 text-primary" />
                  Verifica fisica Asso Vision
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <button
                  type="button"
                  onClick={() => setEnableScryfallCheck((v) => !v)}
                  className="flex w-full items-center gap-3 border-b border-white/[0.06] p-3 text-left transition hover:bg-white/[0.03]"
                >
                  <ShieldCheck className="h-4 w-4 shrink-0 text-white/60" />
                  <span className="flex-1 text-sm font-medium text-white/85">
                    Controllo legalità Scryfall
                  </span>
                  <Switch checked={enableScryfallCheck} />
                </button>
                <button
                  type="button"
                  onClick={() => setEnablePhysicalVerification((v) => !v)}
                  className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-white/[0.03]"
                >
                  <ScanLine className="h-4 w-4 shrink-0 text-white/60" />
                  <span className="flex-1 text-sm font-medium text-white/85">
                    Verifica fisica Asso Vision
                  </span>
                  <Switch checked={enablePhysicalVerification} />
                </button>
              </div>
            )}
          </section>

          {/* Visibilità + buy-in */}
          <section className="space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
              Impostazioni
            </p>
            <button
              type="button"
              onClick={() => setIsPrivate((v) => !v)}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:bg-white/[0.06]"
            >
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
              <span className="flex-1">
                <span className="block text-sm font-semibold text-white">Partita privata</span>
                <span className="mt-0.5 block text-xs text-white/50">Solo su invito o approvazione</span>
              </span>
              <Switch checked={isPrivate} />
            </button>

            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <span className="text-sm font-medium text-white/70">Buy-in</span>
              <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs font-bold text-white">
                {getBuyInLabel('for_fun')}
              </span>
            </div>
          </section>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200"
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

        {/* Footer azione */}
        <div className="shrink-0 border-t border-white/[0.08] bg-black/25 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white/80 transition hover:bg-white/10 disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-orange-500 px-4 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_10px_28px_-6px_rgba(255,115,0,0.55)] transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
            >
              {isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Trophy className="h-4 w-4" />
              )}
              {isPending ? 'Creazione…' : 'Crea torneo'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
