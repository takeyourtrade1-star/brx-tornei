import Link from 'next/link';
import Image from 'next/image';
import { Home, Layers, LogOut, Swords } from 'lucide-react';
import { logoutAction } from '@/actions/auth';
import { SelectionDropdown } from '@/components/layout/selection-dropdown';
import { SITE_LOGO_SRC } from '@/lib/config';
import type { Selection } from '@/lib/validations/selection';
import { selectionQuery } from '@/lib/validations/selection';
import { cn } from '@/lib/utils';
import type { SessionUser } from '@/types/auth';

type DashboardNav = 'tornei' | 'mazzi' | 'partite';

interface DashboardHeaderProps {
  user: SessionUser;
  formatName: string;
  modeName: string;
  selection: Selection;
  activeNav?: DashboardNav;
}

const NAV_BTN =
  'flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-bold uppercase tracking-wide transition-colors sm:px-4';

/**
 * Header dashboard — due righe su mobile per evitare overflow.
 */
export function DashboardHeader({
  user,
  formatName,
  modeName,
  selection,
  activeNav,
}: DashboardHeaderProps) {
  const logoUrl = SITE_LOGO_SRC;
  const displayName = user.name ?? user.email;
  const initial = (displayName[0] ?? '?').toUpperCase();
  const selectionQs = selectionQuery(selection);
  const partiteQs = `${selectionQs}&tab=attive`.replace('?&', '?');

  return (
    <header className="header-gradient sticky top-0 z-50 w-full overflow-visible pb-4 font-sans text-white sm:pb-6">
      <div className="mx-auto flex max-w-content flex-col gap-2 px-4 py-2 sm:gap-3 sm:px-6">
        {/* Riga 1: logo + utente */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            aria-label="Home"
            className="flex shrink-0 items-center justify-center overflow-visible py-1 transition-opacity hover:opacity-90"
          >
            <Image
              src={logoUrl}
              alt="Ebartex"
              width={48}
              height={48}
              className="block h-10 w-auto object-contain align-middle sm:h-12"
              priority
            />
          </Link>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <span className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-2 ring-1 ring-white/15 sm:pr-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {initial}
              </span>
              <span className="hidden max-w-[8rem] truncate text-sm font-semibold sm:inline md:max-w-[10rem]">
                {displayName}
              </span>
            </span>
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

        {/* Riga 2: navigazione + dropdown */}
        <div className="flex items-center gap-2">
          <Link
            href="/hub"
            aria-label="Torna alla selezione"
            className="shrink-0 rounded-full bg-white/10 p-2 ring-1 ring-white/20 transition-colors hover:bg-white/20"
          >
            <Home className="h-4 w-4" />
          </Link>

          <SelectionDropdown
            selection={selection}
            formatName={formatName}
            modeName={modeName}
            className="min-w-0 flex-1"
          />

          <Link
            href={`/mazzi${selectionQs}`}
            aria-current={activeNav === 'mazzi' ? 'page' : undefined}
            aria-label="I miei mazzi"
            title="I miei mazzi"
            className={cn(
              NAV_BTN,
              activeNav === 'mazzi'
                ? 'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90'
                : 'bg-white/10 ring-1 ring-white/20 hover:bg-white/20'
            )}
          >
            <Layers className="h-4 w-4 shrink-0" />
            <span className="hidden lg:inline">I miei mazzi</span>
          </Link>
          <Link
            href={`/partite${partiteQs}`}
            aria-current={activeNav === 'partite' ? 'page' : undefined}
            aria-label="Le mie partite"
            title="Le mie partite"
            className={cn(
              NAV_BTN,
              activeNav === 'partite'
                ? 'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90'
                : 'bg-white/10 ring-1 ring-white/20 hover:bg-white/20'
            )}
          >
            <Swords className="h-4 w-4 shrink-0" />
            <span className="hidden lg:inline">Le mie partite</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
