import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchMeiliJsonWithTimeout,
  MeiliFetchError,
} from '@/lib/search/search-request-utils';

describe('Meilisearch response deadline', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('aborts a body that stalls after response headers', async () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({
      pull: () => new Promise<void>(() => undefined),
      cancel,
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status: 200 })));

    const pending = fetchMeiliJsonWithTimeout(
      'https://search.internal.test/indexes/cards/search',
      { method: 'POST', body: '{}' },
      1024,
      50,
    );
    const rejection = expect(pending).rejects.toBeInstanceOf(MeiliFetchError);

    await vi.advanceTimersByTimeAsync(51);
    await rejection;
    expect(cancel).toHaveBeenCalled();
  });
});
