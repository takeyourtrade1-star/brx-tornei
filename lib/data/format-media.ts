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

/** Lista formati con media per UI (ordine catalogo). */
export const FORMATS_WITH_MEDIA = FORMATS.map((f) => ({
  id: f.id,
  name: f.name,
  ...FORMAT_MEDIA[f.id],
}));
