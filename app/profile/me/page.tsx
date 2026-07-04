import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/engagement/session';
import { ProfileView } from '@/components/engagement/profile-view';

export const metadata = { title: 'My Profile — Aces Vanilla+' };

export default async function MyProfilePage() {
  const user = await getUserSession();
  if (!user) {
    redirect('/api/auth/discord/login?return_to=/profile/me');
  }
  return <ProfileView discordId={user.id} />;
}
