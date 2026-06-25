'use client';

import { logoutAction } from '@/actions/auth';
import { BrxHeaderLogo } from '@/components/layout/brx-header-logo';
import { DEFAULT_TOURNAMENTS_PATH } from '@/lib/constants/tournament-defaults';
import type { SessionUser } from '@/types/auth';
import { Layers, LogOut, Gamepad2, Swords } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

interface DashboardHeaderProps {
  user: SessionUser;
  /** Mostra il pulsante icona per tornare al minigioco (vista semplice desktop). */
  showMinigameBack?: boolean;
  onBackToMinigame?: () => void;
}

const ACTION_LINK =
  'flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold uppercase tracking-wide transition-colors';

/**
 * Header dashboard tornei — logo, utente, Crea mazzo, Le mie partite, Esci.
 */
export function DashboardHeader({ user, showMinigameBack, onBackToMinigame }: DashboardHeaderProps) {
  const displayName = user.name ?? user.email;
  const initial = (displayName[0] ?? '?').toUpperCase();
  const headerRef = useRef<HTMLElement>(null);

  // Espone l'altezza reale dell'header (che su mobile può andare a capo) come
  // CSS var, così la toolbar sticky si aggancia esattamente sotto di esso.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () =>
      document.documentElement.style.setProperty('--dash-header-h', `${el.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className="header-gradient sticky top-0 z-50 w-full pb-3 font-sans text-white md:pb-4"
    >
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
              className="rounded-full bg-white/10 p-2 ring-1 ring-white/15 transition-colors hover:bg-primary/20 hover:ring-primary/40"
            >
              <Gamepad2 className="h-4 w-4 text-primary" />
            </button>
          )}

          <div
            aria-label="Profilo"
            className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3 ring-1 ring-white/15"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold">
              {initial}
            </span>
            <span className="max-w-[5.5rem] truncate font-sans text-sm font-semibold sm:max-w-[10rem]">
              {displayName}
            </span>
          </div>

          <Link
            href="/mazzi"
            className={`${ACTION_LINK} bg-primary text-primary-foreground shadow-lg hover:bg-primary/90`}
          >
            <Layers className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Crea mazzo</span>
            <span className="sm:hidden">Mazzo</span>
          </Link>

          <Link
            href="/partite"
            aria-label="Le mie partite"
            className="flex items-center gap-2 rounded-full bg-white/10 p-2 text-sm font-bold uppercase tracking-wide ring-1 ring-white/20 transition-colors hover:bg-white/20 sm:px-4 sm:py-1.5"
          >
            <Swords className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Le mie partite</span>
          </Link>

          <form action={logoutAction}>
            <button
              type="submit"
              aria-label="Esci"
              className="rounded-full bg-white/10 p-2 ring-1 ring-white/15 transition-colors hover:bg-destructive/80"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
