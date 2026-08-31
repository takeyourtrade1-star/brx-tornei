/**
 * Recupera il nonce per-request emesso dal middleware dalla pagina corrente.
 * I componenti arcade sono client-only, quindi non possono riceverlo da una
 * prop server senza esporre dettagli di sessione o duplicare il layout.
 */
export function getCspNonce() {
  if (typeof document === "undefined") return undefined;
  return document.querySelector("script[nonce], style[nonce]")?.getAttribute("nonce") || undefined;
}
