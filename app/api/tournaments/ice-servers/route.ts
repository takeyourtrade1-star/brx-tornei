import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getAccessToken } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Proxy ICE servers dal Tournament Service (TURN con credenziali ephemeral).
 * Inoltra session_id così il backend risolve with_friend → force_relay.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const base = config.api.tournamentsBaseURL;
  if (!base) {
    return NextResponse.json({ data: null, fallback: true }, { status: 200 });
  }

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const upstream = new URL('/api/v1/signaling/ice-servers', base);
    const sessionId = req.nextUrl.searchParams.get('session_id');
    if (sessionId) upstream.searchParams.set('session_id', sessionId);
    const res = await fetch(upstream.toString(), {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(config.api.timeout),
    });
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'upstream unavailable' }, { status: 502 });
  }
}
