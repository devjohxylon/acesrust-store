import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { getAdminPassword } from '@/lib/cms-config';

const COOKIE_NAME = 'aces_admin';

function signSession() {
  return createHmac('sha256', getAdminPassword())
    .update('aces-admin-session')
    .digest('hex');
}

function safeEqual(a: string, b: string) {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, signSession(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAdminSessionValid() {
  if (!getAdminPassword()) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  return safeEqual(token, signSession());
}

export function verifyAdminPassword(password: string) {
  const expected = getAdminPassword();
  if (!expected) return false;
  return safeEqual(password, expected);
}
