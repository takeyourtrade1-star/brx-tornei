import type { Metadata } from 'next';
import { RegistratiView } from '@/app/(auth)/registrati/registrati-view';

export const metadata: Metadata = {
  title: 'Registrati',
  description: 'Crea il tuo account Ebartex',
};

/**
 * MVP: la registrazione (multi-step, verifica email) resta sul sito principale.
 * Grazie all'SSO cross-subdomain, dopo la registrazione l'utente torna qui già loggato.
 */
export default function RegistratiPage() {
  return <RegistratiView />;
}
