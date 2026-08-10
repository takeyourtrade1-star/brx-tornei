import { NextResponse } from 'next/server';
import { proxyGapRecordingQuery } from '@/lib/gap-recording/bff-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  context: { params: Promise<{ matchId: string }> },
): Promise<NextResponse> {
  const { matchId } = await context.params;
  if (!UUID.test(matchId)) {
    return NextResponse.json({ error: 'invalid match' }, { status: 400 });
  }
  return proxyGapRecordingQuery(
    `/api/v1/matches/${encodeURIComponent(matchId)}/gap-recordings/peer-review`,
  );
}
