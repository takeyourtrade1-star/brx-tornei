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
  assets: {
    cdnUrl,
    imagesBaseUrl: cdnUrl ? `${cdnUrl}/images` : '',
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
