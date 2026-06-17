import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/components/layout/AuthCard';
import { AUTH_APPLE_BUTTON, AUTH_LINK, AUTH_MUTED_TEXT } from '@/components/layout/auth-styles';
import { config } from '@/lib/config';

export const metadata: Metadata = { title: 'Registrati' };

/**
 * MVP: la registrazione (multi-step, verifica email) resta sul sito principale.
 * Grazie all'SSO cross-subdomain, dopo la registrazione l'utente torna qui già loggato.
 */
export default function RegistratiPage() {
  const registerUrl = `${config.app.mainSiteUrl}/registrati`;

  return (
    <AuthCard title="Crea il tuo account Ebartex">
      <div className="flex flex-col items-center gap-4 text-center">
        <p className={`text-[14px] leading-relaxed ${AUTH_MUTED_TEXT}`}>
          La registrazione avviene sul sito principale. Al termine torna sui Tornei: sarai
          riconosciuto automaticamente.
        </p>
        <a href={registerUrl} className={`${AUTH_APPLE_BUTTON} inline-block text-center no-underline`}>
          Registrati su Ebartex
        </a>
        <p className={`pt-2 ${AUTH_MUTED_TEXT}`}>
          Hai già un account?{' '}
          <Link href="/login?accesso=1" className={`text-[14px] font-semibold ${AUTH_LINK}`}>
            Accedi
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
