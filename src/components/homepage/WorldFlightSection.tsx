'use client';

// The emotional differentiator: a class flies the world together, one leg per lesson.
// Reuses the composable arrival-scene library (DestinationArrivalScene) for the visual
// peak — no bespoke from-scratch mega-scene. The route arc + stat row frame an example
// journey; coordinates are real, so the "km flown" figure is a real great-circle total.

import { motion, useReducedMotion } from 'framer-motion';
import { Plane, MapPin, Globe2 } from 'lucide-react';
import { DestinationArrivalScene } from '@/components/world-flight/arrival-scene/destination-arrival-scene';
import type { DestinationScene } from '@/lib/world-flight/types';

interface Leg {
  city: string;
  country: string;
  lat: number;
  lng: number;
}

// An example journey across real LessonCaptain destinations (coords from the
// destination pack). The final leg is the one rendered as the arrival vignette.
const JOURNEY: Leg[] = [
  { city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  { city: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
  { city: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
];

// Tokyo's canonical arrival scene, copied verbatim from the destination pack
// (src/data/world-flight/destinations.ts → id 'tokyo'). Night palette over the
// bespoke Tokyo skyline variant with the Mt. Fuji silhouette behind it and sakura.
const ARRIVAL_SCENE: DestinationScene = {
  terrain: 'urban',
  vegetation: 'sakura',
  skyline: 'highrise',
  skylineVariant: 'tokyo',
  landmarkSilhouette: 'fuji',
  palette: 'night',
};

function haversineKm(a: Leg, b: Leg): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const TOTAL_KM = Math.round(
  JOURNEY.slice(1).reduce((sum, leg, i) => sum + haversineKm(JOURNEY[i], leg), 0),
);

const STATS = [
  { icon: MapPin, value: `${JOURNEY.length}`, label: 'cities this term' },
  { icon: Plane, value: `${TOTAL_KM.toLocaleString()} km`, label: 'flown together' },
  { icon: Globe2, value: '1 leg', label: 'per lesson' },
];

export function WorldFlightSection() {
  const reduce = useReducedMotion();

  return (
    <section className="border-t border-lc-border px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-lc-amber">
            World Flight
          </p>
          <h2
            className="text-3xl font-bold text-lc-text sm:text-4xl"
            style={{ textShadow: '0 1px 24px rgba(0,0,0,0.65)' }}
          >
            Your class flies the world together.
          </h2>
          <p className="mt-4 text-lc-text2">
            Every lesson is a leg of the journey. Students land in a new city, dig into a
            real story from it, and watch the route grow across the term.
          </p>
        </motion.div>

        {/* Arrival vignette — the visual peak (single scaling SVG from the library) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="overflow-hidden rounded-2xl border border-lc-amber/25 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.9)]"
        >
          {/* aspect-video (16:9) frames exactly the focal safe zone of the wide
              arrival canvas; a wider ratio would reveal the side-bleed margins. */}
          <div className="relative aspect-video w-full bg-[#0a1424]">
            <DestinationArrivalScene
              destinationId="tokyo"
              scene={ARRIVAL_SCENE}
              phase="taxi"
              progress={0.7}
              motion={reduce ? 'static' : 'animated'}
              className="absolute inset-0 h-full w-full"
            />
            {/* Arrival label — bumped opacity/ring for legibility over the night palette */}
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/55 px-3 py-1.5 backdrop-blur-sm">
              <Plane className="h-3.5 w-3.5 text-lc-amber" aria-hidden />
              <span className="text-xs font-semibold text-white">Now arriving · Tokyo</span>
            </div>
          </div>

          {/* Route arc — the legs flown so far, last one lit */}
          <div className="border-t border-lc-border bg-[#0a1424] px-5 py-5 sm:px-8">
            <ol className="flex items-center justify-between gap-1">
              {JOURNEY.map((leg, i) => {
                const arrived = i === JOURNEY.length - 1;
                return (
                  <li key={leg.city} className="flex flex-1 items-center gap-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      <span
                        className={`h-3 w-3 rounded-full border-2 ${
                          arrived
                            ? 'border-lc-amber bg-lc-amber shadow-[0_0_12px_rgba(245,158,11,0.9)]'
                            : 'border-cyan-300/60 bg-cyan-300/20'
                        }`}
                      />
                      <span
                        className={`text-[11px] font-medium leading-none sm:text-xs ${
                          arrived ? 'text-lc-amber' : 'text-lc-text2'
                        }`}
                      >
                        {leg.city}
                      </span>
                    </div>
                    {i < JOURNEY.length - 1 && (
                      <span
                        aria-hidden
                        className="mx-1 mb-4 h-px flex-1 bg-[repeating-linear-gradient(90deg,rgba(34,211,238,0.5)_0_6px,transparent_6px_12px)]"
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </motion.div>

        {/* Journey stat row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-8 grid grid-cols-3 gap-4"
        >
          {STATS.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-lc-border bg-lc-card/50 px-3 py-5 text-center"
            >
              <Icon className="h-5 w-5 text-lc-amber" aria-hidden />
              <span className="text-xl font-bold text-lc-text sm:text-2xl">{value}</span>
              <span className="text-xs text-lc-text3">{label}</span>
            </div>
          ))}
        </motion.div>

        <p className="mt-4 text-center text-xs text-lc-text3">
          Paris → Dubai → Singapore → Tokyo — an example class route.
        </p>
      </div>
    </section>
  );
}
