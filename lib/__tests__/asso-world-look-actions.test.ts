import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchLook: vi.fn(),
  getSession: vi.fn(),
  updateLook: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth/session', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/data/asso-world-look-client', () => ({
  fetchAssoWorldLook: mocks.fetchLook,
  updateAssoWorldLook: mocks.updateLook,
}));

import {
  getAssoWorldLookAction,
  saveAssoWorldLookAction,
} from '@/actions/asso-world-look';

describe('azioni Server Action look Asso World', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('richiede una sessione per lettura e scrittura', async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(getAssoWorldLookAction()).resolves.toEqual({
      ok: false,
      error: 'Sessione non valida.',
    });
    await expect(saveAssoWorldLookAction({ hair: 'm1', outfit: 'tank' })).resolves.toEqual({
      ok: false,
      error: 'Sessione non valida.',
    });
    expect(mocks.fetchLook).not.toHaveBeenCalled();
    expect(mocks.updateLook).not.toHaveBeenCalled();
  });

  it('valida con zod prima di salvare e propaga il look confermato dal backend', async () => {
    await expect(saveAssoWorldLookAction({ hair: 'm1', outfit: 'poncho' })).resolves.toEqual({
      ok: false,
      error: 'Personalizzazione Asso World non valida.',
    });
    expect(mocks.updateLook).not.toHaveBeenCalled();

    const saved = { hair: 'f2', outfit: 'jacket' };
    mocks.updateLook.mockResolvedValue(saved);
    await expect(saveAssoWorldLookAction(saved)).resolves.toEqual({ ok: true, data: saved });
    expect(mocks.updateLook).toHaveBeenCalledWith(saved);
  });

  it('non simula un salvataggio quando il data client fallisce', async () => {
    mocks.updateLook.mockRejectedValue(new Error('Servizio Tornei non disponibile.'));

    await expect(saveAssoWorldLookAction({ hair: 'm2', outfit: 'shirt' })).resolves.toEqual({
      ok: false,
      error: 'Servizio Tornei non disponibile.',
    });
  });
});
