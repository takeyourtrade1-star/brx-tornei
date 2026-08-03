import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getAccessToken } from '@/lib/auth/session';
import { readBoundedResponseJson } from '@/lib/security/bounded-response';
import { privateJson } from '@/lib/security/private-json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Proxy ICE servers dal Tournament Service (TURN con credenziali ephemeral).
 * Inoltra session_id così il backend risolve with_friend → force_relay.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const base = config.api.tournamentsBaseURL;
  if (!base) {
    return privateJson({ error: 'service unavailable' }, { status: 503 });
  }

  const token = await getAccessToken();
  if (!token) {
    return privateJson({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const upstream = new URL('/api/v1/signaling/ice-servers', base);
    const sessionId = req.nextUrl.searchParams.get('session_id');
    if (Buffer.byteLength(req.nextUrl.search, 'utf8') > 1024) {
      return privateJson({ error: 'query too large' }, { status: 414 });
    }
    if (sessionId) upstream.searchParams.set('session_id', sessionId);
    const res = await fetch(upstream.toString(), {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Accept-Encoding': 'identity',
      },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(config.api.timeout),
    });
    const body = await readBoundedResponseJson(res, 256 * 1024).catch(() => ({}));
    return privateJson(body, { status: res.status });
  } catch {
    return privateJson({ error: 'upstream unavailable' }, { status: 502 });
  }
}
