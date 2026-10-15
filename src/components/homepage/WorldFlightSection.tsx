// The emotional differentiator: a class flies the world together, one leg per lesson.
// Top: the shared World Flight hero ("Globe + the Window"), the same interactive showcase the in-app /home uses.
// Below it, three things the hero does not show: that the flight is real (route, place below, weather, time), what
// is in range of today's plane, and the planes the class can earn. The range map and the fleet are worked out from
// the product's own data (destinations, plane ranges), so they cannot drift from the app.

import Image from 'next/image';
import { CloudSun, Clock3, MapPin, Route } from 'lucide-react';
import { WorldFlightHero } from '@/components/discovery/world-flight-hero/world-flight-hero';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { distanceKm } from '@/lib/world-flight/geo';
import { WORLD_FLIGHT_RANGE_TIERS } from '@/lib/world-flight/progression';
import { PLANE_TIERS } from '@/lib/plane-progression';

// Must match scripts/build-marketing-range-map.py (which draws the land this map's pins sit on).
const MAP = { L0: -100, L1: 85, B0: -8, B1: 68, MID_LAT: 38 };
const COS = Math.cos((MAP.MID_LAT * Math.PI) / 180);
const pos = (lng: number, lat: number) => ({
  left: `${(((lng - MAP.L0) * COS) / ((MAP.L1 - MAP.L0) * COS)) * 100}%`,
  top: `${((MAP.B1 - lat) / (MAP.B1 - MAP.B0)) * 100}%`,
});
const onMap = (lng: number, lat: number) => lng > MAP.L0 + 4 && lng < MAP.L1 - 4 && lat > MAP.B0 + 3 && lat < MAP.B1 - 3;

const ORIGIN_ID = 'madrid';
// A readable sample of the map's cities: the page names these, the rest are dots.
const LABELLED = new Set(['london', 'rome', 'cairo', 'moscow', 'dakar', 'lagos', 'new-york', 'dubai', 'nairobi', 'miami', 'delhi']);

const REAL = [
  { icon: Route, title: 'A real route', body: 'The plane follows the true path between the two cities, at the pace of your lesson, and the class sees what it will pass on the way.' },
  { icon: MapPin, title: 'What is below you', body: 'The room names the place you are flying over right now: “the Massif Central, France”.' },
  { icon: CloudSun, title: 'Today’s weather', body: 'Cloud, rain or snow outside the window is the live weather at that spot.' },
  { icon: Clock3, title: 'The real time and sun', body: 'Local time on the ground, with sunset and night where they truly are.' },
];

const BULLETS = [
  { title: 'A stamp and souvenirs in every city', body: `${WORLD_DESTINATIONS.length} cities, each with its own scene, souvenirs to collect, a postcard home from the class, and its own video and reading lessons.` },
  { title: 'The class chooses the next stop', body: 'At landing the class sees what it improved, gets its stamp, and votes on where the next lesson flies.' },
  { title: 'Stars the class earns together', body: 'One when the class takes part, one for a strong lesson.' },
  { title: 'Expeditions and missions', body: 'Themed routes across cities, and design missions built from what the class discovered.' },
];

