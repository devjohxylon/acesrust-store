/** Canonical public site URL helpers for Astral Vanilla+. */

const DEFAULT_SITE_URL = 'https://www.astralrce.com';

export function getCanonicalSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  if (raw && raw.startsWith('http')) return raw;
  return DEFAULT_SITE_URL;
}

/** Rewrite leftover Aces branding in persisted CMS / Discord ingest strings. */
export function brandifyText(value: string): string {
  return value
    .replace(/\bAces Vanilla\+/gi, 'Astral Vanilla+')
    .replace(/\bAces Rust\b/gi, 'Astral Vanilla+')
    .replace(/\bacesrust\.com\b/gi, 'www.astralrce.com')
    .replace(/\bAces\b/g, 'Astral');
}
