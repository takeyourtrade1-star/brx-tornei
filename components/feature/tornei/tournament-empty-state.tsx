interface TournamentEmptyStateProps {
  contextLabel: string;
  filtersActive?: boolean;
}

export function TournamentEmptyState({ contextLabel, filtersActive = false }: TournamentEmptyStateProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-header-bg/90 px-6 py-14 text-center text-white shadow-xl shadow-black/40">
      <p className="font-sans text-lg font-bold uppercase tracking-wide text-white/75 sm:text-xl">
        Nessun torneo per {contextLabel}
      </p>
      <p className="mt-2 text-sm text-white/45">
        {filtersActive
          ? 'Prova ad allargare i filtri o creane uno con “Crea Torneo”.'
          : 'Creane uno con “Crea Torneo”.'}
      </p>
    </div>
  );
}
