'use client';

import { LoginForm } from '@/components/feature/auth/login-form';
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import { AuthSplitHeader } from '@/components/layout/AuthSplitHeader';
import {
  AUTH_LINK_CLASS,
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
      panelClassName="flex h-full min-h-0 flex-1 flex-col"
    >
      <div className="flex min-h-0 flex-1 flex-col justify-center py-4">
        <AuthSplitHeader
          title="Entra nella sala tornei"
          className="mb-4 shrink-0"
        />
        <LoginForm variant="landing" redirect={redirect} recoverUrl={recoverUrl} />
      </div>

      <div className={cn(AUTH_SPLIT_SECTION_CLASS, 'mt-auto shrink-0')}>
        <p>
          <a
            href={config.app.mainSiteUrl}
            className={`font-semibold ${AUTH_LINK_CLASS} transition-colors hover:underline`}
          >
            Esplora il sito Ebartex
          </a>
        </p>
        <p className="mt-1.5">
          Usa le credenziali del tuo account Ebartex per accedere a tornei, iscrizioni e classifiche.
        </p>
        <p className="mt-1.5">
          Problemi? Scrivici a{' '}
          <a href="mailto:ebartex.service@gmail.com" className={`font-medium ${AUTH_LINK_CLASS}`}>
            ebartex.service@gmail.com
          </a>
        </p>
        <p className="mt-1.5 font-medium text-[#86868b]/90">
          La piattaforma tornei è in evoluzione: potresti incontrare aggiornamenti o piccole imperfezioni.
        </p>
      </div>
    </AuthSplitLayout>
  );
}
