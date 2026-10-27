'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CockpitSky, cockpitCloudTint, setSkyV2 } from '@/components/live-room/flight/cockpit-sky';
import { CockpitClouds } from '@/components/live-room/flight/cockpit-clouds';
import { CockpitWorld } from '@/components/live-room/flight/cockpit-world';
import { composeTimedPalette } from '@/components/world-flight/arrival-scene/palettes';
import type { TimeOfDay } from '@/components/world-flight/arrival-scene/types';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { setPeakStyle } from '@/components/live-room/flight/peak-art';
import { setGroundRelief, setNightLights, setRealCoast, setRealRelief, setRealWaters, setSoftEdges } from '@/components/live-room/flight/ground-texture';
import { highGroundAhead, type HighGround } from '@/lib/live-room/elevation-ahead';
import { setRealEvents, type EventKind, type SceneEvent } from '@/components/live-room/flight/event-art';
import { coastAhead, type Coast } from '@/lib/live-room/coast-ahead';
import { watersAhead, type Waters } from '@/lib/live-room/waters-ahead';
import { setSkyClouds } from '@/components/live-room/flight/sky-clouds';
import type { Terrain } from '@/components/live-room/flight/cockpit-ground';

const RANGES: Array<{ region: string; label: string }> = [
  { region: 'Europe', label: 'Alpine (Europe): snowy' },
  { region: 'Asia', label: 'Asia: mixed snow and forest' },
  { region: 'Africa', label: 'Arid (Africa): bare rock' },
];
const TIMES: TimeOfDay[] = ['day', 'dusk', 'night'];

function Cell({ region, tod, moving, terrain = 'mountains', cover }: { region: string; tod: TimeOfDay; moving: boolean; terrain?: Terrain; cover?: number }) {
  const dest = WORLD_DESTINATIONS.find((d) => d.scene) ?? WORLD_DESTINATIONS[0];
  const palette = useMemo(() => composeTimedPalette(tod, dest.scene!), [tod, dest]);
  // a still picture: draw for a moment, then stop drawing (so a page of pictures costs nothing)
  const [hold, setHold] = useState(false);
  useEffect(() => { if (moving) return; const t = setTimeout(() => setHold(true), 1500); return () => clearTimeout(t); }, [moving]);
  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-black">
      <CockpitSky palette={palette} timeOfDay={tod} altitude={1} />
      <CockpitWorld terrain={terrain} region={region} palette={palette} night={tod === 'night'} cloudCover={cover} speed={moving ? 0.55 : 0.0001} paused={!moving && hold} />
      {/* the old eye-level clouds too, as the room shows them (the mix classes see) */}
      {cover !== undefined && <CockpitClouds speed={moving ? 0.55 : 0.0001} tint={cockpitCloudTint(palette, tod)} density={Math.min(1, 0.3 + (cover / 100) * 0.8)} horizon={0.58} paused={!moving && hold} />}
    </div>
  );
}

/** Frames per second, measured over the last second (60 = smooth; under 40 = visibly jerky). */
function Fps() {
  const [fps, setFps] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    let frames = 0, t0 = performance.now();
    const tick = (t: number) => {
      frames++;
      if (t - t0 >= 1000) { setFps(Math.round((frames * 1000) / (t - t0))); frames = 0; t0 = t; }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);
  return <span className={`rounded-full px-3 py-1 font-mono text-xs ${fps >= 50 ? 'bg-emerald-500/20 text-emerald-200' : fps >= 35 ? 'bg-amber-500/20 text-amber-200' : 'bg-rose-500/20 text-rose-200'}`}>{fps} frames a second</span>;
}

