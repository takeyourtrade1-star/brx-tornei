import type { Deck } from '@/types/deck';

export function ChallengeDeckSelect({
  id,
  decks,
  selectedDeckId,
  loading,
  onSelect,
}: {
  id: string;
  decks: Deck[];
  selectedDeckId: string;
  loading: boolean;
  onSelect: (deckId: string) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-white/45"
      >
        Mazzo dichiarato
      </label>
      <select
        id={id}
        value={selectedDeckId}
        disabled={loading}
        onChange={(event) => onSelect(event.target.value)}
        className="h-10 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-xs font-bold text-white focus:border-primary focus:outline-none disabled:opacity-50"
      >
        <option value="">
          {loading ? 'Caricamento mazzi…' : 'Seleziona un mazzo'}
        </option>
        {decks.map((deck) => (
          <option key={deck.id} value={deck.id}>{deck.name}</option>
        ))}
      </select>
      {!loading && decks.length === 0 && (
        <p className="mt-1.5 text-[11px] font-semibold text-amber-200">
          Crea prima un mazzo completo per questo formato.
        </p>
      )}
    </div>
  );
}
