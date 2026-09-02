#!/usr/bin/env node
// Genera il file identita per i load test Tornei a partire da account Auth
// esistenti (email/username + password, senza MFA). Uso:
//
//   AUTH_BASE_URL=https://api.ebartex.com \
//   LOAD_TEST_CONFIRM_HOSTS=api.ebartex.com \
//   node scripts/generate-tournament-load-users.mjs <credenziali.json> <output.json>
//
// Il file credenziali e il file generato restano fuori da Git: lo script non
// stampa mai token ne password. Gli account devono esistere gia e senza MFA;
// gamertag e other profili vanno impostati prima del run (il preflight k6
// li verifica per ogni identita).

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);
const LOGIN_RETRY_DELAYS_MS = [1_000, 3_000];
const ACCOUNT_GAP_MS = 200;

function fail(message) {
  console.error(`Generazione identita non riuscita: ${message}`);
  process.exit(2);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readJsonFile(file, what) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch {
    fail(`${what} illeggibile: ${file}`);
  }
  try {
    return JSON.parse(raw);
  } catch {
    fail(`${what} non e un JSON valido: ${file}`);
  }
}

function unwrap(payload) {
  return payload && typeof payload === 'object' && payload.data && typeof payload.data === 'object'
    ? payload.data
    : payload;
}

function decodeJwtPayload(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const encoded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    return payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : null;
  } catch {
    return null;
  }
}

function assertRemoteAuthAllowed(authBaseUrl) {
  const hostname = new URL(authBaseUrl).hostname.toLowerCase().replace(/\.$/, '');
  if (LOCAL_HOSTNAMES.has(hostname)) return;
  const confirmed = (process.env.LOAD_TEST_CONFIRM_HOSTS || process.env.LOAD_TEST_CONFIRM_HOST || '')
    .split(',')
    .map((host) => host.trim().toLowerCase().replace(/\.$/, ''))
    .filter(Boolean);
  if (!confirmed.includes(hostname)) {
    fail(
      `AUTH_BASE_URL remoto non autorizzato: ${hostname}. Imposta LOAD_TEST_CONFIRM_HOSTS=${hostname} per confermarlo`,
    );
  }
}

async function authPost(authBaseUrl, path, body) {
  const response = await fetch(new URL(path, authBaseUrl), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Accept-Encoding': 'identity',
      'User-Agent': 'EbartexTournamentLoadIdentityGen/1.0',
    },
    body: JSON.stringify(body),
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  return { status: response.status, payload };
}

function credentialFields(payload) {
  const data = unwrap(payload);
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
  return {
    accessToken: typeof data.access_token === 'string' ? data.access_token : data.accessToken,
    refreshToken: typeof data.refresh_token === 'string' ? data.refresh_token : data.refreshToken,
  };
}

async function loginAccount(account, authBaseUrl) {
  const identifier = String(account.identifier || '').trim();
  const isEmail = identifier.includes('@');
  const body = {
    password: account.password,
    website_url: '',
    ...(isEmail ? { email: identifier } : { username: identifier }),
  };
  let lastDetail = 'risposta vuota';
  for (let attempt = 0; attempt <= LOGIN_RETRY_DELAYS_MS.length; attempt += 1) {
    if (attempt > 0) await sleep(LOGIN_RETRY_DELAYS_MS[attempt - 1]);
    let result;
    try {
      result = await authPost(authBaseUrl, '/api/auth/login', body);
    } catch (error) {
      lastDetail = `errore di rete: ${String(error && error.cause ? error.cause.code : error)}`;
      continue;
    }
    if (result.status >= 500 || result.status === 429) {
      lastDetail = `HTTP ${result.status}`;
      continue;
    }
    if (result.status !== 200) {
      const detail = unwrap(result.payload);
      lastDetail = `HTTP ${result.status}${detail && detail.detail ? `: ${detail.detail}` : ''}`;
      break;
    }
    const { accessToken, refreshToken } = credentialFields(result.payload);
    if (!accessToken || !refreshToken) {
      if (unwrap(result.payload)?.mfa_required === true) {
        fail(`${identifier}: l'account ha l'MFA attivo; i load test richiedono account senza MFA`);
      }
      lastDetail = 'login 200 senza access_token/refresh_token';
      break;
    }
    return { accessToken, refreshToken };
  }
  fail(`login non riuscito per ${identifier || 'account senza identifier'} (${lastDetail})`);
}