/** Real rivers and lakes from the cockpit, over real places (Natural Earth data via Codex). */
const WATERS: Array<{ id: string; label: string; at: { lat: number; lng: number }; heading: number; terrain: Terrain; region: string }> = [
  { id: 'nile', label: 'The Nile, flying north from Luxor', at: { lat: 25.4, lng: 32.55 }, heading: 340, terrain: 'desert', region: 'Africa' },
  { id: 'mekong', label: 'The Mekong at Phnom Penh', at: { lat: 11.2, lng: 104.9 }, heading: 0, terrain: 'paddies', region: 'Asia' },
  { id: 'amazon', label: 'The Amazon near Manaus', at: { lat: -3.2, lng: -60.6 }, heading: 80, terrain: 'rainforest', region: 'South America' },
  { id: 'ontario', label: 'Lake Ontario from the north', at: { lat: 44.4, lng: -78.6 }, heading: 190, terrain: 'farmland', region: 'North America' },
  { id: 'danube', label: 'The Danube, Vienna to Budapest', at: { lat: 48.15, lng: 16.6 }, heading: 115, terrain: 'farmland', region: 'Europe' },
  { id: 'victoria', label: 'Lake Victoria from Kampala', at: { lat: 0.6, lng: 32.6 }, heading: 180, terrain: 'savanna', region: 'Africa' },
];
const COASTS: Array<{ id: string; label: string; at: { lat: number; lng: number }; heading: number; terrain: Terrain; region: string }> = [
  { id: 'sydney', label: 'Sydney, flying out to sea', at: { lat: -33.75, lng: 150.75 }, heading: 95, terrain: 'farmland', region: 'Australia' },
  { id: 'fjords', label: 'The Norwegian fjords, towards the sea', at: { lat: 61.1, lng: 7.6 }, heading: 265, terrain: 'forest', region: 'Europe' },
  { id: 'greece', label: 'The Greek islands', at: { lat: 37.95, lng: 23.7 }, heading: 140, terrain: 'farmland', region: 'Europe' },
  { id: 'hongkong', label: 'Hong Kong and its islands', at: { lat: 22.75, lng: 114.1 }, heading: 185, terrain: 'farmland', region: 'Asia' },
  { id: 'capetown', label: 'Cape Town and the Cape', at: { lat: -33.6, lng: 18.75 }, heading: 205, terrain: 'farmland', region: 'Africa' },
  { id: 'keys', label: 'The Florida Keys', at: { lat: 25.6, lng: -80.45 }, heading: 215, terrain: 'farmland', region: 'North America' },
];
const RELIEFS: Array<{ id: string; label: string; at: { lat: number; lng: number }; heading: number; terrain: Terrain; region: string }> = [
  { id: 'alps', label: 'Into the Alps from Zurich', at: { lat: 47.2, lng: 8.5 }, heading: 165, terrain: 'farmland', region: 'Europe' },
  { id: 'himalaya', label: 'The Himalaya from Kathmandu', at: { lat: 27.5, lng: 85.3 }, heading: 60, terrain: 'forest', region: 'Asia' },
  { id: 'andes', label: 'Across the Andes from Santiago', at: { lat: -33.45, lng: -71.2 }, heading: 85, terrain: 'farmland', region: 'South America' },
  { id: 'rockies', label: 'The Rockies west of Denver', at: { lat: 39.75, lng: -104.6 }, heading: 270, terrain: 'grassland', region: 'North America' },
  { id: 'tibet', label: 'The Tibetan plateau', at: { lat: 31.5, lng: 87.5 }, heading: 90, terrain: 'tundra', region: 'Asia' },
  { id: 'netherlands', label: 'The flat Netherlands (no mountains)', at: { lat: 52.2, lng: 4.6 }, heading: 90, terrain: 'farmland', region: 'Europe' },
];
const EVENTS: Array<{ kind: EventKind; label: string; terrain: Terrain; region: string }> = [
  { kind: 'fire', label: 'A wildfire (smoke)', terrain: 'forest', region: 'North America' },
  { kind: 'volcano', label: 'An erupting volcano (ash and steam)', terrain: 'farmland', region: 'Asia' },
  { kind: 'storm', label: 'A storm (a tall storm cloud)', terrain: 'ocean', region: 'Asia' },
];
function EventView({ kind, tod, far }: { kind: EventKind; tod: TimeOfDay; far?: boolean }) {
  const scene = EVENTS.find((e) => e.kind === kind) ?? EVENTS[0];
  useEffect(() => { setRealEvents(true); }, []);
  const events = useMemo<SceneEvent[]>(() => [{ id: `demo-${kind}`, kind, ahead: far ? 140 : 70, lateral: far ? -55 : -18 }], [kind, far]);
  const dest = WORLD_DESTINATIONS.find((d) => d.scene) ?? WORLD_DESTINATIONS[0];
  const palette = useMemo(() => composeTimedPalette(tod, dest.scene!), [tod, dest]);
  return (
    <div className="min-h-screen bg-[#070b14] p-4 text-white">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <a href="?" className="text-sm text-cyan-200 underline">Back to all</a>
        {(['day', 'dusk', 'night'] as TimeOfDay[]).map((t) => <a key={t} href={`?event=${kind}&tod=${t}`} className="text-sm text-cyan-200 underline">{t}</a>)}
        <Fps />
        <span className="font-mono text-xs text-white/60">{scene.label} · {tod} · reload to fly past again</span>
      </div>
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-black">
        <CockpitSky palette={palette} timeOfDay={tod} altitude={1} />
        <CockpitWorld terrain={scene.terrain} region={scene.region} palette={palette} night={tod === 'night'} speed={0.35} events={events} cloudCover={kind === 'storm' ? 85 : 15} />
      </div>
    </div>
  );
}

