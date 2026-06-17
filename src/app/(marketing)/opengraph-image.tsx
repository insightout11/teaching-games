import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Captain's Flight stage count (the all-around-flight-60 preset). Static so the OG
// renders fast on edge with no data dependency — keep in sync with the preset's
// flightConfig.stages length in flight-plan-presets.ts (currently 9).
const STOPS = 9;

export default function HomeOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #060f1f 0%, #0b1c38 55%, #0e2438 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '72px 90px',
        }}
      >
        <div
          style={{
            color: '#67e8f9',
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginBottom: 24,
            display: 'flex',
          }}
        >
          ✈ LessonCaptain
        </div>
        <div
          style={{
            color: '#ffffff',
            fontSize: 66,
            fontWeight: 800,
            lineHeight: 1.08,
            maxWidth: 980,
            display: 'flex',
          }}
        >
          Run interactive ESL lessons while you screen share.
        </div>
        <div style={{ color: '#cbd5e1', fontSize: 30, marginTop: 26, maxWidth: 900, display: 'flex' }}>
          Paste a video, build a full lesson, and let students join from any browser.
        </div>

        {/* Route-strip motif — line + stops, the last one amber (landing) */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 56, position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: 8,
              right: 8,
              top: 13,
              height: 3,
              background: 'linear-gradient(90deg, #22d3ee, rgba(34,211,238,0.25))',
              display: 'flex',
            }}
          />
          {Array.from({ length: STOPS }).map((_, i) => {
            const isLast = i === STOPS - 1;
            return (
              <div
                key={i}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  marginRight: i === STOPS - 1 ? 0 : 96,
                  background: isLast ? '#f59e0b' : '#a5f3fc',
                  border: isLast ? '3px solid #fbbf24' : '3px solid #cffafe',
                  display: 'flex',
                  zIndex: 1,
                }}
              />
            );
          })}
        </div>

        <div style={{ marginTop: 'auto', color: '#ffffff', opacity: 0.5, fontSize: 22, display: 'flex' }}>
          lessoncaptain.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
