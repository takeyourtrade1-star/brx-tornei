import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  canUseFallback: vi.fn(),
  fetchMyGamertag: vi.fn(),
  fetchPreferences: vi.fn(),
  getSession: vi.fn(),
  setDnd: vi.fn(),
  setVisibility: vi.fn(),
  updateDnd: vi.fn(),
  updateVisibility: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth/session', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/data/player-api-client', () => ({
  fetchMyGamertag: mocks.fetchMyGamertag,
}));
vi.mock('@/lib/data/social-fallback-policy', () => ({
  canUseSocialMockForError: mocks.canUseFallback,
}));
vi.mock('@/lib/data/social-preferences-client', () => ({
  fetchSocialPreferences: mocks.fetchPreferences,
  updateSocialDnd: mocks.updateDnd,
  updateSocialEbartexVisibility: mocks.updateVisibility,
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

describe('preferenze social persistenti', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: { id: 'user-1', username: 'market_user' },
    });
    mocks.canUseFallback.mockReturnValue(false);
  });

  it('legge e aggiorna le preferenze tramite il servizio Tornei', async () => {
    const initial = { dndUntil: null, showEbartexProfile: true };
    const dnd = { dndUntil: 2_000_000_000_000, showEbartexProfile: true };
    const hidden = { ...dnd, showEbartexProfile: false };
    mocks.fetchPreferences.mockResolvedValue(initial);
    mocks.updateDnd.mockResolvedValue(dnd);
    mocks.updateVisibility.mockResolvedValue(hidden);

    await expect(getSocialPreferencesAction()).resolves.toEqual({ ok: true, data: initial });
    await expect(
      setSocialDndAction({ active: true, durationMinutes: 60 }),
    ).resolves.toEqual({ ok: true, data: dnd });
    await expect(
      setSocialEbartexVisibilityAction({ visible: false }),
    ).resolves.toEqual({ ok: true, data: hidden });
    expect(mocks.updateDnd).toHaveBeenCalledWith(true, 60, 'market_user');
    expect(mocks.updateVisibility).toHaveBeenCalledWith(false, 'market_user');
    expect(mocks.setDnd).not.toHaveBeenCalled();
    expect(mocks.setVisibility).not.toHaveBeenCalled();
  });

  it('fallisce senza simulare un salvataggio quando il servizio non risponde', async () => {
    mocks.fetchPreferences.mockRejectedValue(new Error('Servizio Tornei non disponibile.'));

    await expect(getSocialPreferencesAction()).resolves.toEqual({
      ok: false,
      error: 'Servizio Tornei non disponibile.',
    });
    expect(mocks.fetchMyGamertag).not.toHaveBeenCalled();
    expect(mocks.setDnd).not.toHaveBeenCalled();
  });

  it('usa il mock solo quando il fallback di sviluppo è autorizzato', async () => {
    mocks.updateVisibility.mockRejectedValue(new Error('API non configurata'));
    mocks.canUseFallback.mockReturnValue(true);
    mocks.fetchMyGamertag.mockResolvedValue('Player_One');

    await expect(
      setSocialEbartexVisibilityAction({ visible: false }),
    ).resolves.toEqual({
      ok: true,
      data: { dndUntil: null, showEbartexProfile: true },
    });
    expect(mocks.setVisibility).toHaveBeenCalledWith('Player_One', false);
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
