import 'server-only';
import { createHmac } from 'crypto';
import { cookies } from 'next/headers';
import { safeCompare } from '@/lib/security';
import type { SessionUser } from '@/lib/engagement/types';

const COOKIE_NAME = 'aces_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function sessionSecret(): string {
  return process.env.AUTH_SECRET || process.env.DISCORD_CLIENT_SECRET || '';
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function encodeSession(user: SessionUser): string | null {
  const secret = sessionSecret();
  if (!secret) return null;

  const payload = Buffer.from(
    JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE })
  ).toString('base64url');

  return `${payload}.${sign(payload, secret)}`;
}

function decodeSession(token: string): SessionUser | null {
  const secret = sessionSecret();
  if (!secret) return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  if (!safeCompare(signature, sign(payload, secret))) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof data.exp !== 'number' || data.exp < Math.floor(Date.now() / 1000)) return null;
    if (typeof data.id !== 'string' || typeof data.username !== 'string') return null;
    return {
      id: data.id,
      username: data.username,
      avatar: typeof data.avatar === 'string' ? data.avatar : null,
    };
  } catch {
    return null;
  }
}

export async function setUserSession(user: SessionUser): Promise<boolean> {
  const token = encodeSession(user);
  if (!token) return false;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return true;
}

export async function clearUserSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getUserSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token);
}
