import { redirect } from 'next/navigation';
import { AdminLoginForm } from '@/components/admin/admin-login-form';
import { getAdminSession } from '@/lib/admin-auth';
import { getAdminAuthMode } from '@/lib/cms-config';

export default async function AdminLoginPage() {
  const user = await getAdminSession();
  if (user) {
    redirect('/admin');
  }

  return <AdminLoginForm authMode={getAdminAuthMode()} />;
}
