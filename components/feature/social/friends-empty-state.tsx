import { UserPlus } from 'lucide-react';

interface FriendsEmptyStateProps {
  onSearch: () => void;
}

export function FriendsEmptyState({ onSearch }: FriendsEmptyStateProps) {
  return (
    <div className="py-16 text-center">
      <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm">
        <UserPlus className="h-7 w-7" />
      </span>
      <p className="text-base font-bold text-slate-800">Nessun amico ancora</p>
      <p className="mx-auto mt-1 max-w-xs text-xs font-medium leading-relaxed text-slate-500">
        Cerca i tuoi compagni di gioco o aggiungili direttamente dai tavoli e dalle partite.
      </p>
      <button
        type="button"
        onClick={onSearch}
        className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
      >
        Cerca giocatori
      </button>
    </div>
  );
}
