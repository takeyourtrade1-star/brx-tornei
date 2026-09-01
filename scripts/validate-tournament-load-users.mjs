import fs from 'node:fs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(message) {
  console.error(`Identita load test non valide: ${message}`);
  process.exit(2);
}

const file = process.argv[2];
if (!file) fail('specificare il percorso del JSON');

let records;
try {
  records = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch {
  fail('JSON illeggibile');
}

if (!Array.isArray(records) || records.length < 2 || records.length % 2 !== 0) {
  fail('servono almeno due identita, in numero pari');
}

const users = new Set();
const accessTokens = new Set();
const refreshTokens = new Set();
for (const [index, record] of records.entries()) {
  if (!record || typeof record !== 'object') fail(`record ${index + 1} non e un oggetto`);
  const token = record.accessToken || record.access_token || record.token;
  if (typeof token !== 'string' || token.length === 0) {
    fail(`record ${index + 1}: accessToken mancante`);
  }
  if (token.length > 8192) {
    fail(`record ${index + 1}: accessToken non valido`);
  }
  if (accessTokens.has(token)) fail(`accessToken duplicato nel record ${index + 1}`);
  accessTokens.add(token);

  const parts = token.split('.');
  if (parts.length !== 3) fail(`record ${index + 1}: accessToken non e un JWT`);

  let payload;
  try {
    const encoded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    payload = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  } catch {
    fail(`record ${index + 1}: payload JWT non leggibile`);
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    fail(`record ${index + 1}: payload JWT non e un oggetto`);
  }

  const claimedUserId = payload.sub;
  if (typeof claimedUserId !== 'string' || !UUID.test(claimedUserId)) {
    fail(`record ${index + 1}: sub JWT non e un UUID canonico`);
  }
  const suppliedUserId = record.userId || record.user_id;
  if (
    suppliedUserId !== undefined &&
    String(suppliedUserId).toLowerCase() !== claimedUserId.toLowerCase()
  ) {
    fail(`record ${index + 1}: userId non coincide con sub JWT`);
  }
  const userId = claimedUserId;
  if (users.has(userId)) fail(`userId duplicato nel record ${index + 1}`);
  users.add(userId);

  if (!Number.isFinite(Number(payload.exp)) || Number(payload.exp) <= 0) {
    fail(`record ${index + 1}: claim exp mancante`);
  }
  const refreshToken = record.refreshToken || record.refresh_token;
  if (
    typeof refreshToken !== 'string' ||
    refreshToken.length < 32 ||
    refreshToken.length > 8192
  ) {
    fail(`record ${index + 1}: refreshToken non valido`);
  }
  if (refreshTokens.has(refreshToken)) {
    fail(`refreshToken duplicato nel record ${index + 1}`);
  }
  refreshTokens.add(refreshToken);
  const label = record.label ?? `player-${index + 1}`;
  if (typeof label !== 'string' || !label || label.length > 100) {
    fail(`record ${index + 1}: label non valida`);
  }
}

console.log(`Identita load test valide: ${records.length} (${records.length / 2} coppie).`);
