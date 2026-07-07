export default function TournamentLiveLoading() {
  return (
    <div className="min-h-screen" aria-busy="true" aria-label="Caricamento partita live">
      <div className="header-gradient h-20 w-full" />
      <div className="mx-auto mt-4 flex w-full max-w-content flex-col gap-6 px-4 sm:px-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-900/10" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="grid grid-cols-2 gap-3">
            <div className="aspect-video animate-pulse rounded-2xl bg-slate-900/10 sm:min-h-[280px]" />
            <div className="aspect-video animate-pulse rounded-2xl bg-slate-900/10 sm:min-h-[260px]" />
          </div>
          <div className="h-80 animate-pulse rounded-2xl bg-slate-900/10" />
        </div>
      </div>
    </div>
  );
}
