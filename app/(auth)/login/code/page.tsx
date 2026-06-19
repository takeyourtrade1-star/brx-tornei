import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { LoginCodeView } from './login-code-view';
import { getSession } from '@/lib/auth/session';
import { sanitizeRedirect } from '@/lib/auth/redirect';

export const metadata: Metadata = {
  title: 'Accedi con codice',
  description: 'Accedi al tuo account Ebartex con un codice monouso',
};

interface LoginCodePageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginCodePage({ searchParams }: LoginCodePageProps) {
  const session = await getSession();
  const params = await searchParams;
  const redirectTo = sanitizeRedirect(params.redirect ?? null);

  if (session) redirect(redirectTo);

  return <LoginCodeView redirect={params.redirect ?? ''} />;
}
