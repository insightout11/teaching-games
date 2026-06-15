import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Dynamic OG card for /video-lesson. With ?v=<id> (+ optional &title=) it renders the
// video's thumbnail framed as a live lesson — so a shared link unfurls as a lesson, not
// a generic site card. Without ?v= it renders the page's default card.
export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('v');
  const rawTitle = searchParams.get('title') ?? '';
  const title = rawTitle.length > 90 ? `${rawTitle.slice(0, 87)}…` : rawTitle;

  const background =
    'linear-gradient(135deg, #071018 0%, #0e2438 60%, #0e7490 100%)';

  return new ImageResponse(
    (
      <div
        style={{
          background,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
        }}
      >
        <div style={{ color: '#67e8f9', fontSize: 26, fontWeight: 600, display: 'flex' }}>
          ✈ LessonCaptain
        </div>

        {videoId ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 44 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- satori (ImageResponse) requires a raw <img>, not next/image */}
            <img
              src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
              alt=""
              width={420}
              height={315}
              style={{ borderRadius: 20, objectFit: 'cover', border: '1px solid rgba(103,232,249,0.4)' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 560 }}>
              <div style={{ color: '#67e8f9', fontSize: 22, fontWeight: 600, display: 'flex' }}>
                A 10-stage live English lesson
              </div>
              <div
                style={{
                  color: '#ffffff',
                  fontSize: title.length > 50 ? 40 : 48,
                  fontWeight: 800,
                  lineHeight: 1.12,
                  marginTop: 16,
                  display: 'flex',
                }}
              >
                {title || 'Built from this video'}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: '#ffffff', fontSize: 60, fontWeight: 800, lineHeight: 1.1, maxWidth: 1000, display: 'flex' }}>
              Turn any YouTube video into a live English lesson
            </div>
            <div style={{ color: '#ffffff', opacity: 0.82, fontSize: 30, marginTop: 24, maxWidth: 980, display: 'flex' }}>
              Vocabulary, comprehension, and discussion — built from the video. Free to try.
            </div>
          </div>
        )}

        <div style={{ color: '#ffffff', opacity: 0.5, fontSize: 20, display: 'flex' }}>
          lessoncaptain.com/video-lesson
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
