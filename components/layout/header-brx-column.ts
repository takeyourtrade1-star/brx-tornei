/**
 * Logo header — asset condiviso con la landing Ebartex (LandingWelcome).
 * Path CDN: Logo Principale EBARTEX.png
 */

export const HEADER_BRX_LOGO_PATH = 'Logo%20Principale%20EBARTEX.png';

/** Variante lettere navy (generata da quella CDN) — per header su sfondo chiaro. */
export const HEADER_BRX_LOGO_DARK_SRC = '/logo-ebartex-dark.png';

/** Variante bianca da CDN — per HUD su sfondo arena. */
export const HEADER_BRX_LOGO_LIGHT_PATH = 'logo.png';

export const HEADER_BRX_LOGO_INTRINSIC_WIDTH = 700;
export const HEADER_BRX_LOGO_INTRINSIC_HEIGHT = 263;

export const HEADER_BRX_LOGO_COLUMN_CLASS =
  'relative flex h-[52px] shrink-0 items-center overflow-visible sm:h-[58px]';

export const HEADER_BRX_LOGO_LINK_CLASS =
  'flex items-center justify-center rounded-lg transition-opacity hover:opacity-90';

/** Logo principale Ebartex — proporzioni landing, +30% in header (52→58px). */
export const HEADER_BRX_LOGO_IMAGE_CLASS =
  'h-[52px] w-auto object-contain sm:h-[58px]';

/** Overlay minigioco: leggermente più grande del chip HUD. */
export const HEADER_BRX_LOGO_OVERLAY_IMAGE_CLASS =
  'h-10 w-auto object-contain sm:h-11';
