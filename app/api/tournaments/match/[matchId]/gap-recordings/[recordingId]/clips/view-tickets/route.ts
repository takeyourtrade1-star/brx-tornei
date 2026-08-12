import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { proxyGapRecordingMutation } from '@/lib/gap-recording/bff-proxy';
import { isSameOriginMutation } from '@/lib/security/request-origin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
  context: { params: Promise<{ matchId: string; recordingId: string }> },
): Promise<NextResponse> {
  if (!isSameOriginMutation(request, config.app.siteUrl)) {
    return NextResponse.json({ error: 'cross-site request rejected' }, { status: 403 });
  }
  const { matchId, recordingId } = await context.params;
  if (!UUID.test(matchId) || !UUID.test(recordingId)) {
    return NextResponse.json({ error: 'invalid recording' }, { status: 400 });
  }
  return proxyGapRecordingMutation(
    `/api/v1/matches/${encodeURIComponent(matchId)}/gap-recordings/${encodeURIComponent(recordingId)}/clips/view-tickets`,
  );
}
