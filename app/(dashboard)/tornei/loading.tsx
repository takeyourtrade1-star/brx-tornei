/** Skeleton vista semplificata (default desktop e mobile). */
export default function TorneiLoading() {
  return (
    <div className="min-h-screen" aria-busy="true" aria-label="Caricamento tornei">
      <div className="header-gradient h-20 w-full" />
      <div className="mx-auto mt-4 flex w-full max-w-content flex-col gap-6 px-4 sm:px-6">
        <div className="flex items-end justify-between">
          <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-900/10" />
          <div className="h-11 w-44 animate-pulse rounded-full bg-slate-900/10" />
        </div>
        <div className="h-72 animate-pulse rounded-3xl border border-white/10 bg-stone-950/90 shadow-xl shadow-black/20" />
      </div>
    </div>
  );
}
