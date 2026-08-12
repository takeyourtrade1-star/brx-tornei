import {
  gapUploadCompleteResponseSchema,
  gapUploadInitResponseSchema,
  type CreateGapRecordingInput,
} from '@/lib/validations/gap-recording';

export class TerminalGapUploadError extends Error {
  constructor(message: string, readonly discardLocal = false) {
    super(message);
    this.name = 'TerminalGapUploadError';
  }
}

function throwForUploadResponse(response: Response, operation: 'init' | 'complete'): void {
  if (response.status === 410) {
    throw new TerminalGapUploadError('La finestra di conservazione è scaduta.', true);
  }
  if (response.status === 409) {
    throw new TerminalGapUploadError('La finestra di upload non è più disponibile.');
  }
  if (response.status >= 400 && response.status < 500 &&
    response.status !== 408 && response.status !== 429) {
    throw new TerminalGapUploadError(
      operation === 'init'
        ? 'La registrazione locale non è valida per il caricamento.'
        : 'Il caricamento non può essere finalizzato.',
    );
  }
  if (!response.ok) {
    throw new Error(
      operation === 'init'
        ? 'Impossibile preparare il caricamento protetto.'
        : 'Verifica del caricamento non riuscita.',
    );
  }
}

export async function initGapUpload(matchId: string, body: CreateGapRecordingInput) {
  const response = await fetch(
    `/api/tournaments/match/${encodeURIComponent(matchId)}/gap-recordings`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      credentials: 'same-origin',
      signal: AbortSignal.timeout(30_000),
    },
  );
  const json = await response.json().catch(() => ({}));
  throwForUploadResponse(response, 'init');
  const parsed = gapUploadInitResponseSchema.safeParse(json);
  if (!parsed.success) throw new TerminalGapUploadError('Risposta di upload non valida.');
  return parsed.data.data;
}

export async function completeGapUpload(matchId: string, recordingId: string): Promise<void> {
  const response = await fetch(
    `/api/tournaments/match/${encodeURIComponent(matchId)}/gap-recordings/${encodeURIComponent(recordingId)}/complete`,
    {
      method: 'POST',
      cache: 'no-store',
      credentials: 'same-origin',
      signal: AbortSignal.timeout(30_000),
    },
  );
  const json = await response.json().catch(() => ({}));
  throwForUploadResponse(response, 'complete');
  if (!gapUploadCompleteResponseSchema.safeParse(json).success) {
    throw new TerminalGapUploadError('Conferma del caricamento non valida.');
  }
}
