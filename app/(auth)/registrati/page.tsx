import type { Metadata } from 'next';
import { RegistratiView } from '@/app/(auth)/registrati/registrati-view';

export const metadata: Metadata = {
  title: 'Registrati',
  description: 'Crea il tuo account Ebartex',
};

/**
 * La registrazione (multi-step, verifica email) resta sul sito principale.
 * Al ritorno l'utente effettua qui il login: nessun cookie o token di sessione
 * viene condiviso tra sottodomini.
 */
export default function RegistratiPage() {
  return <RegistratiView />;
}
