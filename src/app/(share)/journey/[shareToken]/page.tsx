import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BookOpen, Compass, Gauge, MapPin, NotebookTabs, PlaneTakeoff, Route, Stamp, Trophy } from 'lucide-react';
import { getDestinationById } from '@/data/world-flight/destinations';
import { PublicShareHeader } from '@/components/public/public-share-header';
import { PublicJourneyMap, type PublicJourneyMapStop } from '@/components/world-flight/public-journey-map';
import { getPlaneAsset, PLANE_TIERS } from '@/lib/plane-progression';
import { createServiceClient } from '@/lib/supabase/service';
import { getWorldFlightExpedition } from '@/lib/world-flight/expeditions';
import { deriveInvestigationTags, deriveWorldFlightInvestigationProgress, type CompletedWorldFlightEvidence } from '@/lib/world-flight/investigations';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface JourneyData {
  className: string;
  logbookShareToken: string | null;
  totalKm: number;
  planeName: string;
  tierLabel: string;
  stops: PublicJourneyMapStop[];
  cityCount: number;
  countryCount: number;
  regionCount: number;
  lessonCount: number;
  fieldNoteCount: number;
  missionCompletedCount: number;
  missionReadyCount: number;
  flightHours: number;
  crewStars: number;
  completedExpeditions: Array<{
    id: string;
    title: string;
    centralQuestion: string;
    completedAt: string | null;
    cityNames: string[];
  }>;
  hero: { url: string; alt: string; sourceName: string; sourceUrl: string } | null;
}

