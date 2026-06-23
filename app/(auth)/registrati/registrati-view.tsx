'use client';

import Link from 'next/link';
import { AuthSplitHeader } from '@/components/layout/AuthSplitHeader';
import { AuthSplitViewShell } from '@/components/layout/AuthSplitViewShell';
import {
  AUTH_SPLIT_BODY_CLASS,
  AUTH_SPLIT_BUTTON_CLASS,
  AUTH_SPLIT_LINK_CLASS,
  AUTH_SPLIT_MUTED_CLASS,
  AUTH_SPLIT_VIEW_FOOTER_CLASS,
} from '@/components/layout/auth-split-styles';
import { config } from '@/lib/config';
import { cn } from '@/lib/utils';

/**
 * MVP: la registrazione multi-step resta sul sito principale.
 * Layout split allineato a new_frontend_brx (video sinistra, pannello destro).
 */
export function RegistratiView() {
  const registerUrl = `${config.app.mainSiteUrl}/registrati`;

  return (
    <AuthSplitViewShell className="min-h-screen lg:min-h-screen">
      <AuthSplitHeader title="Crea il tuo account in pochi secondi." className="mb-0 shrink-0" />

      <div className="flex flex-1 flex-col justify-center py-6 sm:py-8">
        <p className={AUTH_SPLIT_BODY_CLASS}>
          La registrazione avviene sul sito principale Ebartex. Al termine torna sui Tornei: sarai
          riconosciuto automaticamente grazie all&apos;accesso unico tra i servizi.
        </p>

        <a
          href={registerUrl}
          className={cn(
            AUTH_SPLIT_BUTTON_CLASS,
            'mt-5 inline-block text-center no-underline'
          )}
        >
          Registrati su Ebartex
        </a>

        <p className={cn(AUTH_SPLIT_MUTED_CLASS, 'mt-4')}>
          Dopo la registrazione potrai accedere alla sala tornei con lo stesso account.
        </p>
      </div>

      <p className={cn(AUTH_SPLIT_VIEW_FOOTER_CLASS, 'mt-5')}>
        <Link href="/login?accesso=1" className={AUTH_SPLIT_LINK_CLASS}>
          Hai già un account? Accedi
        </Link>
      </p>
    </AuthSplitViewShell>
  );
}