function ReliefView({ id, tod }: { id: string; tod: TimeOfDay }) {
  const place = RELIEFS.find((p) => p.id === id) ?? RELIEFS[0];
  const [ground, setGround] = useState<HighGround | undefined>(undefined);
  useEffect(() => { setRealRelief(true); void highGroundAhead(place.at, place.heading).then(setGround); }, [place]);
  // ?alt=0.25 shows the view low in the descent (1 = cruise height)
  const [alt, setAlt] = useState(1);
  useEffect(() => { setAlt(Number(new URLSearchParams(window.location.search).get('alt') ?? '1') || 1); }, []);
  const dest = WORLD_DESTINATIONS.find((d) => d.scene) ?? WORLD_DESTINATIONS[0];
  const palette = useMemo(() => composeTimedPalette(tod, dest.scene!), [tod, dest]);
  return (
    <div className="min-h-screen bg-[#070b14] p-4 text-white">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <a href="?" className="text-sm text-cyan-200 underline">Back to all</a>
        <Fps />
        <span className="font-mono text-xs text-white/60">{place.label} · {tod} · {ground ? 'real elevation' : 'loading the map…'} · reload to fly again</span>
      </div>
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-black">
        <CockpitSky palette={palette} timeOfDay={tod} altitude={1} />
        {ground && <CockpitWorld terrain={place.terrain} region={place.region} palette={palette} night={tod === 'night'} speed={0.55} highGround={ground} cloudCover={15} altitude={alt} />}
      </div>
    </div>
  );
}

function CoastView({ id, tod }: { id: string; tod: TimeOfDay }) {
  const place = COASTS.find((p) => p.id === id) ?? COASTS[0];
  const [coast, setCoast] = useState<Coast | undefined>(undefined);
  const [waters, setWaters] = useState<Waters | undefined>(undefined);
  useEffect(() => { setRealCoast(true); setRealWaters(true); void coastAhead(place.at, place.heading).then(setCoast); void watersAhead(place.at, place.heading).then(setWaters); }, [place]);
  const dest = WORLD_DESTINATIONS.find((d) => d.scene) ?? WORLD_DESTINATIONS[0];
  const palette = useMemo(() => composeTimedPalette(tod, dest.scene!), [tod, dest]);
  return (
    <div className="min-h-screen bg-[#070b14] p-4 text-white">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <a href="?" className="text-sm text-cyan-200 underline">Back to all</a>
        <Fps />
        <span className="font-mono text-xs text-white/60">{place.label} · {tod} · {coast ? `${coast.rings.length} land outlines` : 'loading the map…'} · reload to fly again</span>
      </div>
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-black">
        <CockpitSky palette={palette} timeOfDay={tod} altitude={1} />
        {coast && <CockpitWorld terrain={place.terrain} region={place.region} palette={palette} night={tod === 'night'} speed={0.55} coast={coast} waters={waters} cloudCover={15} />}
      </div>
    </div>
  );
}

