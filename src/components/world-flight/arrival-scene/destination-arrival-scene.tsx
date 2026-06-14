'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BLEED_X, CONTENT_W, LAYOUT, VIEWBOX, type DestinationArrivalSceneProps, type LandmarkDepth, type LandmarkLayerProps, type ScenePalette } from './types';
import { composeTimedPalette, getPalette } from './palettes';
import { randRange, seededRand } from './seed';
import { resolveLandmark } from './scene-registry';
import { AtmosphereLayer } from './layers/atmosphere-layer';
import { TerrainLayer } from './layers/terrain-layer';
import { SkylineLayer } from './layers/skyline-layer';
import { VegetationLayer } from './layers/vegetation-layer';
import { LandmarkLayer } from './layers/landmark-layer';
import { RunwayLayer } from './layers/runway-layer';
import { PlaneLayer } from './layers/plane-layer';
import { AmbientLayer } from './layers/ambient-layer';
import { Windsock } from './layers/windsock';

// Ambient parallax: a slow shared horizontal sway where nearer focal layers
// travel further than distant ones, so the depth stack pulls apart and back
// like a gentle camera dolly — reads as real depth. All layers share the same
// cycle/phase (so they move together, not independently). Off when !ambient, so
// still frames and reduced-motion stay pixel-stable.
const PARALLAX_CYCLE = 15; // seconds for a full sway out-and-back
function Parallax({ amp, ambient, children }: { amp: number; ambient: boolean; children: React.ReactNode }) {
  if (!ambient || amp === 0) return <>{children}</>;
  return (
    <motion.g
      initial={{ x: -amp }}
      animate={{ x: [-amp, amp, -amp] }}
      transition={{ duration: PARALLAX_CYCLE, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.g>
  );
}

// Distant, low-contrast skyline painted into the side bleed margins so wide
// windows don't show the focal city floating on bare shoulders. Uses its OWN
// seeded RNG (NOT the shared scene rand) so it never perturbs the focal layers'
// draw sequence — that keeps the 16:9 focal zone pixel-identical.
function BleedSkyline({ palette, destinationId }: { palette: ScenePalette; destinationId: string }) {
  const rand = seededRand(`${destinationId}:bleed`);
  const base = LAYOUT.apronY + 12;
  const cells: React.ReactNode[] = [];
  const fillMargin = (x0: number, x1: number, keyBase: number) => {
    let x = x0;
    let k = keyBase;
    while (x < x1) {
      const w = randRange(rand, 40, 92);
      const h = randRange(rand, 40, 120); // well below focal heights → reads as distance
      // Same opaque silhouette colour as the focal city (no transparency, so the
      // sea/sky never show through the distant buildings on wide windows).
      cells.push(<rect key={k} x={x} y={base - h} width={w} height={h} fill={palette.buildingSilhouette} />);
      x += w + randRange(rand, 6, 20);
      k += 1;
    }
  };
  fillMargin(0, BLEED_X, 0);
  fillMargin(BLEED_X + CONTENT_W, VIEWBOX.w, 10000);
  // Sits behind the focal city / runway grass.
  return <g aria-hidden>{cells}</g>;
}

// Composable arrival scene. Maps DestinationScene metadata onto reusable layers.
// The CANVAS is a wide 32:9 viewBox; the authored focal city lives in the centered
// CONTENT_W safe zone (offset by BLEED_X). Sky, terrain base bands and the runway
// fill the full canvas; focal layers are wrapped in translate(BLEED_X); the bleed
// margins carry a distant skyline. `slice` is height-anchored on wide windows
// (no upscaling) and crops the bleed symmetrically at 16:9 (pixel-identical).
//
// Render order (back → front), with the landmark inserted into the depth slot
// named by its registry entry:
//   1 atmosphere · 2 background landmark · 3 terrain · 4 bleed skyline
//   5 midground landmark · 6 skyline · 7 foreground landmark · 8 vegetation
//   9 runway · 10 plane
export function DestinationArrivalScene({
  destinationId,
  scene,
  phase,
  progress = 0,
  planeKey,
  motion = 'animated',
  mode = 'arrival',
  transparentSky = false,
  // 'slice' is the right default for the wide canvas: height-anchored on any
  // window ≤ ~3.2:1 (focal at exact 16:9 size), filling a 16:9 box with the focal
  // zone. 'meet' would letterbox the 32:9 canvas inside a 16:9 container.
  fit = 'slice',
  timeOfDay,
  className,
}: DestinationArrivalSceneProps) {
  const reduced = useReducedMotion();
  const rawId = useId();
  const idPrefix = useMemo(() => `as-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`, [rawId]);

  // `useReducedMotion()` reads a media query that is unavailable on the server,
  // so it can differ between the SSR render and the client's first render and
  // flip `ambient` — which swaps animated vs. static elements and breaks
  // hydration. Gate ambient behind a post-mount flag so the server and the first
  // client render are identical (static); animations switch on after hydration.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Ambient effects gated by mount + the explicit motion mode + OS preference.
  const ambient = mounted && motion === 'animated' && !reduced;
  // Controlled-frame contract: progress is clamped here; the scene owns no timeline.
  const p = Math.min(1, Math.max(0, progress));

  // Deterministic RNG, recreated EVERY render so it always restarts from the
  // seed and the layout is byte-identical across re-renders. (Do NOT useMemo a
  // stateful generator here: it would keep advancing across re-renders and the
  // skyline/stars/vegetation would reshuffle when progress/phase change.)
  const rand = seededRand(destinationId);

  // Time-of-day override (live flight clock) composes time + the city's climate;
  // otherwise fall back to the destination's baked palette (gallery / default).
  const palette = timeOfDay ? composeTimedPalette(timeOfDay, scene) : getPalette(scene.palette);
  const landmark = resolveLandmark(scene.landmarkSilhouette);

  const layerProps = { scene, palette, rand, idPrefix, phase, progress: p, ambient, mode };
  const landmarkProps: LandmarkLayerProps = { palette, rand, idPrefix, ambient };

  const landmarkAt = (depth: LandmarkDepth) =>
    landmark && landmark.depth === depth ? <LandmarkLayer entry={landmark} {...landmarkProps} /> : null;

  // Focal layers draw in 0..CONTENT_W and are shifted into the centered safe zone.
  const focal = `translate(${BLEED_X},0)`;

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
      width="100%"
      height="100%"
      preserveAspectRatio={`xMidYMax ${fit}`}
      className={`pointer-events-none select-none ${className ?? ''}`}
      style={{ display: 'block', overflow: 'hidden' }}
      role="img"
      aria-label={`Arrival scene for ${destinationId}`}
    >
      {/* Full-canvas: sky (tier 1) */}
      {!transparentSky && <AtmosphereLayer {...layerProps} />}
      {/* Focal background landmark — parallax: farthest, sways least */}
      <g transform={focal}><Parallax amp={5} ambient={ambient}>{landmarkAt('background')}</Parallax></g>
      {/* Terrain self-splits: base bands full-canvas, silhouettes focal */}
      <TerrainLayer {...layerProps} />
      {/* Distant skyline in the side bleed (own RNG — does not perturb focal) */}
      <BleedSkyline palette={palette} destinationId={destinationId} />
      {/* Focal city + accents — parallax amplitude grows toward the viewer */}
      <g transform={focal}><Parallax amp={9} ambient={ambient}>{landmarkAt('midground')}</Parallax></g>
      <g transform={focal}><Parallax amp={12} ambient={ambient}><SkylineLayer {...layerProps} /></Parallax></g>
      <g transform={focal}><Parallax amp={18} ambient={ambient}>{landmarkAt('foreground')}</Parallax></g>
      <g transform={focal}><Parallax amp={22} ambient={ambient}><VegetationLayer {...layerProps} /></Parallax></g>
      {/* Focal ambient life (birds / light flickers / beacon) — renders only when
          ambient (animated + not reduced-motion); still frames show nothing. */}
      <g transform={focal}><AmbientLayer {...layerProps} /></g>
      {/* Full-canvas: airfield ground + runway (tier 2) */}
      <RunwayLayer {...layerProps} />
      {/* Airfield windsock (LessonCaptain mark) — left of the runway centre */}
      <g transform={focal}><Windsock {...layerProps} /></g>
      {/* Focal plane */}
      <g transform={focal}><PlaneLayer {...layerProps} planeKey={planeKey} /></g>
    </svg>
  );
}

export default DestinationArrivalScene;
