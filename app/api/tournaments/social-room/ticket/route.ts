import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/auth/session';
import { config } from '@/lib/config';
import { readBoundedResponseJson } from '@/lib/security/bounded-response';
import { privateJson } from '@/lib/security/private-json';
import { isSameOriginMutation } from '@/lib/security/request-origin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_TICKET_RESPONSE_BYTES = 64 * 1024;
const MAX_TICKET_CHARS = 2_048;
const MAX_TICKET_TTL_SECONDS = 24 * 60 * 60;

/** Emette il ticket WS Piazza senza esporre il bearer al browser. */
export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOriginMutation(request, config.app.siteUrl)) {
    return privateJson({ error: 'cross-site request rejected' }, { status: 403 });
  }

  const token = await getAccessToken();
  if (!token) return privateJson({ error: 'unauthorized' }, { status: 401 });
  if (!config.api.tournamentsBaseURL) {
    return privateJson({ error: 'service unavailable' }, { status: 503 });
  }

  try {
    const upstream = await fetch(
      new URL('/api/tournaments/social-room/ticket', config.api.tournamentsBaseURL),
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          'Accept-Encoding': 'identity',
        },
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(config.api.timeout),
      },
    );
    const body = await readBoundedResponseJson(upstream, MAX_TICKET_RESPONSE_BYTES);
    if (!upstream.ok) {
      // Gli errori upstream non devono mai diventare un canale per dati extra.
      return privateJson({ error: 'ticket unavailable' }, { status: upstream.status });
    }
    const capability = readTicketResponse(body);
    if (!capability) return privateJson({ error: 'invalid ticket response' }, { status: 502 });
    return privateJson(capability, { status: upstream.status });
  } catch {
    return privateJson({ error: 'service unavailable' }, { status: 502 });
  }
}

function readTicketResponse(value: unknown): {
  ticket: string;
  expires_in_seconds: number;
} | null {
  if (!isRecord(value)) return null;
  if (!hasOnlyKeys(value, ['ticket', 'expires_in_seconds'])) return null;
  const ticket = value.ticket;
  const expires = value.expires_in_seconds;
  if (
    typeof ticket !== 'string' ||
    ticket.length === 0 ||
    ticket.length > MAX_TICKET_CHARS ||
    !/^[\x21-\x7e]+$/u.test(ticket) ||
    typeof expires !== 'number' ||
    !Number.isSafeInteger(expires) ||
    expires < 1 ||
    expires > MAX_TICKET_TTL_SECONDS
  ) return null;
  return { ticket, expires_in_seconds: expires };
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const allowed = new Set(keys);
  return Object.keys(value).every((key) => allowed.has(key));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
