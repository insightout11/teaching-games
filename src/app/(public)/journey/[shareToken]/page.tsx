import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createServiceClient } from '@/lib/supabase/service';
import { getDestinationById } from '@/data/world-flight/destinations';
import { getPlaneAsset, PLANE_TIERS } from '@/lib/plane-progression';
import { PlaneTakeoff, MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface JourneyData {
  className: string;
  totalKm: number;
  planeName: string;
  tierLabel: string;
  stops: Array<{ id: string; city: string; country: string; lat: number; lng: number; date: string | null }>;
}

async function loadJourney(shareToken: string): Promise<JourneyData | null> {
  if (!UUID_RE.test(shareToken)) return null;
  const supabase = createServiceClient();

  const { data: state } = await supabase
    .from('class_world_flight_state')
    .select('class_id, plane_tier, plane_key, share_enabled')
    .eq('share_token', shareToken)
    .maybeSingle();

  if (!state || !state.share_enabled) return null;

  const [{ data: cls }, { data: legs }] = await Promise.all([
    supabase.from('classes').select('name').eq('id', state.class_id).maybeSingle(),
    supabase
      .from('class_world_flight_legs')
      .select('destination_id, distance_km, completed_at')
      .eq('class_id', state.class_id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true }),
  ]);

  const legRows = (legs ?? []) as Array<{ destination_id: string; distance_km: number; completed_at: string | null }>;
  const totalKm = Math.round(legRows.reduce((s, l) => s + (l.distance_km ?? 0), 0));

  const stops = legRows
    .map((l) => {
      const dest = getDestinationById(l.destination_id);
      if (!dest) return null;
      return { id: dest.id, city: dest.city, country: dest.country, lat: dest.lat, lng: dest.lng, date: l.completed_at };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const plane = getPlaneAsset(state.plane_key);
  const tierLabel = PLANE_TIERS.find((t) => t.tier === state.plane_tier)?.label ?? 'Starter';

  return {
    className: cls?.name ?? 'A class',
    totalKm,
    planeName: plane.name,
    tierLabel,
    stops,
  };
}

export async function generateMetadata({ params }: { params: { shareToken: string } }): Promise<Metadata> {
  const data = await loadJourney(params.shareToken);
  if (!data) return { title: 'Journey not found · LessonCaptain' };
  const title = `${data.className} has flown ${data.totalKm.toLocaleString()} km`;
  return {
    title: `${title} · LessonCaptain`,
    description: `Follow ${data.className}'s World Flight journey across ${data.stops.length} cities, powered by live English lessons.`,
    robots: { index: true, follow: true },
  };
}

// Equirectangular projection into a 720×360 viewBox.
function project(lat: number, lng: number): { x: number; y: number } {
  return { x: ((lng + 180) / 360) * 720, y: ((90 - lat) / 180) * 360 };
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function JourneyPage({ params }: { params: { shareToken: string } }) {
  const data = await loadJourney(params.shareToken);
  if (!data) notFound();

  const points = data.stops.map((s) => project(s.lat, s.lng));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-cyan-300/15 bg-[#070b14]/70 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-cyan-300">
          <PlaneTakeoff className="h-5 w-5" aria-hidden />
          <span className="font-instrument text-[11px] uppercase tracking-[0.22em]">World Flight journey</span>
        </div>
        <h1 className="mt-3 text-2xl font-bold text-lc-text">
          {data.className} has flown {data.totalKm.toLocaleString()} km
        </h1>
        <p className="mt-1 text-sm text-lc-text3">
          {data.stops.length} {data.stops.length === 1 ? 'city' : 'cities'} visited · flying the {data.planeName} ({data.tierLabel})
        </p>

        {/* Route map — a lightweight world projection of the cities flown */}
        {points.length > 0 && (
          <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-[#0a1424]">
            <svg viewBox="0 0 720 360" className="h-auto w-full" role="img" aria-label="Route flown">
              <rect width="720" height="360" fill="#0a1424" />
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="rgba(56,189,248,0.6)"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  strokeLinecap="round"
                />
              )}
              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 5 : 3.5} fill={i === points.length - 1 ? '#fbbf24' : '#38bdf8'} />
              ))}
            </svg>
          </div>
        )}

        {/* Cities visited with dates */}
        <ol className="mt-6 space-y-2">
          {data.stops.map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
              <MapPin className="h-4 w-4 shrink-0 text-cyan-300/80" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-lc-text">{s.city}, {s.country}</span>
                {s.date && (
                  <span className="font-instrument block text-[10px] uppercase tracking-wider text-lc-text3">{formatDate(s.date)}</span>
                )}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-7 border-t border-white/10 pt-5 text-center">
          <p className="font-instrument text-[11px] uppercase tracking-wider text-lc-text3">
            Powered by LessonCaptain — live lessons that fly
          </p>
          <a
            href="/"
            className="mt-3 inline-block rounded-full border border-amber-300/40 bg-amber-400/[0.08] px-5 py-2 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-400/15"
          >
            Start your class&apos;s journey
          </a>
        </div>
      </div>
    </div>
  );
}
