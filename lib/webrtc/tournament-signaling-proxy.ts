import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { config } from '@/lib/config';
import { getAccessToken } from '@/lib/auth/session';
import {
  appendSignalingMessage,
  listSignalingMessages,
} from '@/lib/webrtc/signaling-store';
import { readBoundedResponseJson } from '@/lib/security/bounded-response';
import { readBoundedJson } from '@/lib/security/bounded-json';
import { privateJson } from '@/lib/security/private-json';

const MAX_SIGNAL_BODY_BYTES = 65 * 1024;

export type SignalRole = 'host' | 'guest';
export type SignalKind = 'offer' | 'answer' | 'candidate' | 'bye' | 'offline';

export interface SignalingPostBody {
  from: SignalRole;
  kind: SignalKind;
  data?: unknown;
}

const signalingPostSchema = z.object({
  from: z.enum(['host', 'guest']),
  kind: z.enum(['offer', 'answer', 'candidate', 'bye', 'offline']),
  data: z.unknown().optional(),
}).strict();

/** Inoltra signaling al Tournament Service o usa store locale in dev. */
export async function handleTournamentSignalingGet(
  sessionId: string,
  role: SignalRole,
  since: number,
): Promise<NextResponse> {
  const base = config.api.tournamentsBaseURL;
  if (base) {
    const token = await getAccessToken();
    if (!token) {
      return privateJson({ error: 'unauthorized' }, { status: 401 });
    }
    try {
      const url = new URL(
        `/api/v1/signaling/${encodeURIComponent(sessionId)}/messages`,
        base,
      );
      url.searchParams.set('role', role);
      url.searchParams.set('since', String(since));
      const res = await fetch(url.toString(), {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          'Accept-Encoding': 'identity',
        },
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(config.api.timeout),
      });
      const body = await readBoundedResponseJson(res, 1024 * 1024).catch(() => ({}));
      return privateJson(body, { status: res.status });
    } catch {
      return privateJson({ error: 'upstream unavailable' }, { status: 502 });
    }
  }

  if (process.env.NODE_ENV !== 'development') {
    return privateJson({ error: 'signaling service unavailable' }, { status: 503 });
  }
  const { exists, messages } = await listSignalingMessages(
    sessionId,
    role,
    since,
  );
  if (!exists) return privateJson({ exists: false, messages: [] });
  return privateJson({ exists: true, messages });
}

export async function handleTournamentSignalingPost(
  sessionId: string,
  body: SignalingPostBody,
): Promise<NextResponse> {
  const base = config.api.tournamentsBaseURL;
  if (base) {
    const token = await getAccessToken();
    if (!token) {
      return privateJson({ error: 'unauthorized' }, { status: 401 });
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
            'Accept-Encoding': 'identity',
          },
          body: JSON.stringify(body),
          cache: 'no-store',
          redirect: 'error',
          signal: AbortSignal.timeout(config.api.timeout),
        },
      );
      const payload = await readBoundedResponseJson(res, 256 * 1024).catch(() => ({}));
      return privateJson(payload, { status: res.status });
    } catch {
      return privateJson({ error: 'upstream unavailable' }, { status: 502 });
    }
  }

  if (process.env.NODE_ENV !== 'development') {
    return privateJson({ error: 'signaling service unavailable' }, { status: 503 });
  }
  const { seq } = await appendSignalingMessage(
    sessionId,
    body.from,
    body.kind,
    body.data ?? null,
  );
  return privateJson({ ok: true, seq });
}

export async function parseSignalingPostBody(
  req: NextRequest,
): Promise<
  | { ok: true; value: SignalingPostBody }
  | { ok: false; status: 400 | 408 | 413 }
> {
  const decoded = await readBoundedJson(req, MAX_SIGNAL_BODY_BYTES);
  if (!decoded.ok) return decoded;
  const parsed = signalingPostSchema.safeParse(decoded.value);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, status: 400 };
}
