/**
 * URL assoluti per immagini carte e icone set dal CDN Ebartex.
 * Allineato a new_frontend_brx/lib/assets.ts
 */

import { ASSETS } from '@/lib/config';

function stripImgPrefix(path: string): string {
  const raw = path.trim();
  if (raw.startsWith('/img/')) return raw.replace(/^\/img\//, '');
  if (raw.startsWith('img/')) return raw.replace(/^img\//, '');
  return raw;
}

export function getSetIconUrl(
  raw: string | null | undefined,
  options?: { gameSlug?: string; setCode?: string }
): string | null {
  if (raw != null && raw !== '') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('http')) return trimmed;
    const base = (ASSETS.cdnUrl || '').replace(/\/+$/, '');
    const pathWithSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return base ? `${base}${pathWithSlash}` : pathWithSlash;
  }

  const gameSlug = options?.gameSlug ?? '';
  const setCode = options?.setCode ?? '';
  if (
    (gameSlug === 'mtg' || gameSlug === '') &&
    setCode &&
    setCode.trim().length >= 2 &&
    setCode.trim().length <= 6
  ) {
    return `https://svgs.scryfall.io/sets/${setCode.trim().toLowerCase()}.svg`;
  }

  return null;
}

export function getCardImageUrl(raw: string | null | undefined): string | null {
  if (raw == null || raw === '') return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith('http')) {
    try {
      const parsed = new URL(trimmed);
      const normalizedPath = stripImgPrefix(parsed.pathname);
      const normalizedPathWithLeadingSlash = normalizedPath.startsWith('/')
        ? normalizedPath
        : `/${normalizedPath}`;
      if (normalizedPathWithLeadingSlash !== parsed.pathname) {
        parsed.pathname = normalizedPathWithLeadingSlash;
        return parsed.toString();
      }
      return trimmed;
    } catch {
      return trimmed;
    }
  }
  const path = stripImgPrefix(trimmed);
  if (!path) return null;
  const base = (ASSETS.cdnUrl || '').replace(/\/+$/, '');
  const pathWithLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${pathWithLeadingSlash}` : pathWithLeadingSlash;
}
