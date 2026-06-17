import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { LoginForm } from '@/components/feature/auth/login-form';
import { AuthCard } from '@/components/layout/AuthCard';
import { AUTH_LINK, AUTH_MUTED_TEXT } from '@/components/layout/auth-styles';
import { getSession } from '@/lib/auth/session';
import { sanitizeRedirect } from '@/lib/auth/redirect';
import { config } from '@/lib/config';

export const metadata: Metadata = { title: 'Accedi' };

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string; accesso?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();
  const params = await searchParams;
  const redirectTo = sanitizeRedirect(params.redirect ?? null);

  if (session) redirect(redirectTo);

  return (
    <AuthCard title="Accedi">
      <LoginForm
        redirect={params.redirect ?? ''}
        recoverUrl={`${config.app.mainSiteUrl}/recupera-credenziali`}
      />
      <div className="mt-8 border-t border-gray-200/50 pt-6 text-center">
        <p className={AUTH_MUTED_TEXT}>
          Non hai un account?{' '}
          <Link href="/registrati" className={`text-[14px] font-semibold ${AUTH_LINK}`}>
            Registrati
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
