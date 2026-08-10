import type { GapClipRecord } from '@/lib/gap-recording/types';
import { publicConfig } from '@/lib/public-config';

const UPLOAD_CONCURRENCY = 2;

export interface GapUploadTicket {
  url: string;
  fields: Record<string, string>;
  transport: 'multipart' | 'raw';
}

async function uploadClip(clip: GapClipRecord, ticket: GapUploadTicket): Promise<void> {
  const uploadUrl = new URL(ticket.url);
  const isLoopbackRawUpload = process.env.NODE_ENV !== 'production' &&
    ticket.transport === 'raw' && uploadUrl.protocol === 'http:' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(uploadUrl.hostname.toLowerCase());
  if (
    uploadUrl.origin !== publicConfig.storage.matchGapUploadOrigin ||
    (uploadUrl.protocol !== 'https:' && !isLoopbackRawUpload) ||
    uploadUrl.username || uploadUrl.password
  ) {
    throw new Error('Destinazione di upload non autorizzata.');
  }

  let body: BodyInit;
  let headers: Headers | undefined;
  if (ticket.transport === 'raw') {
    const expectedFields = new Set([
      'Content-Type',
      'X-Ebartex-Gap-Checksum',
      'X-Ebartex-Gap-Ticket',
    ]);
    const entries = Object.entries(ticket.fields);
    if (
      !isLoopbackRawUpload ||
      entries.length !== expectedFields.size ||
      entries.some(([key, value]) => !expectedFields.has(key) || !value)
    ) {
      throw new Error('Capability di upload locale non valida.');
    }
    headers = new Headers(ticket.fields);
    body = clip.blob;
  } else {
    const form = new FormData();
    for (const [key, value] of Object.entries(ticket.fields)) form.append(key, value);
    const extension = clip.mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
    form.append('file', clip.blob, `${clip.sequence.toString().padStart(2, '0')}.${extension}`);
    body = form;
  }
  const response = await fetch(ticket.url, {
    method: 'POST',
    headers,
    body,
    cache: 'no-store',
    credentials: 'omit',
    redirect: 'error',
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw new Error('Upload di una clip non riuscito.');
}

export async function uploadGapClipsWithLimit(
  clips: GapClipRecord[],
  tickets: Map<string, GapUploadTicket>,
): Promise<void> {
  let index = 0;
  async function worker() {
    while (index < clips.length) {
      const clip = clips[index];
      index += 1;
      const ticket = tickets.get(clip.id);
      if (!ticket) throw new Error('Capability di upload mancante.');
      await uploadClip(clip, ticket);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(UPLOAD_CONCURRENCY, clips.length) }, () => worker()),
  );
}
