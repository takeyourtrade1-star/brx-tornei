'use client';

import { useEffect, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Layers, X } from 'lucide-react';
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
import { JoinTournamentDeckContent } from './join-tournament-deck-content';
import modalFont from './tournament-modal-font.module.css';

interface JoinTournamentDeckModalProps {
  open: boolean;
  tournament: Tournament | null;
  onClose: () => void;
  onJoined: (result: { matchId?: string }) => void;
}

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
        className={`${modalFont.uiSans} relative flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-t-[1.75rem] border border-white/10 bg-gradient-to-br from-stone-900 via-stone-950 to-zinc-950 text-white shadow-2xl shadow-black/60 sm:max-h-[90vh] sm:rounded-[1.75rem]`}
        style={{ animation: 'jt-in 0.28s cubic-bezier(0.16,1,0.3,1)' }}
      >
        <style>{`
          @keyframes jt-fade { from { opacity: 0 } to { opacity: 1 } }
          @keyframes jt-in {
            from { opacity: 0; transform: translateY(24px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        <div className="h-1 w-full shrink-0 bg-gradient-to-r from-primary to-orange-500" aria-hidden />

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
                  className="font-sans text-2xl font-black leading-tight tracking-tight text-white"
                >
                  Scegli il mazzo
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

        <JoinTournamentDeckContent
          decks={decks}
          formatName={formatName}
          selectedDeckId={selectedDeckId}
          scryfallRequired={scryfallRequired}
          scanRequired={scanRequired}
          error={error}
          onSelect={setSelectedDeckId}
        />

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
