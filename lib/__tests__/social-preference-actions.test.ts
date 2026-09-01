import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  fetchMyGamertag: vi.fn(),
  setDnd: vi.fn(),
  setVisibility: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/config', () => ({
  config: { features: { ephemeralSocial: false } },
}));
vi.mock('@/lib/auth/session', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/data/player-api-client', () => ({
  fetchMyGamertag: mocks.fetchMyGamertag,
}));
vi.mock('@/lib/data/social-mock-store', () => ({
  getPlayerDndUntil: () => null,
  isEbartexProfileVisible: () => true,
  setPlayerDnd: mocks.setDnd,
  setEbartexProfileVisible: mocks.setVisibility,
}));

import {
  getSocialPreferencesAction,
  setSocialDndAction,
  setSocialEbartexVisibilityAction,
} from '@/actions/social-preferences';

describe('preferenze social fail-closed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('non dichiara successo in produzione senza persistenza autorevole', async () => {
    await expect(getSocialPreferencesAction()).resolves.toMatchObject({ ok: false });
    await expect(setSocialDndAction({ active: true, durationMinutes: 60 }))
      .resolves.toMatchObject({ ok: false });
    await expect(setSocialEbartexVisibilityAction({ visible: false }))
      .resolves.toMatchObject({ ok: false });
    expect(mocks.setDnd).not.toHaveBeenCalled();
    expect(mocks.setVisibility).not.toHaveBeenCalled();
  });

  it('rifiuta input diretti non tipizzati e durate arbitrarie', async () => {
    await expect(setSocialDndAction({ active: 'true', durationMinutes: 60 }))
      .resolves.toEqual({ ok: false, error: 'Preferenza non valida.' });
    await expect(setSocialDndAction({ active: true, durationMinutes: 10_000 }))
      .resolves.toEqual({ ok: false, error: 'Preferenza non valida.' });
    await expect(setSocialEbartexVisibilityAction({ visible: 'false' }))
      .resolves.toEqual({ ok: false, error: 'Preferenza non valida.' });
  });
});
