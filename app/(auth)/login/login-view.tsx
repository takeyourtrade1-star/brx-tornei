'use client';

import Link from 'next/link';
import { LoginForm } from '@/components/feature/auth/login-form';
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import { AuthSplitHeader } from '@/components/layout/AuthSplitHeader';
import {
  AUTH_SPLIT_LINK_CLASS,
  AUTH_SPLIT_SECTION_CLASS,
} from '@/components/layout/auth-split-styles';
import { cn } from '@/lib/utils';
import { config } from '@/lib/config';

interface LoginViewProps {
  redirect: string;
  recoverUrl: string;
}

export function LoginView({ redirect, recoverUrl }: LoginViewProps) {
  return (
    <AuthSplitLayout
      formPlacement="start"
      className="min-h-screen lg:min-h-screen"
      panelClassName="flex min-h-full flex-1 flex-col"
    >
      <div className="flex flex-1 flex-col justify-center py-6 sm:py-8">
        <AuthSplitHeader
          title="Entra nella sala tornei"
          subtitle="Usa le credenziali del tuo account Ebartex."
          className="mb-5 shrink-0 sm:mb-6"
        />
        <LoginForm variant="landing" redirect={redirect} recoverUrl={recoverUrl} />
      </div>

      <div className={cn(AUTH_SPLIT_SECTION_CLASS, 'mt-auto shrink-0')}>
        <p>
          <a
            href={config.app.mainSiteUrl}
            className={`font-semibold ${AUTH_SPLIT_LINK_CLASS} transition-colors hover:underline`}
          >
            Esplora il sito Ebartex
          </a>
        </p>
        <p className="mt-2">
          Dopo l&apos;accesso entri nella stanza tornei con inventario e profilo già sincronizzati.
        </p>
        <p className="mt-2">
          Serve aiuto?{' '}
          <a href="mailto:ebartex.service@gmail.com" className={`font-medium ${AUTH_SPLIT_LINK_CLASS}`}>
            ebartex.service@gmail.com
          </a>
        </p>
        <p className="mt-2 font-medium text-[#86868b]/90">
          Non hai un account?{' '}
          <Link href="/registrati" className={AUTH_SPLIT_LINK_CLASS}>
            Registrati su Ebartex
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
