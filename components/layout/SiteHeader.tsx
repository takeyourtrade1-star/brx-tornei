import Link from 'next/link';
import Image from 'next/image';
import { LogOut } from 'lucide-react';
import { logoutAction } from '@/actions/auth';
import { SelectionDropdown } from '@/components/layout/selection-dropdown';
import { getSession } from '@/lib/auth/session';
import { config, getCdnImageUrl } from '@/lib/config';
import type { Selection } from '@/lib/validations/selection';

const CHIP_CLASS =
  'rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white ring-1 ring-white/20 transition-colors hover:bg-white/20 sm:px-4 sm:text-sm';

interface SiteHeaderProps {
  /** Se presente, mostra il dropdown formato/modalità (es. pagina /tornei). */
  selection?: Selection;
  formatName?: string;
  modeName?: string;
}

/**
 * Header del sito (hub e browsing pubblico) — due righe su mobile quando c'è il dropdown.
 */
export async function SiteHeader({ selection, formatName, modeName }: SiteHeaderProps = {}) {
  const logoUrl = getCdnImageUrl('logo.png');
  const session = await getSession();
  const displayName = session?.user.name ?? session?.user.email;
  const initial = displayName ? (displayName[0] ?? '?').toUpperCase() : '?';
  const hasSelection = !!(selection && formatName && modeName);

  return (
    <header className="header-gradient sticky top-0 z-50 w-full overflow-visible pb-4 font-sans text-white sm:pb-6">
      <div className="mx-auto flex max-w-content flex-col gap-2 px-4 py-2 sm:gap-3 sm:px-6">
        <div className="flex items-center gap-2">
          <Link
            href="/hub"
            aria-label="Ebartex Tornei — home"
            className="flex min-w-0 shrink-0 items-center gap-1.5 overflow-visible py-1 transition-opacity hover:opacity-90"
          >
            <Image
              src={logoUrl}
              alt="Ebartex"
              width={120}
              height={52}
              className="block h-10 w-auto object-contain align-middle sm:h-[3.25rem]"
              priority
              unoptimized
            />
          </Link>

          <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            {session ? (
              <>
                <span className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-2 ring-1 ring-white/15 sm:pr-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {initial}
                  </span>
                  <span className="hidden max-w-[8rem] truncate text-sm font-semibold sm:inline">
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
              </>
            ) : (
              <>
                <Link href="/login" className={CHIP_CLASS}>
                  Accedi
                </Link>
                <Link
                  href="/registrati"
                  className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 sm:px-4 sm:text-sm"
                >
                  Registrati
                </Link>
              </>
            )}

            <a
              href={config.app.mainSiteUrl}
              className={`${CHIP_CLASS} hidden min-[400px]:inline-flex`}
            >
              ← Ebartex
            </a>
          </div>
        </div>

        {hasSelection && (
          <SelectionDropdown
            selection={selection}
            formatName={formatName}
            modeName={modeName}
          />
        )}
      </div>
    </header>
  );
}
