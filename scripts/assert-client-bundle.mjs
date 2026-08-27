import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const staticRoot = path.resolve('.next/static');
if (!existsSync(staticRoot)) {
  throw new Error('Client bundle directory .next/static is missing');
}

function filesUnder(directory) {
  return readdirSync(directory).flatMap((name) => {
    const target = path.join(directory, name);
    return statSync(target).isDirectory() ? filesUnder(target) : [target];
  });
}

const forbiddenEnvNames = [
  'NEXT_PUBLIC_AUTH_API_URL',
  'NEXT_PUBLIC_SYNC_API_URL',
  'NEXT_PUBLIC_TOURNAMENTS_API_URL',
  'NEXT_PUBLIC_AUCTION_API_URL',
  'NEXT_PUBLIC_MEILISEARCH_URL',
  'NEXT_PUBLIC_MEILISEARCH_API_KEY',
  'MEILISEARCH_SEARCH_KEY',
  'BRX_MATCH_INTERNAL_TOKEN',
  'BRX_MATCH_EDGE_MODEL_SHA256',
  'UPSTASH_REDIS_REST_TOKEN',
  'WEBCAM_RELAY_SECRET',
];

const secretOrServerValues = [
  'AUTH_API_URL',
  'SYNC_API_URL',
  'TOURNAMENTS_API_URL',
  'AUCTION_API_URL',
  'MEILISEARCH_URL',
  'MEILISEARCH_SEARCH_KEY',
  'BRX_MATCH_API_URL',
  'BRX_MATCH_INTERNAL_TOKEN',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'WEBCAM_RELAY_SECRET',
]
  .map((name) => process.env[name])
  .filter((value) => typeof value === 'string' && value.length >= 8);

for (const file of filesUnder(staticRoot).filter((name) => name.endsWith('.js'))) {
  const source = readFileSync(file, 'utf8');
  for (const marker of forbiddenEnvNames) {
    if (source.includes(marker)) {
      throw new Error(`Forbidden server marker ${marker} found in client bundle`);
    }
  }
  for (const value of secretOrServerValues) {
    if (source.includes(value)) {
      throw new Error('A server-only environment value was embedded in the client bundle');
    }
  }
}

console.log('Client bundle boundary passed.');
