import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { proxyGapRecordingMutation } from '@/lib/gap-recording/bff-proxy';
import { readBoundedJson } from '@/lib/security/bounded-json';
import { isSameOriginMutation } from '@/lib/security/request-origin';
import { createGapRecordingSchema } from '@/lib/validations/gap-recording';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
  context: { params: Promise<{ matchId: string }> },
): Promise<NextResponse> {
  if (!isSameOriginMutation(request, config.app.siteUrl)) {
    return NextResponse.json({ error: 'cross-site request rejected' }, { status: 403 });
  }
  const { matchId } = await context.params;
  if (!UUID.test(matchId)) {
    return NextResponse.json({ error: 'invalid match' }, { status: 400 });
  }
  const raw = await readBoundedJson(request, 64 * 1024);
  if (!raw.ok) {
    return NextResponse.json(
      { error: raw.status === 413 ? 'payload too large' : 'invalid payload' },
      { status: raw.status },
    );
  }
  const parsed = createGapRecordingSchema.safeParse(raw.value);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid manifest' }, { status: 400 });
  }
  return proxyGapRecordingMutation(
    `/api/v1/matches/${encodeURIComponent(matchId)}/gap-recordings`,
    parsed.data,
  );
}
