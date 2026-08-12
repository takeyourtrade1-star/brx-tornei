'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2, Layers, LogOut, Star, Swords } from 'lucide-react';
import { logoutAction } from '@/actions/auth';
import { BrxHeaderLogo } from '@/components/layout/brx-header-logo';
import { ProfileDrawer } from '@/components/feature/profile/profile-drawer';
import { DEFAULT_TOURNAMENTS_PATH } from '@/lib/constants/tournament-defaults';
import { getAvatarById, getSavedAvatarId } from '@/lib/avatars';
import { cn } from '@/lib/utils';
import type { ReputationSummary } from '@/lib/data/player-api-client';
import type { SessionUser } from '@/types/auth';

interface DashboardHeaderProps {
  user: SessionUser;
  /** Identità mostrata nel chip profilo: il gamertag torneo, quando noto. */
  displayName?: string;
  /** Mostra il pulsante icona per tornare al minigioco (vista semplice desktop). */
  showMinigameBack?: boolean;
  onBackToMinigame?: () => void;
  /** Reputazione già disponibile sulla pagina: passata al drawer per evitare fetch. */
  reputation?: ReputationSummary | null;
}

/**
 * Header dashboard tornei — Mazzi e Partite sono le azioni primarie; profilo,
 * ritorno al minigioco e logout restano controlli secondari e più discreti.
 * Il widget profilo mostra l'avatar gaming personalizzabile con cerchio grado 1★.
 */
export function DashboardHeader({
  user,
  displayName,
  showMinigameBack,
  onBackToMinigame,
  reputation,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const shownName = displayName ?? user.name ?? user.email;
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarId, setAvatarId] = useState(() => getSavedAvatarId());

  useEffect(() => {
    const handleAvatarChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ avatarId: string }>;
      if (customEvent.detail?.avatarId) {
        setAvatarId(customEvent.detail.avatarId);
      }
    };
    window.addEventListener('ebartex-avatar-changed', handleAvatarChange);
    return () => window.removeEventListener('ebartex-avatar-changed', handleAvatarChange);
  }, []);

  const activeAvatar = getAvatarById(avatarId);
  const AvatarIcon = activeAvatar.icon;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-header-bg/85 font-sans text-white shadow-lg backdrop-blur-xl">
      <div className="mx-auto flex max-w-content flex-wrap items-center gap-2.5 px-4 py-2 sm:flex-nowrap sm:gap-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-visible py-0.5 sm:flex-none">
          <BrxHeaderLogo href={DEFAULT_TOURNAMENTS_PATH} ariaLabel="Tornei" />
          <span className="font-sans text-base font-black uppercase tracking-wide text-primary sm:text-lg">
            Tournaments
          </span>
        </div>

        <nav
          aria-label="Navigazione principale tornei"
          className="order-3 grid w-full grid-cols-2 gap-2 sm:order-none sm:ml-auto sm:flex sm:w-auto"
        >
          <HeaderPrimaryLink
            href="/mazzi"
            label="I miei mazzi"
            icon={Layers}
            active={pathname.startsWith('/mazzi')}
          />
          <HeaderPrimaryLink
            href="/partite"
            label="Le mie partite"
            icon={Swords}
            active={pathname.startsWith('/partite')}
          />
        </nav>

        <div className="ml-auto flex shrink-0 items-center justify-end gap-2 sm:ml-0 sm:gap-3">
          {showMinigameBack && onBackToMinigame && (
            <button
              type="button"
              onClick={onBackToMinigame}
              aria-label="Torna al mini-gioco"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/10 text-primary transition hover:border-primary/40 hover:bg-primary/15"
            >
              <Gamepad2 className="h-4 w-4" />
            </button>
          )}

          {/* Widget Profilo con Cerchio Grado contenente la stellina DENTRO, Avatar grande (64px) e Gamertag sovrapposto */}
          <div className="relative flex items-center justify-center py-1 sm:py-1.5">
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={profileOpen}
              aria-label={`Apri il profilo di ${shownName}`}
              className="group relative flex flex-col items-center justify-center focus-visible:outline-none"
            >
              {/* Cerchio del Grado (Rank Ring) che avvolge l'icona e contiene la stellina al suo interno */}
              <div className="relative flex flex-col items-center justify-center rounded-full border-2 border-amber-400/80 bg-gradient-to-b from-amber-500/25 via-slate-950/90 to-slate-950 p-2 shadow-[0_0_22px_rgba(255,115,0,0.4)] transition-transform group-hover:scale-105 group-hover:border-amber-300">
                {/* Stellina di grado DENTRO la sommità del cerchio */}
                <div
                  className="absolute top-1 z-10 flex items-center justify-center gap-0.5 rounded-full border border-amber-400/70 bg-slate-950/95 px-2 py-0.5 shadow-[0_0_10px_rgba(245,158,11,0.6)]"
                  title="Grado 1★"
                >
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400 animate-pulse" />
                </div>

                {/* Icona Avatar centrale più grande (h-14 sm:h-16) e dettagliata */}
                <div
                  className={cn(
                    'mt-3.5 grid h-13 w-13 place-items-center rounded-full border-2 border-white/30 bg-gradient-to-b from-slate-900 via-header-bg to-black p-2.5 shadow-2xl transition-all sm:h-16 sm:w-16 sm:p-3',
                    activeAvatar.bgGradient,
                  )}
                >
                  <AvatarIcon
                    className={cn(
                      'h-6 w-6 transition-transform group-hover:scale-110 sm:h-8 sm:w-8 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]',
                      activeAvatar.color,
                    )}
                  />
                </div>
              </div>

              {/* Gamertag sovrapposto in basso: mezzo dentro e mezzo fuori dal cerchio */}
              <span className="absolute -bottom-2.5 z-20 inline-flex max-w-[6rem] items-center justify-center truncate rounded-full border border-white/25 bg-slate-950/95 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xl backdrop-blur-md transition-colors group-hover:border-primary/70 group-hover:text-primary sm:max-w-[8.5rem] sm:text-[10px]">
                {shownName}
              </span>
            </button>
          </div>

          <form action={logoutAction} className="ml-1">
            <button
              type="submit"
              aria-label="Esci"
              title="Esci"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/10 text-white/60 transition hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      <ProfileDrawer
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        gamertag={shownName}
        initialReputation={reputation}
      />
    </header>
  );
}

function HeaderPrimaryLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Layers;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-left transition sm:min-w-[8.75rem]',
        active
          ? 'border-primary/50 bg-gradient-to-r from-[#FF7300] to-[#e0564d] text-white shadow-[0_6px_20px_-6px_rgba(255,115,0,0.6)]'
          : 'border-white/15 bg-white/10 text-white/85 hover:border-white/30 hover:bg-white/15 hover:text-white',
      )}
    >
      <span
        className={cn(
          'grid h-7 w-7 shrink-0 place-items-center rounded-lg transition',
          active ? 'bg-white/20 text-white' : 'bg-white/10 text-white/90 group-hover:bg-primary group-hover:text-white',
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
      </span>
      <span className="min-w-0 truncate text-xs font-black uppercase tracking-wide">{label}</span>
    </Link>
  );
}
