import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getSession } from '@/lib/auth/session';
import { LoginForm } from '@/components/feature/auth/login-form';
import { config } from '@/lib/config';

export const metadata: Metadata = { title: 'Accedi' };

export default async function LoginPage() {
  // Già loggato (anche via bridge SSO) → niente login.
  const session = await getSession();
  if (session) redirect('/hub');

  return (
    <div className="flex flex-col gap-4">
      <LoginForm />
      <p className="text-center text-sm text-white/80">
        Non hai un account?{' '}
        <Link href="/registrati" className="font-semibold text-marquee hover:underline">
          Registrati
        </Link>{' '}
        oppure accedi prima su{' '}
        <a href={config.app.mainSiteUrl} className="font-semibold text-marquee hover:underline">
          Ebartex
        </a>
        : verrai riconosciuto automaticamente.
      </p>
    </div>
  );
}
