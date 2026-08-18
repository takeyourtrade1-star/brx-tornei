import { getAvatarById } from '@/lib/avatars';
import { Star, Shield, Swords } from 'lucide-react';

interface OnboardingCardPreviewProps {
  gamertag: string;
  avatarId: string;
}

/**
 * Live preview della card giocatore che gli altri vedranno nei match e nelle classifiche.
 */
export function OnboardingCardPreview({ gamertag, avatarId }: OnboardingCardPreviewProps) {
  const avatar = getAvatarById(avatarId);
  const AvatarIcon = avatar.icon;
  const displayTag = gamertag.trim() || 'TuoGamertag';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-[#1E293B]/90 via-[#0F172A]/90 to-[#0A0F1D]/90 p-4 shadow-xl backdrop-blur-md">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,115,0,0.15),transparent_70%)]"
      />

      <div className="relative flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
          <Swords className="h-3.5 w-3.5 text-primary" aria-hidden />
          <span>Anteprima Scheda Duellante</span>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400">
          Pronto a giocare
        </span>
      </div>

      <div className="relative mt-3.5 flex items-center gap-3.5">
        {/* Avatar Badge */}
        <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-2 shadow-inner">
          <AvatarIcon className="h-9 w-9" />
          <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border border-amber-400 bg-amber-500 text-slate-950 shadow">
            <Star className="h-3 w-3 fill-slate-950" aria-hidden />
          </span>
        </div>

        {/* Info Duellante */}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {avatar.subtitle}
          </p>
          <p className="truncate font-display text-lg font-black tracking-tight text-white sm:text-xl">
            {displayTag}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300">
              <Shield className="h-3 w-3 text-slate-400" aria-hidden />
              Grado Recluta
            </span>
            <span className="text-white/20">·</span>
            <span className="text-[11px] font-semibold text-amber-400">100% Reputazione</span>
          </div>
        </div>
      </div>
    </div>
  );
}
