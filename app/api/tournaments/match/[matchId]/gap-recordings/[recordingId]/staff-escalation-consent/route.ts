import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { proxyGapRecordingMutation } from '@/lib/gap-recording/bff-proxy';
import { readBoundedJson } from '@/lib/security/bounded-json';
import { isSameOriginMutation } from '@/lib/security/request-origin';
import { gapStaffEscalationConsentInputSchema } from '@/lib/validations/gap-recording';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function ids(context: { params: Promise<{ matchId: string; recordingId: string }> }) {
  const values = await context.params;
  return UUID.test(values.matchId) && UUID.test(values.recordingId) ? values : null;
}

/**
 * Consenso del proprietario all'invio del proprio video allo staff:
 * soltanto col consenso di entrambi i giocatori la disputa diventa
 * visibile nella sezione Tornei del back office.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ matchId: string; recordingId: string }> },
): Promise<NextResponse> {
  if (!isSameOriginMutation(request, config.app.siteUrl)) {
    return NextResponse.json({ error: 'cross-site request rejected' }, { status: 403 });
  }
  const values = await ids(context);
  if (!values) return NextResponse.json({ error: 'invalid recording' }, { status: 400 });
  const raw = await readBoundedJson(request, 4 * 1024);
  if (!raw.ok) return NextResponse.json({ error: 'invalid payload' }, { status: raw.status });
  const parsed = gapStaffEscalationConsentInputSchema.safeParse(raw.value);
  if (!parsed.success) return NextResponse.json({ error: 'invalid consent' }, { status: 400 });
  return proxyGapRecordingMutation(
    `/api/v1/matches/${encodeURIComponent(values.matchId)}/gap-recordings/${encodeURIComponent(values.recordingId)}/staff-escalation-consent`,
    parsed.data,
  );
}
