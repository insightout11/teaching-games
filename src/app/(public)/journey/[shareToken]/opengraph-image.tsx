import { ImageResponse } from 'next/og';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadSummary(shareToken: string): Promise<{ className: string; totalKm: number } | null> {
  if (!UUID_RE.test(shareToken)) return null;
  const supabase = createServiceClient();
  const { data: state } = await supabase
    .from('class_world_flight_state')
    .select('class_id, share_enabled')
    .eq('share_token', shareToken)
    .maybeSingle();
  if (!state || !state.share_enabled) return null;

  const [{ data: cls }, { data: legs }] = await Promise.all([
    supabase.from('classes').select('name').eq('id', state.class_id).maybeSingle(),
    supabase
      .from('class_world_flight_legs')
      .select('distance_km')
      .eq('class_id', state.class_id)
      .eq('status', 'completed'),
  ]);

  const totalKm = Math.round(
    ((legs ?? []) as Array<{ distance_km: number }>).reduce((s, l) => s + (l.distance_km ?? 0), 0),
  );
  return { className: cls?.name ?? 'A class', totalKm };
}

export default async function JourneyOgImage({ params }: { params: { shareToken: string } }) {
  const summary = await loadSummary(params.shareToken);
  const headline = summary
    ? `${summary.className} has flown ${summary.totalKm.toLocaleString()} km`
    : 'A World Flight journey';

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
          ✈ LessonCaptain · World Flight
        </div>
        <div style={{ color: '#ffffff', fontSize: 64, fontWeight: 800, lineHeight: 1.1, maxWidth: 1000 }}>
          {headline}
        </div>
        <div style={{ color: '#ffffff', opacity: 0.8, fontSize: 30, marginTop: 28, display: 'flex' }}>
          A class journey powered by live English lessons
        </div>
        <div style={{ marginTop: 'auto', color: '#ffffff', opacity: 0.5, fontSize: 20, display: 'flex' }}>
          lessoncaptain.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
