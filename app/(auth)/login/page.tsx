import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getRefreshToken, getSession } from '@/lib/auth/session';
import { sanitizeNext } from '@/lib/auth/next-path';
import { LoginForm } from '@/components/feature/auth/login-form';
import { config } from '@/lib/config';

export const metadata: Metadata = { title: 'Accedi' };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const next = sanitizeNext(typeof params.next === 'string' ? params.next : null);

  const session = await getSession();
  if (session) redirect(next);

  // Cookie refresh da Ebartex principale: tenta SSO prima del form.
  const refresh = await getRefreshToken();
  if (refresh) {
    redirect(`/auth/bridge?next=${encodeURIComponent(next)}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <LoginForm next={next} />
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
