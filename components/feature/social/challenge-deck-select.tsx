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
      <div className="mb-1.5 flex items-center justify-between">
        <label
          htmlFor={id}
          className="block text-[10px] font-black uppercase tracking-wider text-white/45"
        >
          Mazzo dichiarato
        </label>
        <span className="text-[10px] font-semibold text-white/40">Facoltativo</span>
      </div>
      <select
        id={id}
        value={selectedDeckId}
        disabled={loading}
        onChange={(event) => onSelect(event.target.value)}
        className="h-10 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-xs font-bold text-white focus:border-primary focus:outline-none disabled:opacity-50"
      >
        <option value="">
          {loading ? 'Caricamento mazzi…' : 'Gioca senza associare un mazzo'}
        </option>
        {decks.map((deck) => (
          <option key={deck.id} value={deck.id}>{deck.name}</option>
        ))}
      </select>
      {!loading && decks.length === 0 && (
        <p className="mt-1.5 text-[11px] font-medium text-white/50">
          Nessun mazzo salvato per questo formato: puoi giocare liberamente senza mazzo.
        </p>
      )}
    </div>
  );
}
