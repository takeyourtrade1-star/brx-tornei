import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { TesseraView } from './tessera-view';

export const metadata: Metadata = { title: 'La mia tessera' };

/** Profilo: la tessera socio (mock, persistita in localStorage). */
export default async function TesseraPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return <TesseraView />;
}