async function loadJourney(shareToken: string): Promise<JourneyData | null> {
  if (!UUID_RE.test(shareToken)) return null;
  const supabase = createServiceClient();

  const { data: state } = await supabase
    .from('class_world_flight_state')
    .select('class_id, plane_tier, plane_key, flight_hours, crew_stars, share_enabled')
    .eq('share_token', shareToken)
    .maybeSingle();

  if (!state || !state.share_enabled) return null;

  const [{ data: cls }, { data: legs }, { data: completedMissions }, { data: completedExpeditionRuns }] = await Promise.all([
    supabase.from('classes').select('name, logbook_share_enabled, logbook_share_token').eq('id', state.class_id).maybeSingle(),
    supabase
      .from('class_world_flight_legs')
      .select('origin_destination_id, destination_id, distance_km, completed_at, evidence_snapshot')
      .eq('class_id', state.class_id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true }),
    supabase
      .from('class_world_flight_design_missions')
      .select('investigation_id')
      .eq('class_id', state.class_id)
      .eq('status', 'completed'),
    supabase
      .from('class_world_flight_expedition_runs')
      .select('id, expedition_id, visited_destination_ids, completed_at')
      .eq('class_id', state.class_id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false }),
  ]);

  const legRows = (legs ?? []) as Array<{
    origin_destination_id: string | null;
    destination_id: string;
    distance_km: number;
    completed_at: string | null;
    evidence_snapshot: CompletedWorldFlightEvidence['evidenceSnapshot'];
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
        region: destination.region,
        lat: destination.lat,
        lng: destination.lng,
        date: index === 0 && legRows[0]?.origin_destination_id
          ? null
          : legRows[index - (legRows[0]?.origin_destination_id ? 1 : 0)]?.completed_at ?? null,
      };
    })
    .filter((stop): stop is PublicJourneyMapStop => stop !== null);

  const finalDestination = stops.length ? getDestinationById(stops[stops.length - 1].id) : null;
  const plane = getPlaneAsset(state.plane_key);
  const tierLabel = PLANE_TIERS.find((tier) => tier.tier === state.plane_tier)?.label ?? 'Starter';
  const uniqueStops = Array.from(new Map(stops.map((stop) => [stop.id, stop])).values());
  const completedEvidence: CompletedWorldFlightEvidence[] = legRows.map((leg) => ({
    destinationId: leg.destination_id,
    completedAt: leg.completed_at,
    evidenceSnapshot: leg.evidence_snapshot,
  }));
  const investigations = deriveWorldFlightInvestigationProgress(completedEvidence);
  const completedMissionIds = new Set((completedMissions ?? []).map((mission) => mission.investigation_id));
  const fieldNotes = new Set(legRows.flatMap((leg) => (
    deriveInvestigationTags(
      Array.isArray(leg.evidence_snapshot?.skills) ? leg.evidence_snapshot.skills : [],
      Array.isArray(leg.evidence_snapshot?.investigationTags) ? leg.evidence_snapshot.investigationTags : [],
    )
  )));
  const completedExpeditions = ((completedExpeditionRuns ?? []) as Array<{
    id: string;
    expedition_id: string;
    visited_destination_ids: string[] | null;
    completed_at: string | null;
  }>).flatMap((run) => {
    const expedition = getWorldFlightExpedition(run.expedition_id);
    if (!expedition) return [];
    return [{
      id: run.id,
      title: expedition.title,
      centralQuestion: expedition.centralQuestion,
      completedAt: run.completed_at,
      cityNames: (run.visited_destination_ids ?? [])
        .map((destinationId) => getDestinationById(destinationId)?.city)
        .filter((city): city is string => Boolean(city)),
    }];
  });

  return {
    className: cls?.name ?? 'A class',
    logbookShareToken: cls?.logbook_share_enabled ? cls.logbook_share_token : null,
    totalKm,
    planeName: plane.name,
    tierLabel,
    stops,
    cityCount: uniqueStops.length,
    countryCount: new Set(uniqueStops.map((stop) => stop.country)).size,
    regionCount: new Set(uniqueStops.map((stop) => stop.region)).size,
    lessonCount: legRows.length,
    fieldNoteCount: fieldNotes.size,
    missionCompletedCount: completedMissionIds.size,
    missionReadyCount: investigations.filter((investigation) => investigation.complete && !completedMissionIds.has(investigation.id)).length,
    flightHours: state.flight_hours ?? 0,
    crewStars: state.crew_stars ?? 0,
    completedExpeditions,
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
  if (!data) return { title: 'Journey not found - LessonCaptain' };
  const title = `${data.className} has flown ${data.totalKm.toLocaleString()} km`;
  return {
    title: `${title} - LessonCaptain`,
    description: `Follow ${data.className}'s World Flight journey across ${data.cityCount} cities and ${data.lessonCount} completed lessons.`,
    robots: { index: true, follow: true },
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Journey origin';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function JourneyPage({ params }: { params: { shareToken: string } }) {
  const data = await loadJourney(params.shareToken);
  if (!data) notFound();

  const finalStop = data.stops[data.stops.length - 1] ?? null;
  const shareTitle = `${data.className} World Flight journey`;
  const shareText = `${data.className} has flown ${data.totalKm.toLocaleString()} km across ${data.cityCount} ${data.cityCount === 1 ? 'city' : 'cities'} with LessonCaptain.`;

  return (
    <main className="min-h-screen bg-[#07111f] text-lc-text">
      <PublicShareHeader
        activeTab="journey"
        journeyHref={`/journey/${params.shareToken}`}
        logbookHref={data.logbookShareToken ? `/logbook/${data.logbookShareToken}` : null}
        label="Public class journey"
        shareTitle={shareTitle}
        shareText={shareText}
      />

      <section className="relative overflow-hidden border-b border-cyan-200/15 bg-[#081625]">
        {data.hero && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.hero.url} alt={data.hero.alt} className="absolute inset-0 h-full w-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_22%,rgba(77,163,255,0.18),transparent_34%),linear-gradient(90deg,rgba(7,17,31,0.98)_0%,rgba(7,17,31,0.86)_48%,rgba(7,17,31,0.58)_100%)]" />
          </>
        )}
        <div className="relative mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-5 sm:py-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end lg:px-10 lg:py-16">
          <div>
            <div className="flex items-center gap-2 text-cyan-100">
              <PlaneTakeoff className="h-5 w-5" aria-hidden />
              <span className="font-instrument text-[11px] font-semibold uppercase tracking-[0.16em]">World Flight journey</span>
            </div>
            <h1 className="font-display mt-3 max-w-3xl text-3xl leading-tight text-white sm:text-5xl">
              {data.className} has flown {data.totalKm.toLocaleString()} km
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/74">
              {data.cityCount} {data.cityCount === 1 ? 'city' : 'cities'} visited across {data.countryCount} {data.countryCount === 1 ? 'country' : 'countries'}
              {finalStop ? ` - currently in ${finalStop.city}, ${finalStop.country}` : ''}
            </p>
          </div>

          <div className="rounded-lg border border-cyan-200/15 bg-slate-950/68 p-4 shadow-2xl shadow-black/30 backdrop-blur">
            <p className="font-instrument text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100/60">Now exploring</p>
            <p className="font-display mt-2 text-3xl text-white">{finalStop ? finalStop.city : 'World Flight'}</p>
            <p className="mt-1 text-sm text-lc-text2">{finalStop ? `${finalStop.country} - ${finalStop.airport}` : 'The class journey is ready to begin.'}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <HeroMetric label="Aircraft" value={data.planeName} />
              <HeroMetric label="Tier" value={data.tierLabel} />
              <HeroMetric label="Hours" value={data.flightHours.toLocaleString()} />
              <HeroMetric label="Stars" value={data.crewStars.toLocaleString()} />
            </div>
            {data.hero && (
              <a href={data.hero.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[11px] text-white/45 transition-colors hover:text-white/75">
                Photo: {data.hero.sourceName}
              </a>
            )}
          </div>
        </div>
      </section>

      {data.stops.length > 0 && (
        <PublicJourneyMap stops={data.stops} totalKm={data.totalKm} className={data.className} />
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-5 lg:px-10">
        <section className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:gap-px sm:overflow-hidden sm:rounded-lg sm:border sm:border-cyan-200/15 sm:bg-cyan-200/15 sm:px-0 sm:pb-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-9">
          <JourneyStat icon={<Route className="h-4 w-4" />} label="Distance flown" value={`${data.totalKm.toLocaleString()} km`} />
          <JourneyStat icon={<MapPin className="h-4 w-4" />} label="Cities visited" value={data.cityCount.toString()} />
          <JourneyStat icon={<MapPin className="h-4 w-4" />} label="Countries and regions" value={`${data.countryCount} countries - ${data.regionCount} regions`} />
          <JourneyStat icon={<BookOpen className="h-4 w-4" />} label="Lessons completed" value={data.lessonCount.toString()} />
          <JourneyStat icon={<NotebookTabs className="h-4 w-4" />} label="Field notes" value={data.fieldNoteCount.toString()} />
          <JourneyStat icon={<Trophy className="h-4 w-4" />} label="Design missions" value={`${data.missionCompletedCount} completed - ${data.missionReadyCount} ready`} />
          <JourneyStat icon={<Compass className="h-4 w-4" />} label="Expeditions" value={`${data.completedExpeditions.length} completed`} />
          <JourneyStat icon={<PlaneTakeoff className="h-4 w-4" />} label="Crew progression" value={`${data.flightHours} flight hours - ${data.crewStars} crew stars`} />
          <JourneyStat icon={<Gauge className="h-4 w-4" />} label="Aircraft" value={`${data.planeName} - ${data.tierLabel}`} />
        </section>

        <section className="mt-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-2">
              <Stamp className="h-5 w-5 text-cyan-200" aria-hidden />
              <h2 className="font-display text-2xl text-lc-text">Passport stamps</h2>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lc-text3">{data.stops.length} collected</p>
          </div>
          <ol className="-mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.stops.map((stop, index) => (
              <li key={`${stop.id}-${index}`} className="min-w-[245px] snap-start border-2 border-dashed border-cyan-200/30 bg-cyan-300/[0.035] p-2 text-center text-cyan-100/85 sm:min-w-0">
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

        {data.completedExpeditions.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-rose-200" aria-hidden />
              <h2 className="font-display text-2xl text-lc-text">Completed expeditions</h2>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {data.completedExpeditions.map((expedition) => (
                <article key={expedition.id} className="border-l-2 border-rose-300/50 bg-rose-300/[0.045] px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-100/75">
                    {expedition.completedAt ? `Completed ${formatDate(expedition.completedAt)}` : 'Completed expedition'}
                  </p>
                  <h3 className="font-display mt-2 text-xl text-lc-text">{expedition.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-lc-text2">{expedition.centralQuestion}</p>
                  <p className="mt-3 text-xs leading-relaxed text-lc-text3">
                    {expedition.cityNames.length} stops - {expedition.cityNames.join(', ')}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-10 border-t border-white/10 py-7 text-center">
          <p className="text-sm text-lc-text2">Live lessons turned into a class journey around the world.</p>
          <a href="/" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-lc-blue px-5 text-sm font-bold text-[#07111f] transition-colors hover:bg-lc-blue-hover">
            Start your class&apos;s journey
          </a>
        </footer>
      </div>
    </main>
  );
}

function JourneyStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-[210px] rounded-lg border border-cyan-200/15 bg-[#0b1b2d] px-5 py-4 sm:min-w-0 sm:rounded-none sm:border-0">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-cyan-100/70">{icon}{label}</p>
      <p className="mt-2 text-lg font-semibold text-lc-text">{value}</p>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.045] px-3 py-2">
      <p className="font-instrument text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-100/50">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-cyan-50">{value}</p>
    </div>
  );
}
