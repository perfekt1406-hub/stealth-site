/**
 * Game Proxy Utility
 * Transforms game URLs to use a reverse proxy when PUBLIC_GAME_PROXY_URL is configured
 */

/**
 * Transforms a game URL to use the reverse proxy if configured
 * @param originalUrl - The original game URL
 * @returns The proxied URL if proxy is configured, otherwise the original URL
 */
export function getProxiedGameUrl(originalUrl: string): string {
  const proxyBase = import.meta.env.PUBLIC_GAME_PROXY_URL;
  
  if (!proxyBase) {
    return originalUrl; // No proxy configured, use original
  }
  
  try {
    const url = new URL(originalUrl);
    // Format: {PROXY_DOMAIN}/proxy/{HOST}{PATH}{QUERY}{HASH}
    const proxyUrl = `${proxyBase}/proxy/${url.host}${url.pathname}${url.search}${url.hash}`;
    return proxyUrl;
  } catch (e) {
    console.warn('Invalid game URL:', originalUrl);
    return originalUrl; // Fallback to original on error
  }
}
