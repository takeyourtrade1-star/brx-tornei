'use client';

import { useEffect, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { X } from 'lucide-react';
import { createTournamentAction } from '@/actions/tournaments';
import { getFormat, type FormatId } from '@/lib/data/catalog';
import { FormatPillSelect } from '@/components/feature/tornei/format-pill-select';
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

// ---------------------------------------------------------------------------
// UI atoms
// ---------------------------------------------------------------------------

function Switch({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200',
        checked ? 'bg-primary' : 'bg-white/15',
      )}
      aria-hidden
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-[1.125rem]' : 'translate-x-0.5',
        )}
      />
    </span>
  );
}

function SectionLabel({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
      {children}
    </p>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      className="grid gap-1 rounded-xl bg-white/[0.05] p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          aria-pressed={value === opt.id}
          className={cn(
            'rounded-lg px-3 py-2 text-sm font-bold transition-colors',
            value === opt.id
              ? 'bg-primary text-white'
              : 'text-white/55 hover:bg-white/5 hover:text-white',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
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
  // Formato pre-selezionato nella home, ma modificabile qui: non tutti capiscono
  // che riprende la scelta della schermata precedente.
  const [format, setFormat] = useState<FormatId>(selection.format as FormatId);
  const [bestOf, setBestOf] = useState<BestOf>('BO3');
  const [isPrivate, setIsPrivate] = useState(false);
  // "Giochi con un amico?": consenti P2P diretto (IP visibili tra i due peer).
  // Spento = video sempre via relay TURN, IP dell'avversario mai esposto.
  const [withFriend, setWithFriend] = useState(false);
  const [isTournament, setIsTournament] = useState(false);
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

  const currentFormatName = getFormat(format)?.name ?? formatName;

  function handleSubmit() {
    // Competitiva → verifica sempre obbligatoria (banlist + carte fisiche).
    // Casual → nessuna verifica fisica.
    const wantVerify = isTournament;

    const formData = new FormData();
    formData.set('format', format);
    formData.set('mode', selection.mode);
    formData.set('bestOf', bestOf);
    if (isPrivate) formData.set('isPrivate', 'true');
    if (withFriend) formData.set('withFriend', 'true');
    if (isTournament) formData.set('isTournament', 'true');
    if (wantVerify) {
      formData.set('enableScryfallCheck', 'true');
      formData.set('enablePhysicalVerification', 'true');
    }

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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        style={{ animation: 'ct-fade 0.2s ease-out' }}
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-tournament-title"
        className="relative flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-white/[0.08] bg-[#0F172A] text-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl"
        style={{ animation: 'ct-in 0.28s cubic-bezier(0.16,1,0.3,1)' }}
      >
        <style>{`
          @keyframes ct-fade { from { opacity: 0 } to { opacity: 1 } }
          @keyframes ct-in {
            from { opacity: 0; transform: translateY(24px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* Header */}
        <header className="flex shrink-0 items-start justify-between gap-3 px-5 pb-1 pt-5">
          <div className="min-w-0">
            <h2
              id="create-tournament-title"
              className="font-display text-lg font-black uppercase tracking-wide text-white"
            >
              Crea torneo
            </h2>
            <p className="mt-0.5 text-xs text-white/45">
              {modeName} · {currentFormatName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Corpo scrollabile */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-5 pt-4">
          {/* Formato — pre-compilato dalla home, ma modificabile qui */}
          <section>
            <SectionLabel id="create-tournament-format-label">Formato</SectionLabel>
            <FormatPillSelect
              value={format}
              onChange={setFormat}
              ariaLabelledBy="create-tournament-format-label"
            />
          </section>

          {/* Tipo partita */}
          <section>
            <SectionLabel>Tipo partita</SectionLabel>
            <Segmented
              options={[
                { id: 'friendly', label: 'Casual' },
                { id: 'official', label: 'Competitiva' },
              ]}
              value={isTournament ? 'official' : 'friendly'}
              onChange={(id) => setIsTournament(id === 'official')}
            />
            <p className="mt-1.5 text-[11px] text-white/40">
              {isTournament
                ? 'Controllo banlist obbligatorio per tutti i mazzi. Carte proxy ammesse.'
                : 'Partita libera, senza controllo della banlist.'}
            </p>
          </section>

          {/* Best of */}
          <section>
            <SectionLabel>Formato match</SectionLabel>
            <Segmented
              options={BEST_OF_OPTIONS.map((bo) => ({ id: bo, label: BEST_OF_LABEL[bo] }))}
              value={bestOf}
              onChange={(id) => setBestOf(id as BestOf)}
            />
          </section>

          {/* Impostazioni */}
          <section>
            <SectionLabel>Impostazioni</SectionLabel>
            <div className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-white/[0.03]">
              <button
                type="button"
                onClick={() => setIsPrivate((v) => !v)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.04]"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-white">Partita privata</span>
                  <span className="mt-0.5 block text-[11px] text-white/40">
                    Solo su invito o approvazione
                  </span>
                </span>
                <Switch checked={isPrivate} />
              </button>

              <button
                type="button"
                onClick={() => setWithFriend((v) => !v)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.04]"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-white">
                    Giochi con un amico?
                  </span>
                  <span className="mt-0.5 block text-[11px] text-white/40">
                    Video diretto, più veloce. Spento = indirizzo di rete mai visibile.
                  </span>
                </span>
                <Switch checked={withFriend} />
              </button>

              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-semibold text-white">Buy-in</span>
                <span className="text-xs font-bold text-white/60">{getBuyInLabel('for_fun')}</span>
              </div>
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
        <div className="flex shrink-0 gap-2.5 border-t border-white/[0.06] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl px-5 py-3 text-sm font-bold uppercase tracking-wide text-white/60 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-primary/90 active:scale-[0.99] disabled:opacity-50"
          >
            {isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Creazione…
              </>
            ) : (
              'Crea torneo'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
