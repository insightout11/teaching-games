'use client';

// The "window" — a cross-fading view onto the active destination, rendered with
// the real World Flight arrival-scene engine (so it's our own art, not stock
// photos). Scenes render `motion="static"` (cheap) and AnimatePresence keeps only
// the entering + exiting scene mounted during a cross-fade — never all eight. A
// slow scale drift adds cinematic life without re-rendering the SVG.

import { AnimatePresence, motion } from 'framer-motion';
import { DestinationArrivalScene } from '@/components/world-flight/arrival-scene/destination-arrival-scene';
import type { HeroCity } from './hero-cities';

export function DestinationWindow({
  cities,
  activeIndex,
  reduced,
}: {
  cities: HeroCity[];
  activeIndex: number;
  reduced: boolean;
}) {
  const city = cities[activeIndex];
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
            className="h-full w-full"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
