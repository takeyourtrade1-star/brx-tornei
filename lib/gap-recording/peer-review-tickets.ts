import { publicConfig } from '@/lib/public-config';
import {
  gapViewTicketsResponseSchema,
  type GapPeerDetail,
} from '@/lib/validations/gap-recording';

export interface GapPeerClipView {
  clipId: string;
  sequence: number;
  contentType: string;
  byteLength: number;
  url: string;
  expiresAt: string;
}

function authorizedMediaUrl(value: string): URL {
  const mediaUrl = new URL(value);
  const isLoopbackDevelopment =
    process.env.NODE_ENV !== 'production' &&
    mediaUrl.protocol === 'http:' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(mediaUrl.hostname.toLowerCase());
  if (
    mediaUrl.origin !== publicConfig.storage.matchGapUploadOrigin ||
    (mediaUrl.protocol !== 'https:' && !isLoopbackDevelopment) ||
    mediaUrl.username ||
    mediaUrl.password
  ) throw new Error('Origine video non autorizzata.');
  return mediaUrl;
}

export async function loadGapPeerClipViews(
  base: string,
  clips: GapPeerDetail['clips'],
  request: typeof fetch = fetch,
): Promise<GapPeerClipView[]> {
  const response = await request(`${base}/clips/view-tickets`, {
    method: 'POST',
    cache: 'no-store',
    credentials: 'same-origin',
    signal: AbortSignal.timeout(15_000),
  });
  const batch = gapViewTicketsResponseSchema.safeParse(
    await response.json().catch(() => ({})),
  );
  if (!response.ok || !batch.success) throw new Error('Accesso al video negato.');
  const tickets = new Map(
    batch.data.data.tickets.map((ticket) => [ticket.clip_id, ticket]),
  );
  if (tickets.size !== clips.length) throw new Error('Capability video incomplete.');
  return clips.map((clip) => {
    const ticket = tickets.get(clip.clip_id);
    if (
      !ticket ||
      ticket.content_type !== clip.content_type ||
      ticket.byte_length !== clip.byte_length
    ) throw new Error('Capability video non coerente.');
    return {
      clipId: clip.clip_id,
      sequence: clip.sequence,
      contentType: ticket.content_type,
      byteLength: ticket.byte_length,
      url: authorizedMediaUrl(ticket.url).toString(),
      expiresAt: ticket.expires_at,
    };
  });
}