export function WorldFlightSection() {
  const origin = WORLD_DESTINATIONS.find((d) => d.id === ORIGIN_ID) ?? WORLD_DESTINATIONS[0];
  const today = WORLD_FLIGHT_RANGE_TIERS[0].rangeKm;
  const next = WORLD_FLIGHT_RANGE_TIERS[1].rangeKm;
  const cities = WORLD_DESTINATIONS
    .filter((d) => d.id !== origin.id && onMap(d.lng, d.lat))
    .map((d) => {
      const km = distanceKm(origin, d);
      return { id: d.id, city: d.city, lng: d.lng, lat: d.lat, reach: km <= today ? 'today' as const : km <= next ? 'next' as const : 'later' as const };
    });
  const inRange = cities.filter((c) => c.reach === 'today').length;
  const unlocked = cities.filter((c) => c.reach === 'next').map((c) => c.city);
  const fleet = PLANE_TIERS.map((tier) => ({ label: tier.label, rangeKm: tier.rangeKm, plane: tier.choices[0], choices: tier.choices.length }));

  return (
    <section id="world" className="scroll-mt-20 border-t border-lc-border px-5 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <WorldFlightHero ctaHref="/login" />

        <ul className="mt-10 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          {BULLETS.map((b) => (
            <li key={b.title} className="border-t-[3px] border-lc-amber pt-3">
              <p className="font-game text-[1.35rem] leading-tight text-lc-text">{b.title}</p>
              <p className="mt-1.5 text-[17px] text-lc-text2">{b.body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-2xl border border-[#263a58] bg-gradient-to-b from-[#0f2038] to-[#0b1626] p-5 sm:p-6">
          <p className="font-instrument text-[13px] font-semibold uppercase tracking-[0.14em] text-lc-amber">The flight is real</p>
          <h3 className="font-game mt-2 text-2xl text-lc-text sm:text-3xl">Look out of the window.</h3>
          <div className="mt-4 grid gap-x-7 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            {REAL.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <p className="flex items-center gap-2 text-[17px] font-semibold text-lc-text"><Icon className="h-5 w-5 shrink-0 text-cyan-300" aria-hidden />{title}</p>
                <p className="mt-1 text-[17px] text-lc-text2">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid items-start gap-9 lg:grid-cols-2">
          <div>
            <h3 className="font-game text-2xl text-lc-text sm:text-3xl">A bigger plane reaches further.</h3>
            <p className="mt-2 text-[17px] text-lc-text2">
              An example class in {origin.city}: {inRange} cities in range today, and {unlocked.slice(0, 3).join(', ')}{unlocked.length > 3 ? ' and more' : ''} once it earns the next plane.
            </p>
            <div className="relative mt-4 overflow-hidden rounded-2xl border border-[#263a58] bg-[#0a1728]" role="img" aria-label={`Map: from ${origin.city}, the cities in range today and the ones the next plane will reach`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/marketing/range-map-base.svg" alt="" className="block h-auto w-full" loading="lazy" />
              {cities.map((c) => (
                <span key={c.id} className="absolute" style={pos(c.lng, c.lat)}>
                  <span className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0a1728] ${c.reach === 'today' ? 'h-3 w-3 bg-emerald-300' : c.reach === 'next' ? 'h-3 w-3 bg-lc-amber' : 'h-2.5 w-2.5 bg-[#56688a]'}`} />
                  {LABELLED.has(c.id) && (
                    <span className={`absolute left-0 -translate-x-1/2 -translate-y-[165%] whitespace-nowrap rounded-md bg-black/70 px-1.5 text-[13px] font-semibold sm:text-sm ${c.reach === 'today' ? 'text-white' : c.reach === 'next' ? 'text-lc-amber' : 'text-[#9fb0c8]'}`}>{c.city}</span>
                  )}
                </span>
              ))}
              <span className="absolute" style={pos(origin.lng, origin.lat)}>
                <span className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0a1728] bg-slate-200" />
                <span className="absolute left-0 -translate-x-1/2 translate-y-[45%] whitespace-nowrap rounded-md bg-black/70 px-1.5 text-[13px] font-semibold text-white sm:text-sm">{origin.city}</span>
              </span>
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[15px] text-lc-text2">
              <li><span className="mr-2 inline-block h-3 w-3 rounded-full bg-slate-200 align-[-1px]" />You are here</li>
              <li><span className="mr-2 inline-block h-3 w-3 rounded-full bg-emerald-300 align-[-1px]" />In range today ({today.toLocaleString('en-US')} km)</li>
              <li><span className="mr-2 inline-block h-3 w-3 rounded-full bg-lc-amber align-[-1px]" />Unlocked by the next plane ({next.toLocaleString('en-US')} km)</li>
              <li><span className="mr-2 inline-block h-3 w-3 rounded-full bg-[#56688a] align-[-1px]" />Further still</li>
            </ul>
          </div>

          <div>
            <h3 className="font-game text-2xl text-lc-text sm:text-3xl">{fleet.length} planes to earn.</h3>
            <p className="mt-2 text-[17px] text-lc-text2">Flight hours and stars upgrade the plane. At each upgrade the class chooses between three.</p>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {fleet.map((f) => (
                <li key={f.label} className="flex flex-col items-center gap-1.5 rounded-2xl border border-[#263a58] bg-[#101d31] p-3 text-center">
                  <Image src={f.plane.png} alt={f.plane.name} width={220} height={110} className="h-[70px] w-full object-contain" />
                  <span className="text-[15px] font-semibold text-lc-text">{f.label}</span>
                  <span className="text-[15px] text-lc-text2">{f.rangeKm.toLocaleString('en-US')} km</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
