'use client';

import Link from 'next/link';
import { LoginCodeForm } from '@/components/feature/auth/login-code-form';
import { AuthBackLink } from '@/components/layout/AuthBackLink';
import { AuthSplitViewShell } from '@/components/layout/AuthSplitViewShell';
import {
  AUTH_SPLIT_LINK_CLASS,
  AUTH_SPLIT_VIEW_FOOTER_CLASS,
} from '@/components/layout/auth-split-styles';

interface LoginCodeViewProps {
  redirect: string;
}

export function LoginCodeView({ redirect }: LoginCodeViewProps) {
  const loginHref = redirect
    ? `/login?accesso=1&redirect=${encodeURIComponent(redirect)}`
    : '/login?accesso=1';

  return (
    <AuthSplitViewShell className="min-h-screen lg:min-h-screen">
      <AuthBackLink href={loginHref} label="Torna al login" />

      <div className="flex flex-1 flex-col justify-center py-6 sm:py-8">
        <LoginCodeForm redirect={redirect} variant="split" />
      </div>

      <p className={AUTH_SPLIT_VIEW_FOOTER_CLASS}>
        Non hai un account?{' '}
        <Link href="/registrati" className={`font-semibold ${AUTH_SPLIT_LINK_CLASS}`}>
          Registrati
        </Link>
      </p>
    </AuthSplitViewShell>
  );
}
