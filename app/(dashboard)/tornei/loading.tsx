import { TournamentGameLoadingScreen } from '@/components/feature/tornei/tournament-game-loading-screen';

export default function TorneiLoading() {
  return (
    <>
      {/* Mobile: skeleton standard */}
      <div
        className="block min-h-screen bg-[#0f172a] md:hidden"
        aria-busy="true"
        aria-label="Caricamento tornei"
      >
        <div className="header-gradient h-20 w-full" />
        <div className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 sm:px-6">
          <div className="flex items-end justify-between">
            <div className="h-10 w-64 animate-pulse rounded-lg bg-white/10" />
            <div className="h-11 w-44 animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="brx-glass h-72 animate-pulse rounded-3xl border border-white/15" />
        </div>
      </div>

      <TournamentGameLoadingScreen />
    </>
  );
}
