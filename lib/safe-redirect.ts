import { getCanonicalSiteUrl } from '@/lib/branding';

/** Allowed origins for OAuth return redirects — never trust client-provided hosts. */
export function getAllowedOrigins(requestOrigin?: string): Set<string> {
  const origins = new Set<string>();
  try {
    origins.add(new URL(getCanonicalSiteUrl()).origin);
  } catch {
    // ignore
  }
  if (requestOrigin) {
    try {
      origins.add(new URL(requestOrigin).origin);
    } catch {
      // ignore
    }
  }
  // Apex + www variants for the production domain
  for (const origin of [...origins]) {
    try {
      const url = new URL(origin);
      if (url.hostname.startsWith('www.')) {
        origins.add(`${url.protocol}//${url.hostname.slice(4)}`);
      } else if (!url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1')) {
        origins.add(`${url.protocol}//www.${url.hostname}`);
      }
    } catch {
      // ignore
    }
  }
  return origins;
}

export function isAllowedOrigin(candidate: string, requestOrigin?: string): boolean {
  try {
    const origin = new URL(candidate).origin;
    return getAllowedOrigins(requestOrigin).has(origin);
  } catch {
    return false;
  }
}

/** Only allow same-site relative paths (no protocol-relative //evil.com). */
export function sanitizeReturnPath(path: string | null | undefined, fallback = '/'): string {
  if (!path || typeof path !== 'string') return fallback;
  if (!path.startsWith('/') || path.startsWith('//')) return fallback;
  if (path.includes('\\') || path.includes('\n') || path.includes('\r')) return fallback;
  return path;
}

export function safeCheckoutOrigin(
  candidate: string | null | undefined,
  requestOrigin: string
): string {
  if (candidate && isAllowedOrigin(candidate, requestOrigin)) {
    return new URL(candidate).origin;
  }
  return requestOrigin;
}
