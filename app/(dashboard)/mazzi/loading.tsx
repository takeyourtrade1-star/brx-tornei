/** Skeleton della pagina mazzi durante il fetch server-side. */
export default function MazziLoading() {
  return (
    <div aria-busy="true" aria-label="Caricamento mazzi">
      <div className="header-gradient h-20 w-full" />
      <div className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 sm:px-6">
        <div className="flex items-end justify-between">
          <div className="h-10 w-56 animate-pulse rounded-lg bg-white/10" />
          <div className="h-11 w-40 animate-pulse rounded-full bg-white/10" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="brx-glass h-64 animate-pulse rounded-3xl border border-white/15"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
