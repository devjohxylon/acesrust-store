import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/engagement/session';
import { isEngagementConfigured } from '@/lib/engagement/db';
import { getProfile, upsertProfile } from '@/lib/engagement/service';
import { ProfileView } from '@/components/engagement/profile-view';

export const metadata = { title: 'My Profile — Aces Vanilla+' };

export default async function MyProfilePage() {
  const user = await getUserSession();
  if (!user) {
    redirect('/api/auth/discord/login?return_to=/profile/me');
  }

  if (isEngagementConfigured()) {
    try {
      const existing = await getProfile(user.id);
      if (!existing) {
        await upsertProfile(user);
      }
    } catch (error) {
      console.error('Failed to ensure profile exists:', error);
    }
  }

  return <ProfileView discordId={user.id} />;
}
