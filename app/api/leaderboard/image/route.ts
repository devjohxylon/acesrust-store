import { get } from '@vercel/blob';
import { readCmsData } from '@/lib/cms-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { leaderboard } = await readCmsData();
  const pathname = leaderboard.kaosImagePathname;

  if (!pathname) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const result = await get(pathname, { access: 'private' });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return new Response('Not found', { status: 404 });
    }

    return new Response(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType ?? 'image/png',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
