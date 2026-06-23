import { redirect } from 'next/navigation';
import { getAccessToken } from '@/lib/auth/session';
import { DEFAULT_TOURNAMENTS_PATH } from '@/lib/constants/tournament-defaults';

/** Root: smista in base alla sessione. Il middleware gestisce già il bridge SSO. */
export default async function HomePage() {
  const token = await getAccessToken();
  redirect(token ? DEFAULT_TOURNAMENTS_PATH : '/login');
}
