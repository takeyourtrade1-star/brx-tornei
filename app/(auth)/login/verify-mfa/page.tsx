import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { VerifyMfaForm } from '@/components/feature/auth/verify-mfa-form';
import { AuthCard } from '@/components/layout/AuthCard';
import { getPreAuthCookie } from '@/lib/auth/pre-auth-cookie';
import { getSession } from '@/lib/auth/session';
import { sanitizeRedirect } from '@/lib/auth/redirect';

export const metadata: Metadata = { title: 'Verifica MFA' };

interface VerifyMfaPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function VerifyMfaPage({ searchParams }: VerifyMfaPageProps) {
  const session = await getSession();
  const params = await searchParams;
  const redirectTo = sanitizeRedirect(params.redirect ?? null);

  if (session) redirect(redirectTo);

  const preAuth = await getPreAuthCookie();
  if (!preAuth) {
    redirect(
      redirectTo !== '/hub'
        ? `/login?accesso=1&redirect=${encodeURIComponent(redirectTo)}`
        : '/login?accesso=1'
    );
  }

  return (
    <AuthCard>
      <VerifyMfaForm redirect={params.redirect ?? ''} />
    </AuthCard>
  );
}
