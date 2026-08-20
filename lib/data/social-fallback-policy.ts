import 'server-only';

import { config } from '@/lib/config';
import { TournamentApiError } from '@/lib/data/tournament-api-client';

export function canUseSocialMockForStatus(status: number): boolean {
  return config.features.ephemeralSocial && (status === 404 || status >= 500);
}

export function canUseSocialMockForError(error: unknown): boolean {
  return (
    config.features.ephemeralSocial &&
    error instanceof TournamentApiError &&
    (error.code === 'API_NOT_CONFIGURED' || error.status === 404 || error.status >= 500)
  );
}
