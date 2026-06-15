import type { Metadata } from 'next';
import { WebcamPhonePublisher } from '@/components/feature/tornei/webcam-phone-publisher';

export const metadata: Metadata = { title: 'Webcam · Ebartex Tornei' };

/**
 * Pagina aperta dal telefono dopo la scansione del QR mostrato sul PC.
 * Pubblica (route pubblica, vedi middleware): non richiede login sul telefono.
 */
export default async function WebcamPhonePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <WebcamPhonePublisher sessionId={sessionId} />;
}
