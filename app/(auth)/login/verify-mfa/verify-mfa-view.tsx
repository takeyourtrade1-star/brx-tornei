'use client';

import Link from 'next/link';
import { VerifyMfaForm } from '@/components/feature/auth/verify-mfa-form';
import { AuthBackLink } from '@/components/layout/AuthBackLink';
import { AuthSplitHeader } from '@/components/layout/AuthSplitHeader';
import { AuthSplitViewShell } from '@/components/layout/AuthSplitViewShell';
import {
  AUTH_SPLIT_LINK_CLASS,
  AUTH_SPLIT_MUTED_CLASS,
  AUTH_SPLIT_VIEW_FOOTER_CLASS,
} from '@/components/layout/auth-split-styles';
import { cn } from '@/lib/utils';

interface VerifyMfaViewProps {
  redirect: string;
}

export function VerifyMfaView({ redirect }: VerifyMfaViewProps) {
  const loginHref = redirect
    ? `/login?accesso=1&redirect=${encodeURIComponent(redirect)}`
    : '/login?accesso=1';

  return (
    <AuthSplitViewShell centerForm className="min-h-screen lg:min-h-screen">
      <AuthBackLink href={loginHref} />

      <AuthSplitHeader
        title="Verifica in due passaggi"
        subtitle="Inserisci il codice a 6 cifre dalla tua app di autenticazione."
        className="mb-0 shrink-0"
      />

      <VerifyMfaForm redirect={redirect} variant="split" loginHref={loginHref} />

      <p className={cn(AUTH_SPLIT_VIEW_FOOTER_CLASS, 'mt-5')}>
        <span className={AUTH_SPLIT_MUTED_CLASS}>
          Problemi con MFA? Contatta{' '}
          <a href="mailto:ebartex.service@gmail.com" className={AUTH_SPLIT_LINK_CLASS}>
            ebartex.service@gmail.com
          </a>
        </span>
      </p>
    </AuthSplitViewShell>
  );
}
