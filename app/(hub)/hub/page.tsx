import { redirect } from 'next/navigation';
import { DEFAULT_TOURNAMENTS_PATH } from '@/lib/constants/tournament-defaults';

/** Legacy hub: reindirizza alla dashboard tornei con selezione di default. */
export default function HubPage() {
  redirect(DEFAULT_TOURNAMENTS_PATH);
}
