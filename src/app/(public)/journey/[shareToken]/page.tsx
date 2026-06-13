import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { createServiceClient } from '@/lib/supabase/service';
import { getDestinationById } from '@/data/world-flight/destinations';
import { getPlaneAsset, PLANE_TIERS } from '@/lib/plane-progression';
import { Gauge, MapPin, PlaneTakeoff, Route, Stamp } from 'lucide-react';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface JourneyStop {
  id: string;
  city: string;
  country: string;
  airport: string;
  lat: number;
  lng: number;
  date: string | null;
}

interface JourneyData {
  className: string;
  totalKm: number;
  planeName: string;
  tierLabel: string;
  stops: JourneyStop[];
  hero: { url: string; alt: string; sourceName: string; sourceUrl: string } | null;
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
      .select('origin_destination_id, destination_id, distance_km, completed_at')
      .eq('class_id', state.class_id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true }),
  ]);

  const legRows = (legs ?? []) as Array<{
    origin_destination_id: string | null;
    destination_id: string;
    distance_km: number;
    completed_at: string | null;
  }>;
  const totalKm = Math.round(legRows.reduce((sum, leg) => sum + (leg.distance_km ?? 0), 0));
  const orderedDestinationIds = [
    ...(legRows[0]?.origin_destination_id ? [legRows[0].origin_destination_id] : []),
    ...legRows.map((leg) => leg.destination_id),
  ];

  const stops = orderedDestinationIds
    .map((destinationId, index) => {
      const destination = getDestinationById(destinationId);
      if (!destination) return null;
      return {
        id: destination.id,
        city: destination.city,
        country: destination.country,
        airport: destination.primaryAirport,
        lat: destination.lat,
        lng: destination.lng,
        date: index === 0 && legRows[0]?.origin_destination_id ? null : legRows[index - (legRows[0]?.origin_destination_id ? 1 : 0)]?.completed_at ?? null,
      };
    })
    .filter((stop): stop is JourneyStop => stop !== null);

  const finalDestination = stops.length ? getDestinationById(stops[stops.length - 1].id) : null;
  const plane = getPlaneAsset(state.plane_key);
  const tierLabel = PLANE_TIERS.find((tier) => tier.tier === state.plane_tier)?.label ?? 'Starter';

  return {
    className: cls?.name ?? 'A class',
    totalKm,
    planeName: plane.name,
    tierLabel,
    stops,
    hero: finalDestination ? {
      url: finalDestination.heroImage.url,
      alt: finalDestination.heroImage.alt,
      sourceName: finalDestination.heroImage.sourceName,
      sourceUrl: finalDestination.heroImage.sourceUrl,
    } : null,
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

function project(lat: number, lng: number): { x: number; y: number } {
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

function formatDate(iso: string | null): string {
  if (!iso) return 'Journey origin';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function JourneyPage({ params }: { params: { shareToken: string } }) {
  const data = await loadJourney(params.shareToken);
  if (!data) notFound();

  const points = data.stops.map((stop) => project(stop.lat, stop.lng));
  const pathD = curvedRoutePath(points);
  const finalStop = data.stops[data.stops.length - 1] ?? null;

  return (
    <main className="min-h-screen bg-[var(--wf-bg)]">
      <header className="border-b border-cyan-200/15 bg-[var(--wf-inset)] px-5 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lessoncaptain-logo-on-dark.svg" alt="LessonCaptain" className="h-7 w-auto" />
          <span className="font-instrument text-[11px] uppercase tracking-[0.16em] text-cyan-100/75">Public class journey</span>
        </div>
      </header>

      {data.hero && (
        <section className="relative h-[340px] overflow-hidden border-b border-cyan-200/15">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.hero.url} alt={data.hero.alt} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--wf-bg)] via-[rgba(7,17,31,0.58)] to-[rgba(7,17,31,0.2)]" />
          <div className="relative mx-auto flex h-full max-w-5xl flex-col justify-end px-5 pb-8">
            <div className="flex items-center gap-2 text-cyan-100">
              <PlaneTakeoff className="h-5 w-5" aria-hidden />
              <span className="font-instrument text-[11px] font-semibold uppercase tracking-[0.16em]">World Flight journey</span>
            </div>
            <h1 className="font-display mt-3 max-w-3xl text-4xl leading-tight text-white sm:text-5xl">
              {data.className} has flown {data.totalKm.toLocaleString()} km
            </h1>
            <p className="mt-3 text-base text-white/75">
              {data.stops.length} {data.stops.length === 1 ? 'city' : 'cities'} visited
              {finalStop ? ` · currently in ${finalStop.city}, ${finalStop.country}` : ''}
            </p>
            <a href={data.hero.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 w-fit text-[11px] text-white/55 hover:text-white/80">
              Photo: {data.hero.sourceName}
            </a>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-5xl px-5 py-8">
        <section className="grid gap-px overflow-hidden rounded-lg border border-cyan-200/15 bg-cyan-200/15 sm:grid-cols-3">
          <JourneyStat icon={<Route className="h-4 w-4" />} label="Distance flown" value={`${data.totalKm.toLocaleString()} km`} />
          <JourneyStat icon={<MapPin className="h-4 w-4" />} label="Cities visited" value={data.stops.length.toString()} />
          <JourneyStat icon={<Gauge className="h-4 w-4" />} label="Aircraft" value={`${data.planeName} · ${data.tierLabel}`} />
        </section>

        {points.length > 0 && (
          <section className="mt-8 overflow-hidden rounded-lg border border-cyan-200/15 bg-[var(--wf-surface)]">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="font-display text-2xl text-lc-text">The route so far</h2>
            </div>
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/world-map-outline.svg" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-25" />
              <svg viewBox="0 0 720 360" className="relative h-auto w-full" role="img" aria-label="Route flown">
                {pathD && <path d={pathD} fill="none" stroke="#67E8F9" strokeWidth={2.4} strokeLinecap="round" opacity={0.8} />}
                {points.map((point, index) => (
                  <g key={`${point.x}-${point.y}`}>
                    <circle cx={point.x} cy={point.y} r={index === points.length - 1 ? 7 : 5} fill={index === points.length - 1 ? '#F59E0B' : '#4DA3FF'} opacity={0.24} />
                    <circle cx={point.x} cy={point.y} r={index === points.length - 1 ? 4 : 2.8} fill={index === points.length - 1 ? '#F59E0B' : '#67E8F9'} />
                  </g>
                ))}
              </svg>
            </div>
          </section>
        )}

        <section className="mt-8">
          <div className="flex items-center gap-2">
            <Stamp className="h-5 w-5 text-cyan-200" aria-hidden />
            <h2 className="font-display text-2xl text-lc-text">Passport stamps</h2>
          </div>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.stops.map((stop, index) => (
              <li key={`${stop.id}-${index}`} className="border-2 border-dashed border-cyan-200/30 bg-cyan-300/[0.035] p-2 text-center text-cyan-100/85">
                <div className="flex min-h-36 flex-col items-center justify-center border border-current/20 px-3 py-4">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-75">{stop.country}</span>
                  <span className="font-instrument mt-1 text-3xl font-black tracking-widest">{stop.airport}</span>
                  <span className="mt-2 text-base font-bold">{stop.city}</span>
                  <span className="mt-2 text-[11px] font-semibold uppercase tracking-wide opacity-65">{formatDate(stop.date)}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <footer className="mt-10 border-t border-white/10 py-7 text-center">
          <p className="text-sm text-lc-text2">Live lessons turned into a class journey around the world.</p>
          <a href="/" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-lc-blue px-5 text-sm font-bold text-[var(--wf-bg)] transition-colors hover:bg-lc-blue-hover">
            Start your class&apos;s journey
          </a>
        </footer>
      </div>
    </main>
  );
}

function JourneyStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[var(--wf-surface)] px-5 py-4">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-cyan-100/70">{icon}{label}</p>
      <p className="mt-2 text-lg font-semibold text-lc-text">{value}</p>
    </div>
  );
}
