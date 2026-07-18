import { cookies } from 'next/headers';
import { getAdminPassword } from '@/lib/cms-config';
import {
  createSignedToken,
  safeCompare,
  verifySignedToken,
} from '@/lib/security';

const COOKIE_NAME = 'aces_admin';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/** Prefer a dedicated signing secret so rotating the password doesn't break sessions. */
function adminSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    getAdminPassword() ||
    ''
  );
}

export async function setAdminSession() {
  const secret = adminSessionSecret();
  if (!secret) return;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createSignedToken(secret, SESSION_MAX_AGE), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAdminSessionValid() {
  const secret = adminSessionSecret();
  if (!secret) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  return verifySignedToken(token, secret);
}

export function verifyAdminPassword(password: string) {
  const expected = getAdminPassword();
  if (!expected) return false;
  return safeCompare(password, expected);
}
