import 'server-only';
import { createHmac } from 'crypto';
import type { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { safeCompare } from '@/lib/security';
import type { SessionUser } from '@/lib/engagement/types';

export const SESSION_COOKIE_NAME = 'aces_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function sessionSecret(): string {
  return process.env.AUTH_SECRET || process.env.DISCORD_CLIENT_SECRET || '';
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function createSessionToken(user: SessionUser): string | null {
  const secret = sessionSecret();
  if (!secret) return null;

  const payload = Buffer.from(
    JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE })
  ).toString('base64url');

  return `${payload}.${sign(payload, secret)}`;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  };
}

const OAUTH_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 600,
} as const;

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

export function applySessionCookie(response: NextResponse, user: SessionUser): boolean {
  const token = createSessionToken(user);
  if (!token) return false;
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
  return true;
}

/** Persist OAuth state between the authorize redirect and the callback. */
export function setOAuthStateCookies(
  response: NextResponse,
  nonce: string,
  returnTo: string,
  redirectUri: string
) {
  response.cookies.set('aces_oauth', `${nonce}:${returnTo}`, OAUTH_COOKIE_OPTS);
  response.cookies.set('aces_oauth_redirect', redirectUri, OAUTH_COOKIE_OPTS);
}

export function clearOAuthStateCookies(response: NextResponse) {
  response.cookies.delete('aces_oauth');
  response.cookies.delete('aces_oauth_redirect');
}

export async function setUserSession(user: SessionUser): Promise<boolean> {
  const token = createSessionToken(user);
  if (!token) return false;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
  return true;
}

export async function clearUserSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getUserSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token);
}
