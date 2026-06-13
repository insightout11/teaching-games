import { ImageResponse } from 'next/og';
import { createServiceClient } from '@/lib/supabase/service';
import { getDestinationById } from '@/data/world-flight/destinations';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Summary {
  className: string;
  totalKm: number;
  stops: Array<{ x: number; y: number }>;
  heroUrl: string | null;
  finalCity: string | null;
  completedExpeditionCount: number;
}

function project(lat: number, lng: number) {
  return { x: ((lng + 180) / 360) * 720, y: ((90 - lat) / 180) * 360 };
}

function curvedRoutePath(points: Array<{ x: number; y: number }>) {
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    const previous = points[index - 1];
    const midpointX = (previous.x + point.x) / 2;
    const midpointY = (previous.y + point.y) / 2 - Math.min(38, Math.abs(point.x - previous.x) * 0.12 + 12);
    return `${path} Q ${midpointX.toFixed(1)} ${midpointY.toFixed(1)} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
  }, '');
}

async function loadSummary(shareToken: string): Promise<Summary | null> {
  if (!UUID_RE.test(shareToken)) return null;
  const supabase = createServiceClient();
  const { data: state } = await supabase
    .from('class_world_flight_state')
    .select('class_id, share_enabled')
    .eq('share_token', shareToken)
    .maybeSingle();
  if (!state || !state.share_enabled) return null;

  const [{ data: cls }, { data: legs }, { count: completedExpeditionCount }] = await Promise.all([
    supabase.from('classes').select('name').eq('id', state.class_id).maybeSingle(),
    supabase
      .from('class_world_flight_legs')
      .select('origin_destination_id, destination_id, distance_km')
      .eq('class_id', state.class_id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true }),
    supabase
      .from('class_world_flight_expedition_runs')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', state.class_id)
      .eq('status', 'completed'),
  ]);

  const rows = (legs ?? []) as Array<{ origin_destination_id: string | null; destination_id: string; distance_km: number }>;
  const destinationIds = [
    ...(rows[0]?.origin_destination_id ? [rows[0].origin_destination_id] : []),
    ...rows.map((row) => row.destination_id),
  ];
  const destinations = destinationIds.map((id) => getDestinationById(id)).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const finalDestination = destinations[destinations.length - 1] ?? null;

  return {
    className: cls?.name ?? 'A class',
    totalKm: Math.round(rows.reduce((sum, row) => sum + (row.distance_km ?? 0), 0)),
    stops: destinations.map((destination) => project(destination.lat, destination.lng)),
    heroUrl: finalDestination?.heroImage.url ?? null,
    finalCity: finalDestination?.city ?? null,
    completedExpeditionCount: completedExpeditionCount ?? 0,
  };
}

export default async function JourneyOgImage({ params }: { params: { shareToken: string } }) {
  const summary = await loadSummary(params.shareToken);
  const headline = summary
    ? `${summary.className} has flown ${summary.totalKm.toLocaleString()} km`
    : 'A World Flight journey';
  const pathD = curvedRoutePath(summary?.stops ?? []);

  return new ImageResponse(
    (
      <div
        style={{
          background: '#07111f',
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          color: '#eaf1ff',
        }}
      >
        {summary?.heroUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={summary.heroUrl}
            alt=""
            width={1200}
            height={630}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.28 }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(7,17,31,0.98) 0%, rgba(7,17,31,0.88) 55%, rgba(7,17,31,0.48) 100%)' }} />

        <div style={{ width: 690, display: 'flex', flexDirection: 'column', padding: '58px 0 52px 70px', position: 'relative' }}>
          <div style={{ display: 'flex', fontSize: 28, fontWeight: 700 }}>
            <span style={{ color: '#eaf1ff' }}>Lesson</span><span style={{ color: '#4da3ff' }}>Captain</span>
          </div>
          <div style={{ color: '#67e8f9', fontSize: 18, fontWeight: 700, letterSpacing: 4, marginTop: 32, display: 'flex' }}>
            WORLD FLIGHT JOURNEY
          </div>
          <div style={{ color: '#ffffff', fontSize: 62, fontWeight: 800, lineHeight: 1.08, marginTop: 18, display: 'flex' }}>
            {headline}
          </div>
          <div style={{ color: '#b4c3d3', fontSize: 25, marginTop: 24, display: 'flex' }}>
            {summary?.completedExpeditionCount
              ? `${summary.completedExpeditionCount} completed expedition${summary.completedExpeditionCount === 1 ? '' : 's'} · currently exploring ${summary.finalCity ?? 'the world'}`
              : summary?.finalCity ? `Currently exploring ${summary.finalCity}` : 'A class journey powered by live lessons'}
          </div>
          <div style={{ marginTop: 'auto', color: '#91a4b9', fontSize: 18, display: 'flex' }}>
            lessoncaptain.com
          </div>
        </div>

        <div style={{ position: 'relative', width: 470, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingRight: 40 }}>
          <svg width="470" height="300" viewBox="0 0 720 360">
            <g fill="#71869a" opacity="0.38">
              <polygon points="381,78 433,17 456,20 463,67" />
              <polygon points="34,73 118,90 157,112 165,146 204,196 259,211 280,179 294,129 327,123 324,95 280,56 168,56" />
              <polygon points="288,230 330,221 409,265 367,342 322,405 308,405 293,359 277,252" />
              <polygon points="477,152 493,90 521,78 578,56 667,50 751,50 863,50 978,67 923,106 853,160 793,224 718,229 623,218 589,168" transform="scale(.72 1)" />
              <polygon points="486,152 469,174 452,211 454,245 470,253 533,303 548,347 577,347 602,303 621,218 592,168 534,149" transform="scale(.72 1)" />
              <polygon points="824,314 869,286 903,280 925,359 892,365 837,347" transform="scale(.72 1)" />
            </g>
            {pathD && <path d={pathD} fill="none" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round" />}
            {(summary?.stops ?? []).map((point, index) => (
              <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r={index === (summary?.stops.length ?? 0) - 1 ? 7 : 5} fill={index === (summary?.stops.length ?? 0) - 1 ? '#f59e0b' : '#67e8f9'} />
            ))}
          </svg>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
