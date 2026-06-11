import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function VideoLessonOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #071018 0%, #0e2438 60%, #0e7490 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '70px 90px',
        }}
      >
        <div style={{ color: '#67e8f9', fontSize: 24, fontWeight: 600, marginBottom: 20, display: 'flex' }}>
          ✈ LessonCaptain
        </div>
        <div style={{ color: '#ffffff', fontSize: 60, fontWeight: 800, lineHeight: 1.1, maxWidth: 1000 }}>
          Turn any YouTube video into a live English lesson
        </div>
        <div style={{ color: '#ffffff', opacity: 0.82, fontSize: 30, marginTop: 28, display: 'flex', maxWidth: 980 }}>
          Vocabulary, comprehension, and discussion — built from the video. Free to try.
        </div>
        <div style={{ marginTop: 'auto', color: '#ffffff', opacity: 0.5, fontSize: 20, display: 'flex' }}>
          lessoncaptain.com/video-lesson
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
