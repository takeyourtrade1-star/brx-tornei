import Link from 'next/link';
import { ChevronRight, Home, Layers, LogOut, Swords } from 'lucide-react';
import { logoutAction } from '@/actions/auth';
import { BrxHeaderLogo } from '@/components/layout/brx-header-logo';
import type { SessionUser } from '@/types/auth';

interface DashboardHeaderProps {
  user: SessionUser;
  formatId: string;
  formatName: string;
  modeName: string;
}

const CHIP_CLASS =
  'rounded-full bg-white/10 px-4 py-1.5 font-sans text-sm font-bold uppercase tracking-wide text-white ring-1 ring-white/20 transition-colors hover:bg-white/20';

/**
 * Header di stato della dashboard — speculare all'header Ebartex
 * (.header-gradient, font-display, logo CDN) con la riga del mockup:
 * [home] [formato scelto] [tipologia scelta] · utente · [I miei mazzi] [Le mie partite]
 */
export function DashboardHeader({ user, formatId, formatName, modeName }: DashboardHeaderProps) {
  const displayName = user.name ?? user.email;
  const initial = (displayName[0] ?? '?').toUpperCase();

  return (
    <header className="header-gradient sticky top-0 z-50 w-full pb-4 md:pb-8 font-sans text-white">
      {/* MOBILE HEADER (md:hidden) */}
      <div className="flex md:hidden flex-col gap-3 px-4 py-3">
        {/* Row 1: Logo & Actions */}
        <div className="flex items-center justify-between">
          <BrxHeaderLogo ariaLabel="Home" />
          
          <div className="flex items-center gap-2">
            <Link
              href="/hub"
              aria-label="Torna alla selezione"
              className="rounded-full bg-white/10 p-2 ring-1 ring-white/20 transition-colors hover:bg-white/20"
            >
              <Home className="h-4 w-4" />
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

        {/* Row 2: Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 text-xs text-white/50 px-1 font-semibold uppercase tracking-wider">
          <Link href="/hub" className="hover:text-white transition-colors">Tornei</Link>
          <ChevronRight className="h-3 w-3 text-white/30 shrink-0" />
          <Link href="/hub" className="hover:text-white transition-colors">{formatName}</Link>
          <ChevronRight className="h-3 w-3 text-white/30 shrink-0" />
          <Link href={`/hub?format=${formatId}#modalita`} className="text-primary hover:text-primary/80 transition-colors">{modeName}</Link>
        </div>

        {/* Row 3: Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <Link
            href="/mazzi"
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] py-2 px-3 text-xs font-bold uppercase tracking-wider text-white shadow-[0_4px_12px_rgba(255,115,0,0.25)] transition-all active:scale-[0.98]"
          >
            <Layers className="h-3.5 w-3.5" />
            I miei mazzi
          </Link>
          <Link
            href="/partite"
            className="flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 py-2 px-3 text-xs font-bold uppercase tracking-wider text-white transition-all active:scale-[0.98] hover:bg-white/10"
          >
            <Swords className="h-3.5 w-3.5 text-primary" />
            Le mie partite
          </Link>
        </div>
      </div>

      {/* DESKTOP HEADER (hidden md:flex) */}
      <div className="hidden md:flex mx-auto max-w-content items-center gap-2 px-4 py-2 sm:gap-3 sm:px-6">
        {/* Logo + home (riporta alla home, dal mockup) */}
        <BrxHeaderLogo ariaLabel="Home" />
        <Link
          href="/hub"
          aria-label="Torna alla selezione"
          className="rounded-full bg-white/10 p-2 ring-1 ring-white/20 transition-colors hover:bg-white/20"
        >
          <Home className="h-4 w-4" />
        </Link>

        {/* Formato scelto / tipologia scelta — chip cliccabili per cambiare */}
        <Link href="/hub" className={CHIP_CLASS} title="Cambia formato">
          {formatName}
        </Link>
        <ChevronRight className="h-4 w-4 text-white/50 shrink-0" />
        <Link
          href={`/hub?format=${formatId}#modalita`}
          className={CHIP_CLASS}
          title="Cambia modalità"
        >
          {modeName}
        </Link>

        {/* Lato destro: utente + azioni del mockup */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3 ring-1 ring-white/15 md:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold">
              {initial}
            </span>
            <span className="max-w-[10rem] truncate font-sans text-sm font-semibold">
              {displayName}
            </span>
          </span>

          <Link
            href="/mazzi"
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm uppercase tracking-wide text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
          >
            <Layers className="h-4 w-4" />
            I miei mazzi
          </Link>
          <Link
            href="/partite"
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold uppercase tracking-wide ring-1 ring-white/20 transition-colors hover:bg-white/20"
          >
            <Swords className="h-4 w-4" />
            Le mie partite
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
