import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { PartiteHero } from '@/components/feature/tornei/partite/partite-hero';
import { PartiteStatsGrid } from '@/components/feature/tornei/partite/partite-stats-grid';
import { PartiteBattleLog } from '@/components/feature/tornei/partite/partite-battle-log';
import { PartiteMedals } from '@/components/feature/tornei/partite/partite-medals';
import { PartiteInGameRatings } from '@/components/feature/tornei/partite/partite-in-game-ratings';
import { getSession } from '@/lib/auth/session';
import { requireGamertag } from '@/lib/auth/require-gamertag';
import { fetchMyReputationPage } from '@/lib/data/player-api-client';
import { fetchMyMatchFeedback } from '@/lib/data/match-feedback';

export const metadata: Metadata = { title: 'Le mie partite' };

/** Brace dell'arena: particelle fluttuanti con ritmo bilanciato. */
const EMBERS = [
  { left: '8%', delay: '0s', duration: '9s', size: 'h-1 w-1', color: 'bg-primary/80' },
  { left: '20%', delay: '2.5s', duration: '11s', size: 'h-[3px] w-[3px]', color: 'bg-marquee/70' },
  { left: '38%', delay: '1.2s', duration: '8.5s', size: 'h-1.5 w-1.5', color: 'bg-primary/60' },
  { left: '55%', delay: '4.8s', duration: '10s', size: 'h-[3px] w-[3px]', color: 'bg-marquee/80' },
  { left: '72%', delay: '1.8s', duration: '11.5s', size: 'h-1 w-1', color: 'bg-primary/70' },
  { left: '88%', delay: '3.4s', duration: '9.5s', size: 'h-1.5 w-1.5', color: 'bg-marquee/60' },
];

/** Storico completo delle partite: arena del duellante con stats, cronache e medaglie. */
export default async function PartitePage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const gamertag = await requireGamertag('/partite');

  const reputation = await fetchMyReputationPage().catch(() => null);
  const matchFeedback = await fetchMyMatchFeedback().catch(() => null);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080d1a]">
      {/* Texture d'atmosfera con glow discreti */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(800px_350px_at_15%_0%,rgba(255,115,0,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_400px_at_85%_10%,rgba(243,199,106,0.07),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(1000px_500px_at_50%_100%,rgba(255,115,0,0.06),transparent_65%)]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(circle_at_50%_30%,black,transparent_75%)]" />
        {EMBERS.map((ember, index) => (
          <span
            key={index}
            className={`pt-ember ${ember.size} ${ember.color}`}
            style={{
              left: ember.left,
              animationDelay: ember.delay,
              animationDuration: ember.duration,
            }}
          />
        ))}
      </div>

      <div className="relative">
        <DashboardHeader user={session.user} displayName={gamertag} reputation={reputation} />

        <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          <header className="pt-title-in mb-6">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rotate-45 bg-primary shadow-[0_0_6px_rgba(255,115,0,0.9)]" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                Sala dei trofei · Registro del duellante
              </p>
            </div>
            <h1 className="mt-1.5 font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              Le mie{' '}
              <span className="bg-gradient-to-r from-primary via-marquee to-primary bg-clip-text text-transparent">
                partite
              </span>
            </h1>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              Vinte, perse, abbandonate e contestate: la tua cronaca di battaglia completa.
            </p>
          </header>

          <div className="flex flex-col gap-5 sm:gap-6">
            <PartiteHero gamertag={gamertag} reputation={reputation} />
            <PartiteStatsGrid reputation={reputation} />
            <PartiteBattleLog reputation={reputation} />
            <PartiteMedals reputation={reputation} />
            <PartiteInGameRatings feedback={matchFeedback} />
          </div>
        </main>
      </div>
    </div>
  );
}
