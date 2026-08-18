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
    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-[#162032]/95 via-[#0d1424]/95 to-[#080d18]/95 p-5 shadow-2xl backdrop-blur-md sm:p-6">
      {/* Glow ambientali sobri */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-primary/15 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-amber-500/10 blur-3xl"
      />

      {/* Intestazione card */}
      <div className="relative flex items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Ebartex Player Card
          </p>
          <p className="text-xs font-semibold text-slate-300">
            Ecco come apparirai agli avversari ai tavoli
          </p>
        </div>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
          Debuttante
        </span>
      </div>

      {/* Blocco Principale: Rank Badge + Gamertag + Info */}
      <div className="relative mt-5 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="shrink-0">
          <ProfileRankBadge
            avatarId={avatarId}
            gamertag={displayTag}
            wins={0}
            starCount={1}
            interactive={false}
            hidePill
            className="scale-110 sm:scale-125"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-400">
            {avatar.name} · {avatar.subtitle}
          </p>
          <h3 className="truncate font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
            {displayTag}
          </h3>
          <p className="text-xs text-slate-400">
            Pronto per registrarti al tuo primo torneo TCG
          </p>
        </div>
      </div>

      {/* Statistiche di partenza reali */}
      <div className="relative mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
        <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Grado</p>
          <p className="mt-0.5 font-display text-sm font-black text-amber-300">1 Stella</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Partite</p>
          <p className="mt-0.5 font-display text-sm font-black text-white">0 giocate</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fair Play</p>
          <p className="mt-0.5 font-display text-sm font-black text-emerald-400">100%</p>
        </div>
      </div>
    </div>
  );
}

