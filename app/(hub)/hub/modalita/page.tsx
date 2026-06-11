import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Route legacy del primo scaffold: la selezione modalità ora vive in /hub#modalita
 * (singola pagina, come da mockup). Mantenuta solo come redirect.
 */
export default async function ModalitaRedirect({ searchParams }: PageProps) {
  const params = await searchParams;
  const format = typeof params.format === 'string' ? params.format : '';
  redirect(format ? `/hub?format=${format}#modalita` : '/hub');
}
