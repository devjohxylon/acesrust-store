import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-auth';
import { AdminShell } from '@/components/admin/admin-shell';

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminSession();
  if (!user) {
    redirect('/admin/login');
  }

  return <AdminShell>{children}</AdminShell>;
}
