'use client';

import { useEffect, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Check, Layers, ScanLine, ShieldCheck, X } from 'lucide-react';
import { joinTournamentAction } from '@/actions/tournaments';
import { listDecksAction } from '@/actions/decks';
import { getFormat } from '@/lib/data/catalog';
import type { Deck } from '@/types/deck';
import type { Tournament } from '@/types/tournament';
import {
  getDeckVerificationPolicy,
  normalizeVerificationFlags,
  resolveMatchContextFromInput,
} from '@/types/match-verification';
import { cn } from '@/lib/utils';

interface JoinTournamentDeckModalProps {
  open: boolean;
  tournament: Tournament | null;
  onClose: () => void;
  onJoined: (result: { matchId?: string }) => void;
}

const VERIFICATION_LABEL: Record<Deck['verificationStatus'], string> = {
  verified: 'Verificato',
  mismatch: 'Discrepanza',
  scanned: 'Scansionato',
  declared: 'Dichiarato',
  none: 'Non verificato',
};

const VERIFICATION_CLASS: Record<Deck['verificationStatus'], string> = {
  verified: 'bg-emerald-500/20 text-emerald-300',
  mismatch: 'bg-red-500/20 text-red-300',
  scanned: 'bg-amber-500/20 text-amber-300',
  declared: 'bg-amber-500/20 text-amber-300',
  none: 'bg-white/10 text-white/50',
};

export function JoinTournamentDeckModal({
  open,
  tournament,
  onClose,
  onJoined,
}: JoinTournamentDeckModalProps) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      const res = await listDecksAction();
      if ('decks' in res) {
        const compatible = tournament
          ? res.decks.filter((d) => d.formatId === tournament.format)
          : res.decks;
        setDecks(compatible);
        setSelectedDeckId(compatible[0]?.id ?? '');
      }
    });
  }, [open, tournament]);

  // Portal + scroll-lock + Esc: fuori dai container con transform (vista tornei).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !tournament || !mounted) return null;

  const formatName = getFormat(tournament.format)?.name ?? tournament.format;

  const flags = normalizeVerificationFlags({
    isTournament: tournament.isTournament,
    isPrivate: tournament.isPrivate,
    enableScryfallCheck: tournament.enableScryfallCheck,
    enablePhysicalVerification: tournament.enablePhysicalVerification,
  });
  const context = resolveMatchContextFromInput({
    isTournament: flags.isTournament,
    isPrivate: flags.isPrivate,
  });
  const policy = getDeckVerificationPolicy(context);
  const scryfallRequired =
    policy.scryfallLegality === 'required' || flags.enableScryfallCheck;
  const scanRequired =
    policy.physicalScan === 'required' || flags.enablePhysicalVerification;

  const handleJoin = () => {
    setError(null);
    startTransition(async () => {
      const result = await joinTournamentAction(tournament.id, selectedDeckId);
      if (result.error) {
        setError(result.error);
        return;
      }
      onJoined({ matchId: result.matchId });
      onClose();
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        style={{ animation: 'jt-fade 0.2s ease-out' }}
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-deck-title"
        className="relative flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-t-[1.75rem] border border-white/10 bg-[#0F172A] shadow-[0_-16px_50px_rgba(0,0,0,0.6)] sm:max-h-[90vh] sm:rounded-[1.75rem] sm:shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
        style={{ animation: 'jt-in 0.28s cubic-bezier(0.16,1,0.3,1)' }}
      >
        <style>{`
          @keyframes jt-fade { from { opacity: 0 } to { opacity: 1 } }
          @keyframes jt-in {
            from { opacity: 0; transform: translateY(24px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        <div className="h-1 w-full shrink-0 bg-gradient-to-r from-[#FF7300] to-orange-500" aria-hidden />

        {/* Header */}
        <header className="relative shrink-0 overflow-hidden px-5 pb-4 pt-5">
          <div
            className="pointer-events-none absolute -right-10 -top-14 h-36 w-36 rounded-full bg-primary/25 blur-3xl"
            aria-hidden
          />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-orange-500 shadow-[0_10px_28px_-6px_rgba(255,115,0,0.6)]">
                <Layers className="h-6 w-6 text-white" strokeWidth={2.2} />
              </div>
              <div>
                <h2
                  id="join-deck-title"
                  className="font-display text-xl font-black uppercase tracking-wide text-white"
                >
                  Scegli mazzo
                </h2>
                <p className="mt-0.5 text-xs font-medium text-white/55">
                  {formatName}
                  {tournament.isTournament ? ' · Torneo ufficiale' : ''}
                </p>
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
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-5 pt-1">
          {(scryfallRequired || scanRequired) && (
            <div className="space-y-2 rounded-2xl border border-amber-500/25 bg-amber-500/[0.08] p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-amber-300/90">
                Requisiti di questo torneo
              </p>
              {scryfallRequired && (
                <div className="flex items-center gap-2.5 text-sm text-amber-100/90">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-amber-300" />
                  Controllo legalità Asso Vision
                </div>
              )}
              {scanRequired && (
                <div className="flex items-center gap-2.5 text-sm text-amber-100/90">
                  <ScanLine className="h-4 w-4 shrink-0 text-amber-300" />
                  Verifica fisica Asso Vision (ultime 24h)
                </div>
              )}
            </div>
          )}

          {decks.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <p className="text-sm text-white/70">Nessun mazzo per questo formato.</p>
              <a
                href="/mazzi"
                className="mt-3 inline-block rounded-full bg-gradient-to-r from-primary to-orange-500 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white"
              >
                Crea un mazzo
              </a>
            </div>
          ) : (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
                I tuoi mazzi {formatName}
              </legend>
              {decks.map((deck) => {
                const selected = selectedDeckId === deck.id;
                return (
                  <label
                    key={deck.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition',
                      selected
                        ? 'border-primary/60 bg-primary/[0.12] shadow-[inset_0_0_0_1px_rgba(255,115,0,0.3)]'
                        : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]',
                    )}
                  >
                    <input
                      type="radio"
                      name="deck"
                      value={deck.id}
                      checked={selected}
                      onChange={() => setSelectedDeckId(deck.id)}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        'grid h-5 w-5 shrink-0 place-items-center rounded-full border transition',
                        selected ? 'border-primary bg-primary text-white' : 'border-white/25',
                      )}
                    >
                      {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                      {deck.name}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                        VERIFICATION_CLASS[deck.verificationStatus],
                      )}
                    >
                      {VERIFICATION_LABEL[deck.verificationStatus]}
                    </span>
                  </label>
                );
              })}
            </fieldset>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200"
            >
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
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
              disabled={isPending || !selectedDeckId}
              onClick={handleJoin}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-orange-500 px-4 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_10px_28px_-6px_rgba(255,115,0,0.55)] transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
            >
              {isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : null}
              {isPending ? 'Partecipo…' : 'Partecipa'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
