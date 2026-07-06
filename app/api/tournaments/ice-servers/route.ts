import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getAccessToken } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Proxy ICE servers dal Tournament Service (TURN con credenziali ephemeral). */
export async function GET(): Promise<NextResponse> {
  const base = config.api.tournamentsBaseURL;
  if (!base) {
    return NextResponse.json({ data: null, fallback: true }, { status: 200 });
  }

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch(`${base}/api/v1/signaling/ice-servers`, {
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
