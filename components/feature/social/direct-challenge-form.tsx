'use client';

import { Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FORMATS } from '@/lib/data/catalog';
import type { Deck } from '@/types/deck';
import { ChallengeDeckSelect } from './challenge-deck-select';

export function DirectChallengeForm({
  format,
  bestOf,
  decks,
  deckId,
  loadingDecks,
  sending,
  onFormat,
  onBestOf,
  onDeck,
  onSend,
}: {
  format: string;
  bestOf: 'BO1' | 'BO3' | 'BO5';
  decks: Deck[];
  deckId: string;
  loadingDecks: boolean;
  sending: boolean;
  onFormat: (format: string) => void;
  onBestOf: (bestOf: 'BO1' | 'BO3' | 'BO5') => void;
  onDeck: (deckId: string) => void;
  onSend: () => void;
}) {
  return (
    <div className="mt-4 space-y-4">
      <div>
        <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-white/45">
          Formato di Gioco
        </label>
        <select
          value={format}
          onChange={(event) => onFormat(event.target.value)}
          className="h-10 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-bold text-white focus:border-primary focus:outline-none"
        >
          {FORMATS.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-white/45">
          Formula del Match
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(['BO1', 'BO3', 'BO5'] as const).map((rule) => (
            <button
              key={rule}
              type="button"
              onClick={() => onBestOf(rule)}
              className={`h-9 rounded-xl border text-xs font-black transition ${
                bestOf === rule
                  ? 'border-primary bg-primary/10 text-primary shadow-sm'
                  : 'border-white/15 bg-white/5 text-white/65 hover:bg-white/10'
              }`}
            >
              {rule}
            </button>
          ))}
        </div>
      </div>

      <ChallengeDeckSelect
        id="direct-challenge-deck"
        decks={decks}
        selectedDeckId={deckId}
        loading={loadingDecks}
        onSelect={onDeck}
      />

      <Button
        type="button"
        disabled={sending || loadingDecks || !deckId}
        onClick={onSend}
        className="mt-2 h-11 w-full gap-2 rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] text-xs font-black uppercase tracking-wider text-white shadow-md hover:brightness-105"
      >
        <Swords className="h-4 w-4" />
        <span>{sending ? 'Invio in corso…' : 'Lancia il Guanto di Sfida'}</span>
      </Button>
    </div>
  );
}
