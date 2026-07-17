import { ProfileView } from '@/components/engagement/profile-view';

export const metadata = { title: 'Player Profile — Astral Vanilla+' };

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ discordId: string }>;
}) {
  const { discordId } = await params;
  return <ProfileView discordId={discordId} />;
}
