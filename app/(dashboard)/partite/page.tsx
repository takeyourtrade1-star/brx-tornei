import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { PartiteHero } from '@/components/feature/tornei/partite/partite-hero';
import { PartiteStatsGrid } from '@/components/feature/tornei/partite/partite-stats-grid';
import { PartiteBattleLog } from '@/components/feature/tornei/partite/partite-battle-log';
import { PartiteMedals } from '@/components/feature/tornei/partite/partite-medals';
import { getSession } from '@/lib/auth/session';
import { requireGamertag } from '@/lib/auth/require-gamertag';
import { fetchMyReputationPage } from '@/lib/data/player-api-client';

export const metadata: Metadata = { title: 'Le mie partite' };

/** Brace dell'arena: valori fissi (niente casualità nel render server). */
const EMBERS = [
  { left: '6%', delay: '0s', duration: '9s', size: 'h-1 w-1', color: 'bg-primary' },
  { left: '14%', delay: '3.2s', duration: '11s', size: 'h-[3px] w-[3px]', color: 'bg-marquee' },
  { left: '24%', delay: '1.4s', duration: '8s', size: 'h-1.5 w-1.5', color: 'bg-marquee' },
  { left: '33%', delay: '5.6s', duration: '10s', size: 'h-[3px] w-[3px]', color: 'bg-primary' },
  { left: '42%', delay: '2.4s', duration: '12s', size: 'h-1 w-1', color: 'bg-primary' },
  { left: '51%', delay: '6.8s', duration: '9.5s', size: 'h-[3px] w-[3px]', color: 'bg-marquee' },
  { left: '60%', delay: '0.8s', duration: '10.5s', size: 'h-1.5 w-1.5', color: 'bg-primary' },
  { left: '69%', delay: '4.4s', duration: '8.5s', size: 'h-1 w-1', color: 'bg-marquee' },
  { left: '78%', delay: '7.2s', duration: '11.5s', size: 'h-[3px] w-[3px]', color: 'bg-primary' },
  { left: '87%', delay: '2.8s', duration: '9s', size: 'h-1.5 w-1.5', color: 'bg-primary' },
  { left: '94%', delay: '5s', duration: '10s', size: 'h-1 w-1', color: 'bg-marquee' },
];

/** Storico completo delle partite: arena del duellante con stats, cronache e medaglie. */
export default async function PartitePage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const gamertag = await requireGamertag('/partite');

  const reputation = await fetchMyReputationPage().catch(() => null);

  return (
    <div className="relative min-h-screen overflow-hidden bg-header-bg">
      {/* Arena: bagliori radiali, griglia e brace che sale dal basso. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(900px_420px_at_18%_-4%,rgba(255,115,0,0.14),transparent_62%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(1000px_520px_at_92%_8%,rgba(243,199,106,0.09),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_50%_115%,rgba(255,115,0,0.1),transparent_65%)]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(circle_at_50%_30%,black,transparent_80%)]" />
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

        <main className="mx-auto w-full max-w-content px-4 py-8 sm:px-6">
          <header className="pt-title-in mb-7">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              Sala dei trofei · Registro del duellante
            </p>
            <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
              Le mie{' '}
              <span className="bg-gradient-to-r from-primary via-marquee to-primary bg-clip-text text-transparent">
                partite
              </span>
            </h1>
            <p className="mt-1 text-sm font-semibold text-white/55">
              Vinte, perse, abbandonate e contestate: la tua cronaca di battaglia completa.
            </p>
            <div className="mt-4 flex items-center gap-2.5">
              <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-primary/80 shadow-[0_0_8px_rgba(255,115,0,0.8)]" />
              <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-marquee/80 shadow-[0_0_8px_rgba(243,199,106,0.8)]" />
              <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
          </header>

          <div className="flex flex-col gap-6 sm:gap-7">
            <PartiteHero gamertag={gamertag} reputation={reputation} />
            <PartiteStatsGrid reputation={reputation} />
            <PartiteBattleLog reputation={reputation} />
            <PartiteMedals reputation={reputation} />
          </div>
        </main>
      </div>
    </div>
  );
}
