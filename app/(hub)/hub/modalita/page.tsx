import { redirect } from 'next/navigation';
import { DEFAULT_TOURNAMENTS_PATH } from '@/lib/constants/tournament-defaults';

/** Route legacy: reindirizza alla dashboard tornei. */
export default function ModalitaLegacyPage() {
  redirect(DEFAULT_TOURNAMENTS_PATH);
}
