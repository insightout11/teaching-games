'use client';

// The "window" — a cross-fading view onto the active destination, rendered with
// the real World Flight arrival-scene engine (so it's our own art, not stock
// photos). Scenes render `motion="static"` (cheap) and AnimatePresence keeps only
// the entering + exiting scene mounted during a cross-fade — never all eight. A
// slow scale drift adds cinematic life without re-rendering the SVG.

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { DestinationArrivalScene } from '@/components/world-flight/arrival-scene/destination-arrival-scene';
import { rollWeather } from '@/components/world-flight/arrival-scene/weather';
import type { HeroCity } from './hero-cities';

// Each city at the hour that suits it: Tokyo and New York are night cities; most of the rest read best in daylight.
const CITY_HOUR: Record<string, 'dawn' | 'day' | 'dusk' | 'night'> = { tokyo: 'night', 'new-york': 'night', cairo: 'dusk', paris: 'dawn', 'cape-town': 'dusk' };
const hourFor = (cityId: string) => CITY_HOUR[cityId] ?? 'day';
// Snow where it makes the picture: falling past New York's lit towers at night.
const SHOWCASE_SNOW = new Set(['new-york']);
function showcaseWeather(cityId: string, scene: Parameters<typeof rollWeather>[1], night: boolean) {
  if (SHOWCASE_SNOW.has(cityId)) return 'snow' as const;
  const w = rollWeather(`hero:${cityId}`, scene, night);
  return w === 'rain' || w === 'storm' ? 'clear' : w;
}

export function DestinationWindow({
  cities,
  activeIndex,
  reduced,
}: {
  cities: HeroCity[];
  activeIndex: number;
  reduced: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const city = cities[activeIndex];

  if (!mounted) {
    return <div className="absolute inset-0 overflow-hidden bg-[#03101f]" aria-hidden />;
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={city.id}
          className="absolute inset-0"
          initial={reduced ? false : { opacity: 0, scale: 1.04 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1.12 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.1, ease: 'easeInOut' },
            scale: { duration: 7, ease: 'linear' },
          }}
          style={{ transformOrigin: 'center 68%' }}
        >
          <DestinationArrivalScene
            destinationId={city.id}
            scene={city.scene}
            // Touchdown at progress ≈ 0.34 puts the plane dead-centre of the frame
            // (cx = lerp(660,1130,easeOut(g)) ≈ 800 = CONTENT_W / 2), full-size and
            // clear of the left-of-centre windsock — a "just arrived" hero framing.
            phase="touchdown"
            progress={0.34}
            motion="static"
            planeKey={city.plane}
            // A showcase, not a forecast: mostly clear skies, a little character where it suits (cloud, snow, the
            // northern lights by night), and never rain or storms (the room itself still uses the real weather).
            weather={showcaseWeather(city.id, city.scene, hourFor(city.id) === 'night')}
            timeOfDay={hourFor(city.id)}
            className="h-full w-full"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
