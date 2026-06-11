import Link from 'next/link';
import Image from 'next/image';
import { Home, Layers, LogOut, Swords } from 'lucide-react';
import { logoutAction } from '@/actions/auth';
import { getCdnImageUrl } from '@/lib/config';
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
  const logoUrl = getCdnImageUrl('logo.png');
  const displayName = user.name ?? user.email;
  const initial = (displayName[0] ?? '?').toUpperCase();

  return (
    <header className="header-gradient sticky top-0 z-50 w-full pb-8 font-sans text-white">
      <div className="mx-auto flex max-w-content flex-wrap items-center gap-2 px-4 py-2 sm:gap-3 sm:px-6">
        {/* Logo + home (riporta alla home, dal mockup) */}
        <Link href="/" aria-label="Home" className="transition-opacity hover:opacity-90 overflow-visible py-1 flex items-center justify-center">
          <Image
            src={logoUrl}
            alt="Ebartex"
            width={110}
            height={48}
            className="h-12 w-auto object-contain block align-middle"
            priority
            unoptimized
          />
        </Link>
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
