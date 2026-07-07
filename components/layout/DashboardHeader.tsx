'use client';

import { logoutAction } from '@/actions/auth';
import { BrxHeaderLogo } from '@/components/layout/brx-header-logo';
import { DEFAULT_TOURNAMENTS_PATH } from '@/lib/constants/tournament-defaults';
import type { SessionUser } from '@/types/auth';
import { Layers, LogOut, Gamepad2, Swords } from 'lucide-react';
import Link from 'next/link';

interface DashboardHeaderProps {
  user: SessionUser;
  /** Mostra il pulsante icona per tornare al minigioco (vista semplice desktop). */
  showMinigameBack?: boolean;
  onBackToMinigame?: () => void;
}

/** Chip bianchi frosted: ogni bottone ha il suo sfondo, l'header resta nudo. */
const GHOST_CHIP =
  'bg-white/70 text-slate-800 ring-1 ring-slate-900/10 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/95';

/**
 * Header dashboard tornei — logo, utente, Crea mazzo, Le mie partite, Esci.
 * Senza sfondo: scorre via con la pagina, la toolbar sticky resta come ancora.
 */
export function DashboardHeader({ user, showMinigameBack, onBackToMinigame }: DashboardHeaderProps) {
  const displayName = user.name ?? user.email;
  const initial = (displayName[0] ?? '?').toUpperCase();

  return (
    <header className="header-gradient w-full pb-3 font-sans text-slate-900 md:pb-4">
      <div className="mx-auto flex max-w-content flex-wrap items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
        <div className="flex items-center gap-2 overflow-visible py-1">
          <BrxHeaderLogo href={DEFAULT_TOURNAMENTS_PATH} ariaLabel="Tornei" />
          <span className="font-sans text-base font-bold uppercase tracking-wide text-primary sm:text-lg">
            Tournaments
          </span>
        </div>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          {showMinigameBack && onBackToMinigame && (
            <button
              type="button"
              onClick={onBackToMinigame}
              aria-label="Torna al mini-gioco"
              className={`rounded-full p-2 ${GHOST_CHIP} hover:bg-primary/15 hover:ring-primary/40`}
            >
              <Gamepad2 className="h-4 w-4 text-primary" />
            </button>
          )}

          <div
            aria-label="Profilo"
            className="flex items-center gap-2 rounded-full bg-white/70 py-1 pl-1 pr-3 ring-1 ring-slate-900/10 shadow-sm backdrop-blur-sm"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {initial}
            </span>
            <span className="max-w-[5.5rem] truncate font-sans text-sm font-semibold text-slate-800 sm:max-w-[10rem]">
              {displayName}
            </span>
          </div>

          <Link
            href="/mazzi"
            aria-label="Crea mazzo"
            title="Crea mazzo"
            className="group grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-[#e0564d] text-white shadow-[0_6px_16px_-6px_rgba(255,115,0,0.55)] ring-1 ring-white/50 transition-transform hover:scale-105 active:scale-95"
          >
            <Layers className="h-4 w-4 transition-transform group-hover:-rotate-6" strokeWidth={2.4} />
          </Link>

          <Link
            href="/partite"
            aria-label="Le mie partite"
            className={`flex items-center gap-2 rounded-full p-2 text-sm font-bold uppercase tracking-wide ${GHOST_CHIP} sm:px-4 sm:py-1.5`}
          >
            <Swords className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Le mie partite</span>
          </Link>

          <form action={logoutAction}>
            <button
              type="submit"
              aria-label="Esci"
              className={`rounded-full p-2 ${GHOST_CHIP} hover:bg-destructive/10 hover:text-destructive hover:ring-destructive/30`}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
