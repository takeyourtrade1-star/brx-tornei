import { getAvatarById } from '@/lib/avatars';
import { ProfileRankBadge } from '@/components/feature/profile/profile-rank-badge';

interface OnboardingCardPreviewProps {
  gamertag: string;
  avatarId: string;
}

/**
 * Anteprima autentica, grande e dettagliata della scheda giocatore nei tornei.
 */
export function OnboardingCardPreview({ gamertag, avatarId }: OnboardingCardPreviewProps) {
  const avatar = getAvatarById(avatarId);
  const displayTag = gamertag.trim() || 'TuoGamertag';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-[#162032]/95 via-[#0d1424]/95 to-[#080d18]/95 p-4 shadow-xl backdrop-blur-md">
      {/* Glow ambientali sobri */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/15 blur-2xl"
      />

      {/* Intestazione card */}
      <div className="relative flex items-center justify-between gap-3 border-b border-white/10 pb-2.5">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
            Ebartex Player Card
          </p>
          <p className="text-[11px] font-semibold text-slate-300">
            Anteprima della tua scheda ai tavoli
          </p>
        </div>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary">
          Debuttante
        </span>
      </div>

      {/* Blocco Principale: Rank Badge + Gamertag + Info */}
      <div className="relative mt-3 flex items-center gap-3.5">
        <div className="shrink-0">
          <ProfileRankBadge
            avatarId={avatarId}
            gamertag={displayTag}
            wins={0}
            starCount={1}
            interactive={false}
            hidePill
          />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">
            {avatar.name} · {avatar.subtitle}
          </p>
          <h3 className="truncate font-display text-xl font-black tracking-tight text-white sm:text-2xl">
            {displayTag}
          </h3>
          <p className="text-[11px] text-slate-400">
            Pronto per il tuo 1° torneo
          </p>
        </div>
      </div>

      {/* Statistiche di partenza reali */}
      <div className="relative mt-3 grid grid-cols-3 gap-1.5 border-t border-white/10 pt-2.5 text-center">
        <div className="rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Grado</p>
          <p className="font-display text-xs font-black text-amber-300">1 Stella</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Partite</p>
          <p className="font-display text-xs font-black text-white">0 giocate</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Fair Play</p>
          <p className="font-display text-xs font-black text-emerald-400">100%</p>
        </div>
      </div>
    </div>
  );
}