function WaterView({ id, tod }: { id: string; tod: TimeOfDay }) {
  const place = WATERS.find((p) => p.id === id) ?? WATERS[0];
  const [waters, setWaters] = useState<Waters | undefined>(undefined);
  useEffect(() => { setRealWaters(true); void watersAhead(place.at, place.heading).then(setWaters); }, [place]);
  const dest = WORLD_DESTINATIONS.find((d) => d.scene) ?? WORLD_DESTINATIONS[0];
  const palette = useMemo(() => composeTimedPalette(tod, dest.scene!), [tod, dest]);
  return (
    <div className="min-h-screen bg-[#070b14] p-4 text-white">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <a href="?" className="text-sm text-cyan-200 underline">Back to all</a>
        <Fps />
        <span className="font-mono text-xs text-white/60">{place.label} · {tod} · {waters ? `${waters.rivers.length} river parts, ${waters.lakes.length} lakes` : 'loading the map…'} · reload to fly again</span>
      </div>
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-black">
        <CockpitSky palette={palette} timeOfDay={tod} altitude={1} />
        {waters && <CockpitWorld terrain={place.terrain} region={place.region} palette={palette} night={tod === 'night'} speed={0.55} waters={waters} cloudCover={15} />}
      </div>
    </div>
  );
}

/** Watch the ground change from one land type to the next (soft, patchy edges vs the old straight band). */
const EDGES: Array<[Terrain, Terrain, string]> = [['farmland', 'forest', 'Europe'], ['forest', 'farmland', 'Europe'], ['desert', 'savanna', 'Africa'], ['savanna', 'desert', 'Africa'], ['farmland', 'mountains', 'Europe'], ['grassland', 'farmland', 'Asia']];
function EdgeView({ from, to, region, soft }: { from: Terrain; to: Terrain; region: string; soft: boolean }) {
  const [terrain, setTerrain] = useState<Terrain>(from);
  useEffect(() => { setSoftEdges(soft); const t = setTimeout(() => setTerrain(to), 1500); return () => clearTimeout(t); }, [to, soft]);
  const dest = WORLD_DESTINATIONS.find((d) => d.scene) ?? WORLD_DESTINATIONS[0];
  const palette = useMemo(() => composeTimedPalette('day', dest.scene!), [dest]);
  return (
    <div className="min-h-screen bg-[#070b14] p-4 text-white">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <a href="?" className="text-sm text-cyan-200 underline">Back to all</a>
        <a href={`?edge=${from},${to}${soft ? '&hard=1' : ''}`} className="text-sm text-cyan-200 underline">Show {soft ? 'old (straight band)' : 'new (soft patches)'}</a>
        <Fps />
        <span className="font-mono text-xs text-white/60">{soft ? 'new' : 'old'} · {from} → {to} · reload to watch again</span>
      </div>
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-black">
        <CockpitSky palette={palette} timeOfDay="day" altitude={1} />
        <CockpitWorld terrain={terrain} region={region} palette={palette} night={false} speed={0.55} />
      </div>
    </div>
  );
}

