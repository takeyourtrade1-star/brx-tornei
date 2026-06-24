import { FORMATS, type FormatId } from '@/lib/data/catalog';

/** Asset orizzontali 16:9 per card formato (vista semplificata + PC minigioco). */
export const FORMAT_MEDIA: Record<FormatId, { image: string; video: string }> = {
  'old-school': {
    image: '/immagini-formato-orizzontale/old-school-or.webp',
    video: '/video-animazione-orizzontale/animazione-old-school.webm',
  },
  premodern: {
    image: '/immagini-formato-orizzontale/pre-modern-or.webp',
    video: '/video-animazione-orizzontale/animazione-pre-modern.webm',
  },
  pioneer: {
    image: '/immagini-formato-orizzontale/pioneer-or.webp',
    video: '/video-animazione-orizzontale/animazione-piooner.webm',
  },
  modern: {
    image: '/immagini-formato-orizzontale/modern-or.webp',
    video: '/video-animazione-orizzontale/animazione-modern.webm',
  },
  standard: {
    image: '/immagini-formato-orizzontale/standard-or.webp',
    video: '/video-animazione-orizzontale/animazione-standard.webm',
  },
  legacy: {
    image: '/immagini-formato-orizzontale/legacy-or.webp',
    video: '/video-animazione-orizzontale/animazione-legacy.webm',
  },
  pauper: {
    image: '/immagini-formato-orizzontale/pauper-or.webp',
    video: '/video-animazione-orizzontale/animazione-pauper.webm',
  },
  commander: {
    image: '/immagini-formato-orizzontale/commander-or.webp',
    video: '/video-animazione-orizzontale/animazione-commander.webm',
  },
};

/**
 * Sfondo "pillola" orizzontale per il selettore formato mobile.
 * NB: pauper non ha ancora un asset dedicato → fallback all'immagine orizzontale.
 */
export const FORMAT_PILL: Record<FormatId, string> = {
  'old-school': '/immagini-formato-pill/old-school-pill.webp',
  premodern: '/immagini-formato-pill/premodern-pill.webp',
  pioneer: '/immagini-formato-pill/pioneer-pill.webp',
  modern: '/immagini-formato-pill/modern-pill.webp',
  standard: '/immagini-formato-pill/standard-pill.webp',
  legacy: '/immagini-formato-pill/legacy-pill.webp',
  pauper: FORMAT_MEDIA.pauper.image,
  commander: '/immagini-formato-pill/commander-pill.webp',
};

/** Lista formati con media per UI (ordine catalogo). */
export const FORMATS_WITH_MEDIA = FORMATS.map((f) => ({
  id: f.id,
  name: f.name,
  pill: FORMAT_PILL[f.id],
  ...FORMAT_MEDIA[f.id],
}));
