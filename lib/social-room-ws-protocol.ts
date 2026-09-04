const MAX_CONTROL_FRAME_BYTES = 16 * 1024;
const MAX_ACK_REASON_CHARS = 160;
const MAX_ACK_EVENT_ID_CHARS = 128;

export type SocialRoomServerControlFrame =
  | { readonly event: 'authenticated'; readonly peerId: string }
  | {
      readonly event: 'ack';
      readonly clientSequence: number;
      readonly accepted: boolean;
      readonly eventId?: string;
      readonly reason?: string;
    };

/**
 * Decodifica soltanto i frame di controllo definiti dal contratto WS Piazza.
 * Il parser è una guardia strutturale, non sostituisce ticket e autorizzazione
 * server-side: nessun campo del frame viene usato per derivare l'identità.
 */
export function parseSocialRoomServerControlFrame(
  value: unknown,
): SocialRoomServerControlFrame | null {
  const record = parseRecord(value);
  if (!record || typeof record.event !== 'string') return null;

  if (record.event === 'authenticated') {
    if (!hasOnlyKeys(record, ['event', 'peer_id', 'server_time'])) return null;
    const peerId = readIdentifier(record.peer_id, 96);
    const serverTime = record.server_time;
    if (!peerId || (serverTime !== undefined && !isNonNegativeSafeInteger(serverTime))) {
      return null;
    }
    return { event: 'authenticated', peerId };
  }
  if (record.event !== 'ack') return null;
  if (!hasOnlyKeys(record, ['event', 'client_sequence', 'accepted', 'event_id', 'reason'])) {
    return null;
  }

  const clientSequence = record.client_sequence;
  if (!isPositiveSafeInteger(clientSequence) || typeof record.accepted !== 'boolean') {
    return null;
  }

  const eventId = readSafeString(record.event_id, MAX_ACK_EVENT_ID_CHARS);
  const reason = readSafeString(record.reason, MAX_ACK_REASON_CHARS);
  if (record.event_id !== undefined && eventId === null) return null;
  if (record.reason !== undefined && reason === null) return null;

  return {
    event: 'ack',
    clientSequence,
    accepted: record.accepted,
    ...(eventId === null ? {} : { eventId }),
    ...(reason === null ? {} : { reason }),
  };
}

function parseRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'string') {
    if (utf8ByteLength(value) > MAX_CONTROL_FRAME_BYTES) return null;
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  return isRecord(value) ? value : null;
}

function hasOnlyKeys(record: Record<string, unknown>, keys: string[]): boolean {
  const allowed = new Set(keys);
  return Object.keys(record).every((key) => allowed.has(key));
}

function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function readIdentifier(value: unknown, maxChars: number): string | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > maxChars) return null;
  return /^[a-z0-9][a-z0-9._:-]*$/iu.test(value) ? value : null;
}

function readSafeString(value: unknown, maxChars: number): string | null {
  if (value === undefined) return null;
  if (typeof value !== 'string' || value.length === 0 || value.length > maxChars) return null;
  if (/[\u0000-\u001f\u007f-\u009f]/u.test(value)) return null;
  return value;
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