async function rotateTokens(authBaseUrl, refreshToken, label) {
  const result = await authPost(authBaseUrl, '/api/auth/refresh', { refresh_token: refreshToken });
  if (result.status !== 200) {
    fail(`refresh non riuscito per ${label}: HTTP ${result.status}`);
  }
  const { accessToken, refreshToken: nextRefreshToken } = credentialFields(result.payload);
  if (!accessToken || !nextRefreshToken) {
    fail(`refresh senza token per ${label}`);
  }
  return { accessToken, refreshToken: nextRefreshToken };
}

async function main() {
  const [credentialsFile, outputFile] = process.argv.slice(2);
  if (!credentialsFile || !outputFile) {
    console.error('Uso: node scripts/generate-tournament-load-users.mjs <credenziali.json> <output.json>');
    process.exit(2);
  }
  const authBaseUrl = (process.env.AUTH_BASE_URL || '').trim();
  if (!authBaseUrl || !/^https?:\/\//.test(authBaseUrl)) {
    fail('AUTH_BASE_URL deve essere impostato esplicitamente (https://... o http://localhost:...)');
  }
  assertRemoteAuthAllowed(authBaseUrl);

  const parsed = readJsonFile(credentialsFile, 'File credenziali');
  const accounts = Array.isArray(parsed) ? parsed : parsed && parsed.accounts;
  if (!Array.isArray(accounts) || accounts.length < 2 || accounts.length % 2 !== 0) {
    fail('il file credenziali deve contenere un numero pari di account (minimo 2)');
  }
  const seen = new Set();
  for (const [index, account] of accounts.entries()) {
    const identifier = String(account && account.identifier || '').trim();
    if (!identifier) fail(`account ${index + 1}: identifier mancante`);
    if (typeof account.password !== 'string' || !account.password) {
      fail(`account ${identifier}: password mancante`);
    }
    if (seen.has(identifier.toLowerCase())) fail(`account duplicato: ${identifier}`);
    seen.add(identifier.toLowerCase());
  }

  const identities = [];
  for (const [index, account] of accounts.entries()) {
    const label = typeof account.label === 'string' && account.label
      ? account.label
      : `player-${index + 1}`;
    const logged = await loginAccount(account, authBaseUrl);
    // Il refresh prova la rotazione e restituisce la coppia fresca che k6
    // usera come punto di partenza.
    const fresh = await rotateTokens(authBaseUrl, logged.refreshToken, label);
    const payload = decodeJwtPayload(fresh.accessToken);
    const userId = payload && typeof payload.sub === 'string' ? payload.sub : '';
    if (!userId || !UUID.test(userId)) {
      fail(`${label}: sub JWT non e un UUID valido`);
    }
    if (!Number.isFinite(Number(payload.exp)) || Number(payload.exp) <= 0) {
      fail(`${label}: claim exp mancante nell'access token`);
    }
    identities.push({
      label,
      userId,
      accessToken: fresh.accessToken,
      refreshToken: fresh.refreshToken,
      expiresAt: Number(payload.exp),
    });
    console.log(`${label}: ok (user ${userId.slice(0, 8)}..., exp ${new Date(Number(payload.exp) * 1_000).toISOString()})`);
    if (index < accounts.length - 1) await sleep(ACCOUNT_GAP_MS);
  }

  try {
    fs.writeFileSync(outputFile, `${JSON.stringify(identities, null, 2)}\n`, { mode: 0o600 });
  } catch {
    fail(`impossibile scrivere ${outputFile}`);
  }
  console.log(`Scritto ${outputFile} con ${identities.length} identita (${identities.length / 2} coppie).`);
  console.log('Ricorda: il file contiene token validi, resta fuori da Git e dalle chat.');

  const validator = path.join(path.dirname(fileURLToPath(import.meta.url)), 'validate-tournament-load-users.mjs');
  const validated = spawnSync(process.execPath, [validator, outputFile], { stdio: 'inherit' });
  if (validated.status !== 0) {
    fail('il file generato non supera la validazione');
  }
}

main().catch((error) => fail(String(error)));
