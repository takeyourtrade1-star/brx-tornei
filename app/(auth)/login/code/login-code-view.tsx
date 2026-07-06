'use client';

import Link from 'next/link';
import { LoginCodeForm } from '@/components/feature/auth/login-code-form';
import { AuthBackLink } from '@/components/layout/AuthBackLink';
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import {
  AUTH_LINK_CLASS,
  AUTH_SPLIT_FOOTER_LINK_CLASS,
  AUTH_SPLIT_VIEW_FOOTER_CLASS,
} from '@/components/layout/auth-split-styles';
import { cn } from '@/lib/utils';

interface LoginCodeViewProps {
  redirect: string;
}

export function LoginCodeView({ redirect }: LoginCodeViewProps) {
  const loginHref = redirect
    ? `/login?accesso=1&redirect=${encodeURIComponent(redirect)}`
    : '/login?accesso=1';

  return (
    <AuthSplitLayout
      formPlacement="start"
      className="min-h-screen lg:min-h-screen"
      panelClassName="flex min-h-full flex-1 flex-col"
    >
      <AuthBackLink href={loginHref} label="Torna al login" />

      <div className="flex flex-1 flex-col justify-center py-6 sm:py-8">
        <LoginCodeForm redirect={redirect} variant="split" />
      </div>

      <div className={cn(AUTH_SPLIT_VIEW_FOOTER_CLASS, 'mt-auto shrink-0')}>
        <p className={AUTH_SPLIT_FOOTER_LINK_CLASS}>
          Non hai un account?{' '}
          <Link href="/registrati" className={`font-semibold ${AUTH_LINK_CLASS}`}>
            Registrati
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
