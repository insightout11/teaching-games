import { ImageResponse } from 'next/og';
import { getGame } from '@/games/registry';
import { getGameContent } from '@/lib/content-landing';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const THEME_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  quiz:       { bg: '#4c1d95', text: '#ffffff', accent: '#c4b5fd' },
  vocabulary: { bg: '#0e7490', text: '#ffffff', accent: '#67e8f9' },
  grammar:    { bg: '#065f46', text: '#ffffff', accent: '#6ee7b7' },
  logic:      { bg: '#92400e', text: '#ffffff', accent: '#fcd34d' },
};

export default function GameOgImage({ params }: { params: { slug: string } }) {
  const plugin = getGame(params.slug);
  const content = getGameContent(params.slug);

  const theme = THEME_COLORS[content?.ogImageTheme ?? 'vocabulary'];
  const name = plugin?.name ?? params.slug;
  const headline = content?.headline ?? plugin?.description ?? '';

  return new ImageResponse(
    (
      <div
        style={{
          background: theme.bg,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 80px',
        }}
      >
        <div style={{ color: theme.accent, fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
          LessonCaptain · Classroom Game
        </div>
        <div style={{ color: theme.text, fontSize: 56, fontWeight: 800, lineHeight: 1.1 }}>
          {name}
        </div>
        <div
          style={{
            color: theme.text,
            fontSize: 28,
            marginTop: 24,
            opacity: 0.85,
            maxWidth: 900,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            marginTop: 'auto',
            color: theme.text,
            opacity: 0.5,
            fontSize: 18,
          }}
        >
          lessoncaptain.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
