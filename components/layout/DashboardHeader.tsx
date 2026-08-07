'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2, Layers, LogOut, Swords } from 'lucide-react';
import { logoutAction } from '@/actions/auth';
import { BrxHeaderLogo } from '@/components/layout/brx-header-logo';
import { ProfileDrawer } from '@/components/feature/profile/profile-drawer';
import { DEFAULT_TOURNAMENTS_PATH } from '@/lib/constants/tournament-defaults';
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
 * Il chip profilo apre un drawer con badge achievement e statistiche.
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
  const initial = (shownName[0] ?? '?').toUpperCase();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="w-full border-b border-slate-900/10 bg-white/70 font-sans text-slate-900 shadow-[0_12px_35px_-28px_rgba(15,23,42,0.75)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-content flex-wrap items-center gap-2.5 px-4 py-3 sm:flex-nowrap sm:gap-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-visible py-0.5 sm:flex-none">
          <BrxHeaderLogo href={DEFAULT_TOURNAMENTS_PATH} ariaLabel="Tornei" />
          <span className="font-sans text-base font-bold uppercase tracking-wide text-primary sm:text-lg">
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

        <div className="ml-auto flex shrink-0 items-center justify-end gap-1.5 sm:ml-0 sm:gap-2">
          {showMinigameBack && onBackToMinigame && (
            <button
              type="button"
              onClick={onBackToMinigame}
              aria-label="Torna al mini-gioco"
              className="grid h-9 w-9 place-items-center rounded-full border border-slate-900/10 bg-white/65 text-primary transition hover:border-primary/30 hover:bg-primary/10"
            >
              <Gamepad2 className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={profileOpen}
            aria-label={`Apri il profilo di ${shownName}`}
            className={cn(
              'flex h-9 items-center gap-2 rounded-full border border-slate-900/10 bg-white/65 p-1 transition sm:pr-3',
              'hover:border-slate-900/20 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
              profileOpen && 'border-slate-900/25 bg-white shadow-sm',
            )}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-header-bg text-xs font-black text-white">
              {initial}
            </span>
            <span className="hidden max-w-[7rem] truncate text-xs font-bold text-slate-700 lg:block xl:max-w-[10rem]">
              {shownName}
            </span>
          </button>

          <form action={logoutAction}>
            <button
              type="submit"
              aria-label="Esci"
              title="Esci"
              className="grid h-9 w-9 place-items-center rounded-full border border-slate-900/10 bg-white/65 text-slate-500 transition hover:border-destructive/25 hover:bg-destructive/10 hover:text-destructive"
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
          ? 'border-primary/50 bg-primary text-white shadow-[0_10px_22px_-12px_rgba(255,115,0,0.9)]'
          : 'border-slate-900/10 bg-white/75 text-header-bg hover:border-primary/30 hover:bg-white',
      )}
    >
      <span
        className={cn(
          'grid h-7 w-7 shrink-0 place-items-center rounded-lg transition',
          active ? 'bg-white/15 text-white' : 'bg-header-bg text-white group-hover:bg-primary',
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
      </span>
      <span className="min-w-0 truncate text-xs font-black uppercase tracking-wide">{label}</span>
    </Link>
  );
}
