import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { LoginView } from './login-view';
import { getSession } from '@/lib/auth/session';
import { sanitizeRedirect } from '@/lib/auth/redirect';
import { config } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Accedi',
  description: 'Accedi alla sala tornei Ebartex con le tue credenziali',
};

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string; accesso?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();
  const params = await searchParams;
  const redirectTo = sanitizeRedirect(params.redirect ?? null);

  if (session) redirect(redirectTo);

  return (
    <Suspense>
      <LoginView
        redirect={params.redirect ?? ''}
        recoverUrl={`${config.app.mainSiteUrl}/recupera-credenziali`}
      />
    </Suspense>
  );
}
