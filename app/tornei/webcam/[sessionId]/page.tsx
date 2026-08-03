import type { Metadata } from 'next';
import { WebcamPhonePublisher } from '@/components/feature/tornei/webcam-phone-publisher';

export const metadata: Metadata = { title: 'Webcam · Ebartex Tornei' };

/** Public phone page. The one-use claim is read client-side from the fragment. */
export default async function WebcamPhonePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <WebcamPhonePublisher sessionId={sessionId} />;
}
