/** Browser-safe configuration. Never add service REST origins or credentials. */

const isDevelopment = process.env.NODE_ENV === 'development';

function normalizeOrigin(value: string, fallback = ''): string {
  const raw = (value || fallback).trim();
  if (!raw) return '';
  try {
    const parsed = new URL(raw);
    if (
      parsed.username ||
      parsed.password ||
      parsed.pathname !== '/' ||
      parsed.search ||
      parsed.hash
    ) return '';
    return parsed.origin;
  } catch {
    return '';
  }
}

const cdnUrl = normalizeOrigin(
  process.env.NEXT_PUBLIC_CDN_URL || '',
  isDevelopment ? 'https://di0y87a9s8da9.cloudfront.net' : '',
);
const productionMatchGapUploadOrigin =
  'https://tournaments-000876600482-eu-south-1-match-gaps.s3.eu-south-1.amazonaws.com';
const matchGapUploadOrigin = normalizeOrigin(
  process.env.NEXT_PUBLIC_MATCH_GAP_UPLOAD_ORIGIN || '',
  isDevelopment ? '' : productionMatchGapUploadOrigin,
);

export const publicConfig = {
  app: {
    name: 'Ebartex Tornei',
    siteUrl: normalizeOrigin(
      process.env.NEXT_PUBLIC_SITE_URL || '',
      'https://tornei.ebartex.com',
    ),
    mainSiteUrl: normalizeOrigin(
      process.env.NEXT_PUBLIC_MAIN_SITE_URL || '',
      'https://www.ebartex.com',
    ),
  },
  websocket: {
    tournamentsOrigin: normalizeOrigin(
      process.env.NEXT_PUBLIC_TOURNAMENTS_WS_ORIGIN || '',
    ),
  },
  storage: {
    matchGapUploadOrigin,
  },
  assets: {
    cdnUrl,
    imagesBaseUrl: cdnUrl ? `${cdnUrl}/images` : '',
  },
  features: {
    matchGapRecording:
      (isDevelopment
        ? process.env.NEXT_PUBLIC_MATCH_GAP_RECORDING_ENABLED === 'true'
        : process.env.NEXT_PUBLIC_MATCH_GAP_RECORDING_ENABLED !== 'false') &&
      Boolean(matchGapUploadOrigin),
  },
} as const;

export const ASSETS = publicConfig.assets;

export function getCdnImageUrl(path: string): string {
  const safePath = path.replace(/^\/+/, '');
  return ASSETS.imagesBaseUrl
    ? `${ASSETS.imagesBaseUrl}/${safePath}`
    : `/images/${safePath}`;
}

export function getCdnVideoUrl(path: string): string {
  return getCdnImageUrl(path);
}
