import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getAccessToken } from '@/lib/auth/session';
import {
  appendSignalingMessage,
  listSignalingMessages,
} from '@/lib/webrtc/signaling-store';

/** Inoltra signaling al Tournament Service o usa store locale in dev. */
export async function handleTournamentSignalingGet(
  sessionId: string,
  role: string,
  since: number,
): Promise<NextResponse> {
  const base = config.api.tournamentsBaseURL;
  if (base) {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    try {
      const url = new URL(
        `/api/v1/signaling/${encodeURIComponent(sessionId)}/messages`,
        base,
      );
      url.searchParams.set('role', role);
      url.searchParams.set('since', String(since));
      const res = await fetch(url.toString(), {
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

  const { exists, messages } = await listSignalingMessages(sessionId, since);
  if (!exists) return NextResponse.json({ exists: false, messages: [] });
  return NextResponse.json({ exists: true, messages });
}

export async function handleTournamentSignalingPost(
  sessionId: string,
  body: { from?: 'host' | 'guest'; kind?: string; data?: unknown },
): Promise<NextResponse> {
  if (!body.from || !body.kind) {
    return NextResponse.json({ error: 'missing from/kind' }, { status: 400 });
  }

  const base = config.api.tournamentsBaseURL;
  if (base) {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    try {
      const res = await fetch(
        `${base}/api/v1/signaling/${encodeURIComponent(sessionId)}/messages`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
          cache: 'no-store',
          signal: AbortSignal.timeout(config.api.timeout),
        },
      );
      const payload = await res.json().catch(() => ({}));
      return NextResponse.json(payload, { status: res.status });
    } catch {
      return NextResponse.json({ error: 'upstream unavailable' }, { status: 502 });
    }
  }

  const { seq } = await appendSignalingMessage(
    sessionId,
    body.from,
    body.kind,
    body.data ?? null,
  );
  return NextResponse.json({ ok: true, seq });
}

export async function parseSignalingPostBody(
  req: NextRequest,
): Promise<{ from?: 'host' | 'guest'; kind?: string; data?: unknown }> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
