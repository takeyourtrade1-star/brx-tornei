import { getAccessToken } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Endpoint minimo per misurare la tratta browser -> frontend autenticato. */
export async function GET(): Promise<Response> {
  if (!(await getAccessToken())) {
    return new Response(null, { status: 401 });
  }
  return new Response(null, {
    status: 204,
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
      'Server-Timing': 'probe;dur=0',
    },
  });
}