/** The mountains gallery: every kind of range at every time of day, with the real cockpit renderer. */
export function MountainGallery() {
  const [style, setStyle] = useState<'old' | 'new'>('new');
  const moving = false; // the grid shows stills; one view at a time flies (like the room)
  // ?one=Asia&tod=dusk shows a single view, large.
  const [one, setOne] = useState<{ region: string; tod: TimeOfDay; terrain: Terrain } | null>(null);
  const [edge, setEdge] = useState<{ from: Terrain; to: Terrain; region: string; soft: boolean } | null>(null);
  const [cover, setCover] = useState(45);
  const [waterId, setWaterId] = useState<string | null>(null);
  const [waterTod, setWaterTod] = useState<TimeOfDay>('day');
  const [coastId, setCoastId] = useState<string | null>(null);
  const [reliefId, setReliefId] = useState<string | null>(null);
  const [eventKindQ, setEventKindQ] = useState<EventKind | null>(null);
  const [eventFar, setEventFar] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const s = q.get('style') === 'old' ? 'old' : 'new';
    setStyle(s);
    setPeakStyle(s);
    setGroundRelief(s === 'new' && q.get('hills') !== 'off');
    setNightLights(q.get('lights') === 'on');
    setSkyClouds(q.get('clouds') !== 'off');
    setSkyV2(q.get('sky') !== 'old');
    setCover(Number(q.get('cover') ?? '45') || 45);
    if (q.get('event')) { setEventFar(q.get('far') === '1'); setEventKindQ(q.get('event') as EventKind); setWaterTod((TIMES.includes(q.get('tod') as TimeOfDay) ? q.get('tod') : 'day') as TimeOfDay); }
    if (q.get('relief')) { setReliefId(q.get('relief')); setWaterTod((TIMES.includes(q.get('tod') as TimeOfDay) ? q.get('tod') : 'day') as TimeOfDay); }
    if (q.get('coast')) { setCoastId(q.get('coast')); setWaterTod((TIMES.includes(q.get('tod') as TimeOfDay) ? q.get('tod') : 'day') as TimeOfDay); }
    if (q.get('water')) { setWaterId(q.get('water')); setWaterTod((TIMES.includes(q.get('tod') as TimeOfDay) ? q.get('tod') : 'day') as TimeOfDay); }
    const e = q.get('edge')?.split(',');
    if (e?.length === 2) { const found = EDGES.find(([a, b]) => a === e[0] && b === e[1]); setEdge({ from: e[0] as Terrain, to: e[1] as Terrain, region: found?.[2] ?? 'Europe', soft: !q.has('hard') }); }
    const region = q.get('one');
    if (region) setOne({ region, tod: (TIMES.includes(q.get('tod') as TimeOfDay) ? q.get('tod') : 'day') as TimeOfDay, terrain: (q.get('ground') ?? 'mountains') as Terrain });
  }, []);
  if (eventKindQ) return <EventView kind={eventKindQ} tod={waterTod} far={eventFar} />;
  if (reliefId) return <ReliefView id={reliefId} tod={waterTod} />;
  if (coastId) return <CoastView id={coastId} tod={waterTod} />;
  if (waterId) return <WaterView id={waterId} tod={waterTod} />;
  if (edge) return <EdgeView key={`${edge.from}${edge.to}${edge.soft}`} {...edge} />;
  if (one) {
    return (
      <div className="min-h-screen bg-[#070b14] p-4">
        <div className="mb-2 flex flex-wrap items-center gap-3 text-white">
          <a href={`?style=${style}`} className="text-sm text-cyan-200 underline">Back to all</a>
          <a href={`?style=${style === 'old' ? 'new' : 'old'}&one=${one.region}&tod=${one.tod}&ground=${one.terrain}`} className="text-sm text-cyan-200 underline">Show {style === 'old' ? 'new' : 'old'}</a>
          <Fps />
          <span className="font-mono text-xs text-white/60">{style} · {one.terrain} · {one.region} · {one.tod}</span>
        </div>
        <Cell key={style} region={one.region} tod={one.tod} moving terrain={one.terrain} cover={cover} />
      </div>
    );
  }
  return (
    <div className="min-h-screen space-y-4 bg-[#070b14] p-5 text-white">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl">Mountains from the cockpit</h1>
        <span className="rounded-full border border-white/20 px-3 py-1 font-mono text-xs uppercase tracking-[0.14em] text-amber-200">{style === 'old' ? 'Old peaks' : 'New peaks'}</span>
        <a href={style === 'old' ? '?style=new' : '?style=old'} className="text-sm text-cyan-200 underline">Show the {style === 'old' ? 'new' : 'old'} peaks</a>
        <span className="text-sm text-white/60">Click any picture to watch it fly, full size.</span>
      </div>
      <section>
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-white/60">Real natural events (calm visuals)</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {EVENTS.map((e) => (
            <a key={e.kind} href={`?event=${e.kind}`} className="rounded-full border border-white/20 px-3 py-1 text-sm text-white/85 hover:border-amber-300/60">{e.label}</a>
          ))}
        </div>
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-white/60">Mountains from real elevation</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {RELIEFS.map((p) => (
            <a key={p.id} href={`?relief=${p.id}`} className="rounded-full border border-white/20 px-3 py-1 text-sm text-white/85 hover:border-amber-300/60">{p.label}</a>
          ))}
        </div>
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-white/60">Real coastlines (fly over a real coast)</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {COASTS.map((p) => (
            <a key={p.id} href={`?coast=${p.id}`} className="rounded-full border border-white/20 px-3 py-1 text-sm text-white/85 hover:border-amber-300/60">{p.label}</a>
          ))}
        </div>
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-white/60">Real rivers and lakes (fly over a real place)</p>
        <div className="flex flex-wrap gap-2">
          {WATERS.map((p) => (
            <a key={p.id} href={`?water=${p.id}`} className="rounded-full border border-white/20 px-3 py-1 text-sm text-white/85 hover:border-amber-300/60">{p.label}</a>
          ))}
        </div>
      </section>
      <section>
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-white/60">The sea of clouds (cover 20 / 50 / 85 %; {'?clouds=off'} for none). Click one to fly.</p>
        <div className="grid gap-3 md:grid-cols-3">
          {([[20, 'day'], [50, 'dusk'], [85, 'day'], [50, 'night'], [50, 'day'], [85, 'dusk']] as Array<[number, TimeOfDay]>).map(([c, t]) => (
            <a key={`${c}${t}`} href={`?one=Europe&tod=${t}&ground=farmland&cover=${c}`} className="block">
              <Cell key={`${style}|${c}|${t}`} region="Europe" tod={t} moving={false} terrain="farmland" cover={c} />
              <p className="mt-1 text-xs text-white/50">{c}% cloud · {t}</p>
            </a>
          ))}
        </div>
      </section>
      <section>
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-white/60">Night lights: towns and roads ({'?lights=off'} for the old dark ground). Click one to fly.</p>
        <div className="grid gap-3 md:grid-cols-4">
          {([['farmland', 'Europe'], ['paddies', 'Asia'], ['farmland', 'North America'], ['desert', 'Africa']] as Array<[Terrain, string]>).map(([t, rg]) => (
            <a key={`${t}${rg}`} href={`?one=${rg}&tod=night&ground=${t}`} className="block">
              <Cell key={`${style}|${t}|${rg}`} region={rg} tod="night" moving={false} terrain={t} />
              <p className="mt-1 text-xs text-white/50">{t} · {rg} · night</p>
            </a>
          ))}
        </div>
      </section>
      <section>
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-white/60">Watch the ground change (softer edges)</p>
        <div className="flex flex-wrap gap-2">
          {EDGES.map(([a, b]) => (
            <a key={`${a}${b}`} href={`?edge=${a},${b}`} className="rounded-full border border-white/20 px-3 py-1 text-sm text-white/85 hover:border-amber-300/60">{a} → {b}</a>
          ))}
        </div>
      </section>
      <section>
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-white/60">The ground {style === 'new' ? 'with relief' : 'as before (flat)'}: farmland, forest, savanna, desert</p>
        <div className="grid gap-3 md:grid-cols-4">
          {([['farmland', 'Europe'], ['forest', 'Europe'], ['savanna', 'Africa'], ['desert', 'Africa']] as Array<[Terrain, string]>).map(([t, rg]) => (
            <a key={t} href={`?style=${style}&one=${rg}&tod=day&ground=${t}`} className="block">
              <Cell key={`${style}|${t}`} region={rg} tod="day" moving={moving} terrain={t} />
              <p className="mt-1 text-xs text-white/50">{t} · day</p>
            </a>
          ))}
        </div>
      </section>
      {RANGES.map((r) => (
        <section key={r.region}>
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-white/60">{r.label}</p>
          <div className="grid gap-3 md:grid-cols-3">
            {TIMES.map((t) => (
              <a key={t} href={`?style=${style}&one=${r.region}&tod=${t}`} className="block">
                <Cell key={style} region={r.region} tod={t} moving={moving} />
                <p className="mt-1 text-xs text-white/50">{t}</p>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
