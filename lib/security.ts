import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

export function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export function createSignedToken(secret: string, ttlSeconds: number): string {
  const token = randomBytes(32).toString('hex');
  const expiry = Math.floor(Date.now() / 1000) + ttlSeconds;
  const signature = createHmac('sha256', secret)
    .update(`${token}.${expiry}`)
    .digest('hex');
  return `${token}.${expiry}.${signature}`;
}

export function verifySignedToken(value: string, secret: string): boolean {
  const [token, expiryStr, signature] = value.split('.');
  if (!token || !expiryStr || !signature) return false;

  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expected = createHmac('sha256', secret)
    .update(`${token}.${expiryStr}`)
    .digest('hex');

  return safeCompare(signature, expected);
}

type RateLimitEntry = { count: number; resetAt: number };

const buckets = new Map<string, RateLimitEntry>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (entry.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  return { ok: true };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return request.headers.get('x-real-ip') ?? 'unknown';
}
