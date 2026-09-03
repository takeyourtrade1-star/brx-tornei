import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

interface BuildInfo {
  hash: string;
  timestamp: number | null;
}

const FALLBACK_BUILD_INFO: BuildInfo = { hash: 'dev', timestamp: null };

function parseBuildInfo(value: unknown): BuildInfo {
  if (typeof value !== 'object' || value === null) return FALLBACK_BUILD_INFO;

  const record = value as Record<string, unknown>;
  const hash = typeof record.hash === 'string' ? record.hash.trim() : '';
  const timestamp = record.timestamp;

  if (!hash) return FALLBACK_BUILD_INFO;
  if (timestamp !== null && (typeof timestamp !== 'number' || !Number.isFinite(timestamp))) {
    return FALLBACK_BUILD_INFO;
  }

  return { hash, timestamp };
}

async function readBuildInfo(): Promise<BuildInfo> {
  try {
    const content = await readFile(
      path.join(process.cwd(), 'public', 'build-info.json'),
      'utf8',
    );
    return parseBuildInfo(JSON.parse(content) as unknown);
  } catch {
    return FALLBACK_BUILD_INFO;
  }
}

function formatTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp * 1000));
}

export async function BuildInfoBadge() {
  const info = await readBuildInfo();
  const label = info.timestamp
    ? `${info.hash} • ${formatTimestamp(info.timestamp)}`
    : info.hash;

  return (
    <span
      aria-label={`Versione build: ${label}`}
      className="inline-flex rounded border border-[#1D3160]/15 bg-[#1D3160]/90 px-2 py-0.5 font-mono text-[10px] text-white/80"
    >
      {label}
    </span>
  );
}
