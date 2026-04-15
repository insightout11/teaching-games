import { ImageResponse } from 'next/og';
import { getActivity } from '@/activities/registry';
import { getActivityContent } from '@/lib/content-landing';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const THEME_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  icebreakers: { bg: '#92400e', text: '#ffffff', accent: '#fcd34d' },
  learning:    { bg: '#065f46', text: '#ffffff', accent: '#6ee7b7' },
  practice:    { bg: '#1e40af', text: '#ffffff', accent: '#93c5fd' },
  debate:      { bg: '#9f1239', text: '#ffffff', accent: '#fca5a5' },
};

export default function ActivityOgImage({ params }: { params: { slug: string } }) {
  const plugin = getActivity(params.slug);
  const content = getActivityContent(params.slug);

  const theme = THEME_COLORS[content?.ogImageTheme ?? 'learning'];
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
          LessonCaptain · Classroom Activity
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
