export function isCanonicalRequestOrigin(
  requestOrigin: string,
  configuredSiteUrl: string,
): boolean {
  try {
    return new URL(requestOrigin).origin === new URL(configuredSiteUrl).origin;
  } catch {
    return false;
  }
}
