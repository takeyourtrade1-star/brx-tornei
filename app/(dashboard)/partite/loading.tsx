/** Skeleton della pagina partite durante il fetch server-side. */
export default function PartiteLoading() {
  return (
    <div aria-busy="true" aria-label="Caricamento partite">
      <div className="header-gradient h-20 w-full" />
      <div className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 sm:px-6">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-white/10" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 w-32 animate-pulse rounded-full bg-white/10" />
          ))}
        </div>
        <div className="brx-glass h-80 animate-pulse rounded-3xl border border-white/15" />
      </div>
    </div>
  );
}
