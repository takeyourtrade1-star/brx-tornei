import encoding from 'k6/encoding';
import { USERS_FILE, GENERATOR_COUNT, GENERATOR_INDEX, MAX_PLAYERS } from '../config.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function decodePayload(token) {
  if (typeof token !== 'string' || token.length > 8192) {
    throw new Error('Access token non valido');
  }
  const parts = String(token || '').split('.');
  if (parts.length !== 3 || !parts[1]) throw new Error('Access token non JWT');
  try {
    const payload = JSON.parse(encoding.b64decode(parts[1], 'rawurl', 's'));
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('payload non oggetto');
    }
    return payload;
  } catch {
    throw new Error('Payload JWT non leggibile');
  }
}

function normalizeIdentity(value, index) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Identita ${index + 1} non valida`);
  }
  const accessToken = value.accessToken || value.access_token || value.token;
  if (typeof accessToken !== 'string' || !accessToken) {
    throw new Error(`Identita ${index + 1}: accessToken mancante`);
  }
  const payload = decodePayload(accessToken);
  const tokenUserId = String(payload.sub || '');
  if (!UUID.test(tokenUserId)) {
    throw new Error(`Identita ${index + 1}: sub JWT non e un UUID canonico`);
  }
  const suppliedUserId = value.userId || value.user_id;
  if (suppliedUserId !== undefined && String(suppliedUserId).toLowerCase() !== tokenUserId.toLowerCase()) {
    throw new Error(`Identita ${index + 1}: userId non coincide con sub JWT`);
  }
  const userId = tokenUserId;
  if (!UUID.test(userId)) {
    throw new Error(`Identita ${index + 1}: userId/sub non e un UUID canonico`);
  }
  const expiresAt = Number(payload.exp || 0);
  if (!Number.isFinite(expiresAt) || expiresAt <= 0) {
    throw new Error(`Identita ${index + 1}: claim exp mancante`);
  }
  const rawRefreshToken = value.refreshToken !== undefined
    ? value.refreshToken
    : value.refresh_token;
  const refreshTokenValue = rawRefreshToken === undefined || rawRefreshToken === null || rawRefreshToken === ''
    ? null
    : rawRefreshToken;
  const hasRefreshToken = refreshTokenValue !== undefined && refreshTokenValue !== null;
  if (
    hasRefreshToken &&
    (typeof refreshTokenValue !== 'string' ||
      refreshTokenValue.length < 32 ||
      refreshTokenValue.length > 8192)
  ) {
    throw new Error(`Identita ${index + 1}: refreshToken non valido`);
  }
  const labelValue = value.label === undefined ? `player-${index + 1}` : value.label;
  if (typeof labelValue !== 'string' || !labelValue || labelValue.length > 100) {
    throw new Error(`Identita ${index + 1}: label non valida`);
  }
  return {
    label: labelValue,
    userId,
    accessToken,
    refreshToken: refreshTokenValue,
    expiresAt,
  };
}

let parsed;
try {
  parsed = JSON.parse(open(USERS_FILE));
} catch (error) {
  throw new Error(`Impossibile leggere USERS_FILE=${USERS_FILE}: ${String(error)}`);
}
if (!Array.isArray(parsed)) throw new Error('USERS_FILE deve contenere un array JSON');

const all = parsed.map(normalizeIdentity);
if (all.length === 0 || all.length % 2 !== 0) {
  throw new Error('USERS_FILE deve contenere un numero pari e non nullo di identita');
}
const seen = new Set();
const seenRefreshTokens = new Set();
for (const identity of all) {
  if (seen.has(identity.userId)) throw new Error(`Identita duplicata: ${identity.label}`);
  seen.add(identity.userId);
  if (identity.refreshToken) {
    if (seenRefreshTokens.has(identity.refreshToken)) {
      throw new Error(`Refresh token duplicato per ${identity.label}`);
    }
    seenRefreshTokens.add(identity.refreshToken);
  }
}

const sharded = [];
for (let pair = 0; pair < all.length / 2; pair += 1) {
  if (pair % GENERATOR_COUNT !== GENERATOR_INDEX) continue;
  sharded.push(all[pair * 2], all[pair * 2 + 1]);
}
if (sharded.length < MAX_PLAYERS) {
  throw new Error(
    `Servono ${MAX_PLAYERS} identita per questo shard, disponibili ${sharded.length}`,
  );
}

export const identities = Object.freeze(sharded.slice(0, MAX_PLAYERS));
