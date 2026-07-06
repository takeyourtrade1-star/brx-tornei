/**
 * Nome carta in lingua preferita + fallback inglese.
 * Ordine keywords_localized da Meilisearch: en, de, es, fr, it, pt.
 */

const BACKEND_LANG_ORDER = ['en', 'de', 'es', 'fr', 'it', 'pt'] as const;
type SupportedLang = (typeof BACKEND_LANG_ORDER)[number];

function normalizeLang(lang: string): SupportedLang {
  return BACKEND_LANG_ORDER.includes(lang as SupportedLang) ? (lang as SupportedLang) : 'en';
}

export function getLocalizedName(keywords: string[] | undefined, lang: string): string | null {
  if (!keywords?.length) return null;
  const l = normalizeLang(lang);
  const idx = BACKEND_LANG_ORDER.indexOf(l);
  if (idx < 0 || !keywords[idx]) return null;
  const raw = keywords[idx];
  return (typeof raw === 'string' ? raw : '').trim() || null;
}

export interface CardLike {
  name: string;
  keywords_localized?: string[] | null;
}

export function getCardDisplayNames(
  card: CardLike,
  currentLang: string
): { primary: string; secondary: string | null } {
  const primary = getLocalizedName(card.keywords_localized ?? undefined, currentLang) ?? card.name;
  const secondary = currentLang !== 'en' ? card.name : null;
  return { primary, secondary };
}
