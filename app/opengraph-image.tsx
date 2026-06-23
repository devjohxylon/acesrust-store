import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { shareMetadata } from '@/lib/share-metadata';

export const alt = shareMetadata.title;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const logoPath = join(process.cwd(), 'public', 'aces-logo.png');
  const logoData = await readFile(logoPath);
  const logoSrc = `data:image/png;base64,${logoData.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#08080c',
          padding: '48px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255, 23, 68, 0.4)',
            borderRadius: '24px',
            padding: '48px 64px',
            background: 'linear-gradient(135deg, rgba(255, 23, 68, 0.12) 0%, rgba(255, 0, 60, 0.06) 100%)',
          }}
        >
          <img src={logoSrc} width={180} height={180} alt="" />
          <div
            style={{
              marginTop: 32,
              fontSize: 56,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            {shareMetadata.title}
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 28,
              color: '#a8a29e',
              textAlign: 'center',
              maxWidth: 800,
              lineHeight: 1.4,
            }}
          >
            {shareMetadata.description}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
