import { QrCode, UserPlus } from 'lucide-react';

interface FriendsEmptyStateProps {
  onSearch: () => void;
  onShowQr?: () => void;
}

export function FriendsEmptyState({ onSearch, onShowQr }: FriendsEmptyStateProps) {
  return (
    <div className="py-16 text-center">
      <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl border border-white/15 bg-white/5 text-primary shadow-[0_0_24px_rgba(255,115,0,0.2)]">
        <UserPlus className="h-7 w-7" />
      </span>
      <p className="font-display text-base font-bold text-white">Nessun amico ancora</p>
      <p className="mx-auto mt-1 max-w-xs text-xs font-medium leading-relaxed text-white/50">
        Cerca i tuoi compagni di gioco, fai scansionare il tuo QR oppure aggiungili dai tavoli.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={onSearch}
          className="rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:brightness-105"
        >
          Cerca giocatori
        </button>
        {onShowQr && (
          <button
            type="button"
            onClick={onShowQr}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:border-white/30 hover:bg-white/10"
          >
            <QrCode className="h-3.5 w-3.5" />
            Il mio QR
          </button>
        )}
      </div>
    </div>
  );
}
