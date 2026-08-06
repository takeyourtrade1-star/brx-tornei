/**
 * Confronto dell'host della richiesta con l'hostname canonico configurato.
 *
 * In produzione l'app è dietro una CDN che termina il TLS: l'URL interno che
 * il server costruisce ha protocollo http e host dell'istanza (Next 15.5 con
 * `next start` deriva `nextUrl` dall'indirizzo di bind, ignorando l'header
 * Host). L'unico dato fedele su ciò che il client ha richiesto è l'header
 * Host — ed è anche il confine di sicurezza: escludere host avvelenati o non
 * canonici. Il protocollo interno non è osservabile e non viene confrontato.
 */
export function isCanonicalRequestHost(
  requestHost: string | null,
  configuredSiteUrl: string,
): boolean {
  if (!requestHost) return false;
  try {
    // L'header Host può includere la porta: il parsing come URL la scarta.
    const received = new URL(`https://${requestHost}`).hostname;
    return received === new URL(configuredSiteUrl).hostname;
  } catch {
    return false;
  }
}
