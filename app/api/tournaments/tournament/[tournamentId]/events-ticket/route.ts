import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/auth/session';
import { config } from '@/lib/config';
import { isSameOriginMutation } from '@/lib/security/request-origin';
import { readBoundedResponseJson } from '@/lib/security/bounded-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
  context: { params: Promise<{ tournamentId: string }> },
): Promise<NextResponse> {
  if (!isSameOriginMutation(request, config.app.siteUrl)) {
    return NextResponse.json({ error: 'cross-site request rejected' }, { status: 403 });
  }
  const { tournamentId } = await context.params;
  if (!UUID.test(tournamentId)) {
    return NextResponse.json({ error: 'invalid tournament' }, { status: 400 });
  }
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!config.api.tournamentsBaseURL) {
    return NextResponse.json({ error: 'service unavailable' }, { status: 503 });
  }
  try {
    const url = new URL(
      `/api/tournaments/tournament/${encodeURIComponent(tournamentId)}/events-ticket`,
      config.api.tournamentsBaseURL,
    );
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Accept-Encoding': 'identity',
      },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(config.api.timeout),
    });
    const body = await readBoundedResponseJson(upstream, 128 * 1024).catch(() => ({}));
    return NextResponse.json(body, {
      status: upstream.status,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'service unavailable' }, { status: 502 });
  }
}
