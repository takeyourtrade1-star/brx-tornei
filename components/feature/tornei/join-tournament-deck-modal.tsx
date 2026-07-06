'use client';

import { useEffect, useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { joinTournamentAction } from '@/actions/tournaments';
import { listDecksAction } from '@/actions/decks';
import type { Deck } from '@/types/deck';
import type { Tournament } from '@/types/tournament';
import {
  getDeckVerificationPolicy,
  normalizeVerificationFlags,
  resolveMatchContextFromInput,
} from '@/types/match-verification';

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

  if (!open || !tournament) return null;

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

  return (
    <div className="fixed inset-0 z-[116] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-[#0a0f1a] p-6">
        <header className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-black uppercase text-white">
              Scegli mazzo
            </h2>
            <p className="mt-1 text-xs text-white/55">
              Formato: {tournament.format}
              {tournament.isTournament ? ' · Torneo (verifica obbligatoria)' : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Chiudi">
            <X className="h-5 w-5 text-white/60" />
          </button>
        </header>

        {(scryfallRequired || scanRequired) && (
          <ul className="mb-4 space-y-1 text-xs text-amber-200/90">
            {scryfallRequired && <li>• Controllo legalità Scryfall richiesto</li>}
            {scanRequired && <li>• Verifica fisica Camera Match richiesta (ultime 24h)</li>}
          </ul>
        )}

        {decks.length === 0 ? (
          <p className="text-sm text-white/60">
            Nessun mazzo per questo formato. Creane uno in{' '}
            <a href="/mazzi" className="text-[#FF7300] underline">
              Crea mazzo
            </a>
            .
          </p>
        ) : (
          <fieldset className="flex flex-col gap-2">
            {decks.map((deck) => (
              <label
                key={deck.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${
                  selectedDeckId === deck.id
                    ? 'border-[#FF7300]/50 bg-[#FF7300]/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <input
                  type="radio"
                  name="deck"
                  value={deck.id}
                  checked={selectedDeckId === deck.id}
                  onChange={() => setSelectedDeckId(deck.id)}
                  className="sr-only"
                />
                <span className="text-sm font-semibold text-white">{deck.name}</span>
                <span className="ml-auto text-[10px] uppercase text-white/50">
                  {deck.verificationStatus}
                </span>
              </label>
            ))}
          </fieldset>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={isPending || !selectedDeckId}
          onClick={handleJoin}
          className="mt-4 w-full rounded-full bg-gradient-to-r from-[#FF7300] to-[#e0564d] py-3 text-sm font-black uppercase text-white disabled:opacity-50"
        >
          {isPending ? 'Join…' : 'Partecipa'}
        </button>
      </div>
    </div>
  );
}
