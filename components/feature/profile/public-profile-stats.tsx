import { Flame, HeartHandshake, Shield, Sparkles, Trophy, Zap } from 'lucide-react';
import type { PublicPlayerStats } from '@/types/social';

interface PublicProfileStatsProps {
  stats: PublicPlayerStats;
  honorBadges: {
    friendly: number;
    sportive: number;
    great_player: number;
    strategist: number;
    punctual: number;
  };
}

export function PublicProfileStats({ stats, honorBadges }: PublicProfileStatsProps) {
  const decided = stats.wins + stats.losses;
  const winRate = decided > 0 ? Math.round((stats.wins / decided) * 100) : 0;
  const totalBadges = Object.values(honorBadges).reduce((acc, count) => acc + (count || 0), 0);

  return (
    <div className="space-y-4">
      {/* Griglia Statistiche di Battaglia */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-white/45">Giocate</p>
          <p className="mt-0.5 text-lg font-black text-white">{stats.played}</p>
        </div>
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Vittorie</p>
          <p className="mt-0.5 text-lg font-black text-emerald-200">{stats.wins}</p>
        </div>
        <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">Win Rate</p>
          <p className="mt-0.5 text-lg font-black text-amber-200">{winRate}%</p>
        </div>
      </div>

      {/* Win Streak & Status Card */}
      {stats.winStreak >= 2 && (
        <div className="flex items-center gap-3 rounded-xl border border-orange-500/25 bg-gradient-to-r from-orange-500/10 to-amber-500/5 px-3.5 py-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-500 text-white shadow-sm">
            <Flame className="h-4 w-4 animate-pulse" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black text-white">
              Serie di {stats.winStreak} vittorie consecutive!
            </p>
            <p className="text-[10px] font-medium text-white/50">
              {stats.winStreak >= 3 ? 'Giocatore in stato ON FIRE 🔥' : 'In ottima forma sul campo'}
            </p>
          </div>
        </div>
      )}

      {/* Badge d'Onore Assegnati dalla Community */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <h4 className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">
            Medaglie d&rsquo;Onore Ricevute
          </h4>
          {totalBadges > 0 && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black text-white/80">
              {totalBadges} totali
            </span>
          )}
        </div>

        {totalBadges === 0 ? (
          <p className="py-2 text-center text-xs font-medium text-white/40">
            Nessuna medaglia d&rsquo;onore ricevuta finora.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <HonorBadgeChip
              icon={<HeartHandshake className="h-3.5 w-3.5 text-emerald-600" />}
              label="Amichevole"
              count={honorBadges.friendly}
            />
            <HonorBadgeChip
              icon={<Shield className="h-3.5 w-3.5 text-blue-600" />}
              label="Sportivo"
              count={honorBadges.sportive}
            />
            <HonorBadgeChip
              icon={<Trophy className="h-3.5 w-3.5 text-amber-600" />}
              label="Grande Giocatore"
              count={honorBadges.great_player}
            />
            <HonorBadgeChip
              icon={<Zap className="h-3.5 w-3.5 text-purple-600" />}
              label="Stratega"
              count={honorBadges.strategist}
            />
            <HonorBadgeChip
              icon={<Sparkles className="h-3.5 w-3.5 text-sky-600" />}
              label="Puntuale"
              count={honorBadges.punctual}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function HonorBadgeChip({
  icon,
  label,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  if (!count || count <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-bold text-white/80 shadow-sm">
      {icon}
      <span>{label}</span>
      <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-black text-white/70">
        {count}
      </span>
    </span>
  );
}
