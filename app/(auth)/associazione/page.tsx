import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { AssociazioneView } from './associazione-view';

export const metadata: Metadata = { title: 'Diventa associato' };

/** Onboarding tessera socio — mostrato al primo accesso (gate client lato tornei). */
export default async function AssociazionePage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return <AssociazioneView email={session.user.email} name={session.user.name} />;
}
