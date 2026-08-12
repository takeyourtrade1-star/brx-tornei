import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  proxy: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/config', () => ({
  config: { app: { siteUrl: 'https://tornei.ebartex.com' } },
}));
vi.mock('@/lib/gap-recording/bff-proxy', () => ({
  proxyGapRecordingMutation: mocks.proxy,
}));

import { POST as initialize } from '../../app/api/tournaments/match/[matchId]/gap-recordings/route';
import { POST as complete } from '../../app/api/tournaments/match/[matchId]/gap-recordings/[recordingId]/complete/route';

const MATCH_ID = '6f069abc-a25d-4e99-b63c-473b507021af';
const RECORDING_ID = 'd19d2244-05d9-4308-9901-5d5593f0802c';

function request(body: unknown, origin = 'https://tornei.ebartex.com') {
  return new Request('https://tornei.ebartex.com/api/tournaments/match/upload', {
    method: 'POST',
    headers: {
      Origin: origin,
      'Sec-Fetch-Site': origin.includes('attacker') ? 'cross-site' : 'same-origin',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

function validManifest() {
  return {
    client_incident_id: '00add584-fe7d-4766-9a97-b2e3f5b6152a',
    webcam_session_id: '0ffb5e08-0385-4312-ab9f-f8e7bc799d2e',
    detected_at: '2026-08-10T12:00:20.000Z',
    capture_started_at: '2026-08-10T12:00:10.000Z',
    capture_ended_at: '2026-08-10T12:00:30.000Z',
    capture_capped: false,
    interrupted: false,
    upload_consented_at: '2026-08-10T12:00:30.000Z',
    upload_consent_version: 'peer-gap-review-v1',
    temporary_storage_acknowledged: true,
    opponent_review_acknowledged: true,
    clips: [{
      client_clip_id: '9ae60030-3c6b-46a7-8e30-45eab3e959e6',
      sequence: 0,
      started_at: '2026-08-10T12:00:10.000Z',
      ended_at: '2026-08-10T12:00:15.000Z',
      content_type: 'video/webm',
      byte_length: 3,
      sha256: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    }],
  };
}

describe('match-gap recording BFF boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.proxy.mockResolvedValue(Response.json({ data: {} }, { status: 201 }));
  });

  it('rejects cross-site init before parsing or proxying', async () => {
    const response = await initialize(
      request(validManifest(), 'https://attacker.example'),
      { params: Promise.resolve({ matchId: MATCH_ID }) },
    );
    expect(response.status).toBe(403);
    expect(mocks.proxy).not.toHaveBeenCalled();
  });

  it('rejects an oversized manifest before proxying', async () => {
    const response = await initialize(
      request({ ...validManifest(), padding: 'x'.repeat(70 * 1024) }),
      { params: Promise.resolve({ matchId: MATCH_ID }) },
    );
    expect(response.status).toBe(413);
    expect(mocks.proxy).not.toHaveBeenCalled();
  });

  it('proxies only the validated same-origin manifest to the fixed upstream path', async () => {
    const body = validManifest();
    const response = await initialize(request(body), {
      params: Promise.resolve({ matchId: MATCH_ID }),
    });
    expect(response.status).toBe(201);
    expect(mocks.proxy).toHaveBeenCalledWith(
      `/api/v1/matches/${MATCH_ID}/gap-recordings`,
      body,
    );
  });

  it('keeps manifests from already-open legacy tabs compatible', async () => {
    const body = validManifest();
    const response = await initialize(request(body), {
      params: Promise.resolve({ matchId: MATCH_ID }),
    });

    expect(response.status).toBe(201);
    expect(mocks.proxy).toHaveBeenCalledWith(
      `/api/v1/matches/${MATCH_ID}/gap-recordings`,
      expect.not.objectContaining({ upload_transport: expect.anything() }),
    );
  });

  it('validates both path UUIDs and CSRF on finalize', async () => {
    const invalid = await complete(request(undefined), {
      params: Promise.resolve({ matchId: MATCH_ID, recordingId: 'not-a-uuid' }),
    });
    expect(invalid.status).toBe(400);
    const crossSite = await complete(
      request(undefined, 'https://attacker.example'),
      { params: Promise.resolve({ matchId: MATCH_ID, recordingId: RECORDING_ID }) },
    );
    expect(crossSite.status).toBe(403);
    expect(mocks.proxy).not.toHaveBeenCalled();
  });
});
