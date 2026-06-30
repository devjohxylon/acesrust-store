import { getAdminAuthMode } from '@/lib/cms-config';
import { isAdminSessionValid } from '@/lib/password-auth';

export type AdminUser = {
  id: string;
  email: string;
};

export async function getAdminSession(): Promise<AdminUser | null> {
  if (getAdminAuthMode() !== 'password') {
    return null;
  }

  const valid = await isAdminSessionValid();
  if (!valid) return null;

  return { id: 'admin', email: 'admin' };
}

export async function requireAdminSession(): Promise<AdminUser> {
  const user = await getAdminSession();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
