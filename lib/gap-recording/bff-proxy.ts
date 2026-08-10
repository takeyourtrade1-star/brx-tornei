import 'server-only';

import { config } from '@/lib/config';
import { getAccessToken } from '@/lib/auth/session';
import { readBoundedResponseJson } from '@/lib/security/bounded-response';
import { privateJson } from '@/lib/security/private-json';

export async function proxyGapRecordingMutation(
  path: string,
  body?: unknown,
) {
  if (!path.startsWith('/api/v1/matches/')) {
    return privateJson({ error: 'invalid upstream path' }, { status: 500 });
  }
  const token = await getAccessToken();
  if (!token) return privateJson({ error: 'unauthorized' }, { status: 401 });
  if (!config.api.tournamentsBaseURL) {
    return privateJson({ error: 'service unavailable' }, { status: 503 });
  }
  try {
    const response = await fetch(new URL(path, config.api.tournamentsBaseURL), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Accept-Encoding': 'identity',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(config.api.timeout),
    });
    const responseBody = await readBoundedResponseJson(response, 256 * 1024).catch(() => ({}));
    return privateJson(responseBody, { status: response.status });
  } catch {
    return privateJson({ error: 'upstream unavailable' }, { status: 502 });
  }
}
