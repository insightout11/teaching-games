'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { BLEED_X, CONTENT_W, LAYOUT, VIEWBOX, type DestinationArrivalSceneProps, type LandmarkDepth, type ScenePalette } from './types';
import { composeTimedPalette, getPalette } from './palettes';
import { cinematicCameraFrame, cinematicCameraTransform, cinematicParallaxX, cinematicParallaxY } from './cinematic-camera';
import { DEP_CITY_LEAD, departureCameraPan } from './cinematic-motion';
import { randRange, seededRand } from './seed';
import { resolveLandmark } from './scene-registry';
import { AtmosphereLayer } from './layers/atmosphere-layer';
import { TerrainBaseLayer, TerrainSilhouetteLayer } from './layers/terrain-layer';
import { SkylineLayer } from './layers/skyline-layer';
import { VegetationLayer } from './layers/vegetation-layer';
import { LandmarkLayer } from './layers/landmark-layer';
import { RunwayLayer } from './layers/runway-layer';
import { PlaneLayer } from './layers/plane-layer';
import { AmbientLayer } from './layers/ambient-layer';
import { CinematicOverlay } from './layers/cinematic-overlay';
import { WeatherLayer } from './layers/weather-layer';
import { Windsock } from './layers/windsock';

// Distant, low-contrast skyline painted into the side bleed margins so wide
// windows don't show the focal city floating on bare shoulders. Uses its OWN
// seeded RNG (NOT the shared scene rand) so it never perturbs the focal layers'
// draw sequence — that keeps the 16:9 focal zone pixel-identical.
// Per-skyline-kind massing for the bleed margins so the distant city MATCHES the
// authored destination: a low Pacific town must not sprout modern towers in the
// margins, and a supertall CBD shouldn't trail off into a village. `pitched`,
// `setback` and `mast` are cumulative probability slices of the roof character.
type BleedSkylineKind = 'low' | 'dense' | 'highrise' | 'historic';
const BLEED_PROFILE: Record<BleedSkylineKind, {
  hMin: number; hMax: number; wMin: number; wMax: number; pitched: number; setback: number; mast: number;
}> = {
  low: { hMin: 28, hMax: 74, wMin: 30, wMax: 64, pitched: 0.55, setback: 0, mast: 0 },
  historic: { hMin: 40, hMax: 116, wMin: 34, wMax: 76, pitched: 0.42, setback: 0.1, mast: 0.04 },
  dense: { hMin: 58, hMax: 176, wMin: 32, wMax: 74, pitched: 0.08, setback: 0.3, mast: 0.22 },
  highrise: { hMin: 76, hMax: 230, wMin: 30, wMax: 72, pitched: 0.03, setback: 0.34, mast: 0.3 },
};

function BleedSkyline({ palette, destinationId, skyline }: { palette: ScenePalette; destinationId: string; skyline: BleedSkylineKind }) {
  const rand = seededRand(`${destinationId}:bleed`);
  const base = LAYOUT.apronY + 12;
  const isNight = palette.light === 'moon';
  const f = palette.buildingSilhouette;
  const prof = BLEED_PROFILE[skyline] ?? BLEED_PROFILE.dense;
  const cells: React.ReactNode[] = [];
  const fillMargin = (x0: number, x1: number, keyBase: number) => {
    let x = x0;
    let k = keyBase;
    while (x < x1) {
      // Same opaque silhouette colour as the focal city (no transparency → the
      // sea/sky never show through), sized to the destination's skyline kind.
      const w = randRange(rand, prof.wMin, prof.wMax);
      const h = randRange(rand, prof.hMin, prof.hMax);
      const top = base - h;
      const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
      // Roof character keyed to the kind: pitched/hipped caps read as a town;
      // setbacks + masts read as a modern CBD.
      const roll = rand();
      if (roll < prof.pitched) {
        parts.push(<polygon key="p" points={`${x - 2} ${top}, ${x + w / 2} ${top - randRange(rand, 10, 22)}, ${x + w + 2} ${top}`} fill={f} />);
      } else if (roll < prof.pitched + prof.setback) {
        const sh = randRange(rand, 12, 28);
        parts.push(<rect key="s" x={x + w * 0.22} y={top - sh} width={w * 0.56} height={sh} fill={f} />);
      } else if (roll < prof.pitched + prof.setback + prof.mast) {
        const ah = randRange(rand, 16, 34);
        parts.push(<rect key="a" x={x + w / 2 - 1} y={top - ah} width={2} height={ah} fill={f} />);
      }
      // Distant window lights — bright/dense at night, faint/sparse by day, so the
      // overflow buildings read lit like the focal city (not dark silhouettes).
      for (let wy = top + 9; wy < base - 6; wy += 13) {
        for (let wx = x + 5; wx < x + w - 4; wx += 11) {
          if (rand() > (isNight ? 0.6 : 0.78)) continue;
          parts.push(
            <rect key={`w${wx}-${wy}`} x={wx} y={wy} width={2.4} height={3} fill={rand() > 0.82 ? palette.windowCool : palette.windowWarm} opacity={isNight ? 0.8 : 0.42} />,
          );
        }
      }
      cells.push(<g key={k}>{parts}</g>);
      x += w + randRange(rand, 5, 16);
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
  weather = 'clear',
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

  // Time-of-day override (live flight clock) composes time + the city's climate;
  // otherwise fall back to the destination's baked palette (gallery / default).
  const palette = timeOfDay ? composeTimedPalette(timeOfDay, scene) : getPalette(scene.palette);
  const landmark = resolveLandmark(scene.landmarkSilhouette);

  const baseLayerProps = { scene, palette, idPrefix, phase, progress: p, ambient, mode, weather };
  // Never share a mutable RNG across sibling layers. React may evaluate siblings
  // in a different order during SSR and hydration; isolated seeds keep every
  // layer byte-identical regardless of scheduling.
  const propsFor = (layer: string) => ({ ...baseLayerProps, rand: seededRand(`${destinationId}:${layer}`) });

  const landmarkAt = (depth: LandmarkDepth) =>
    landmark && landmark.depth === depth ? (
      <LandmarkLayer entry={landmark} palette={palette} idPrefix={idPrefix} ambient={ambient} rand={seededRand(`${destinationId}:landmark:${depth}`)} />
    ) : null;

  // Focal layers draw in 0..CONTENT_W and are shifted into the centered safe zone.
  const focal = `translate(${BLEED_X},0)`;

  // Takeoff (departure) tracking camera: the viewpoint follows the plane, so the
  // world scrolls left. Each layer pans by the shared camera distance × its depth
  // (near layers move most) → real parallax. Zero for arrival/static, so those
  // frames are byte-identical to before. `depFocal` is for focal layers (already
  // offset by BLEED_X); `depCanvas` is for full-canvas layers (no BLEED_X).
  // Subtract the lead so p=0 starts the world shifted right (plane further back in
  // the city, more city ahead) and the authored city is still on-screen at the END
  // rather than scrolled away to blank.
  const camPan = mode === 'departure' ? departureCameraPan(p) - DEP_CITY_LEAD : 0;
  const camera = cinematicCameraFrame(mode, phase, p);
  const cameraTransform = cinematicCameraTransform(camera);
  const focalAt = (depth: number) => {
    const x = mode === 'departure' ? BLEED_X - camPan * depth : BLEED_X + cinematicParallaxX(camera, depth);
    const y = mode === 'arrival' ? cinematicParallaxY(camera, depth) : 0;
    return `translate(${x},${y})`;
  };
  const canvasAt = (depth: number) => {
    const x = mode === 'departure' ? -camPan * depth : cinematicParallaxX(camera, depth);
    const y = mode === 'arrival' ? cinematicParallaxY(camera, depth) : 0;
    return x || y ? `translate(${x},${y})` : undefined;
  };

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
      <g transform={cameraTransform} data-cinematic-camera>
      {/* Full-canvas: sky (tier 1) */}
      {!transparentSky && <AtmosphereLayer {...propsFor('atmosphere')} />}
      {/* Focal background landmark — farthest, pans least on takeoff */}
      <g transform={focalAt(0.18)}>{landmarkAt('background')}</g>
      {/* Terrain base bands — full-canvas, FIXED (flat colour, no pan reference) */}
      <TerrainBaseLayer {...propsFor('terrain')} />
      {/* Terrain silhouettes (hills/dunes/island/headland) — far depth, so they
          pan WITH the world on takeoff and pick up arrival parallax. */}
      <g transform={focalAt(0.22)}><TerrainSilhouetteLayer {...propsFor('terrain')} /></g>
      {/* Distant skyline in the side bleed (own RNG — does not perturb focal).
          The home base fills its own overflow (mountains + city span the full
          canvas in the skyline layer), so it skips the generic bleed. */}
      {scene.skylineVariant !== 'homebase' && (
        <g transform={canvasAt(0.3)}><BleedSkyline palette={palette} destinationId={destinationId} skyline={scene.skyline} /></g>
      )}
      {/* Focal city + accents — pan amplitude grows toward the viewer */}
      <g transform={focalAt(0.4)}>{landmarkAt('midground')}</g>
      <g transform={focalAt(0.5)}><SkylineLayer {...propsFor('skyline')} /></g>
      <g transform={focalAt(0.75)}>{landmarkAt('foreground')}</g>
      <g transform={focalAt(1)}><VegetationLayer {...propsFor('vegetation')} /></g>
      {/* Focal ambient life (birds / light flickers / beacon) — renders only when
          ambient (animated + not reduced-motion); still frames show nothing. */}
      <g transform={focalAt(0.5)}><AmbientLayer {...propsFor('ambient')} /></g>
      {/* Full-canvas: airfield ground + runway (tier 2). Runway markings scroll
          internally on takeoff (departureCameraPan) — the strongest speed cue. */}
      <g transform={mode === 'arrival' ? canvasAt(1) : undefined}><RunwayLayer {...propsFor('runway')} /></g>
      {/* Airfield windsock (LessonCaptain mark) — left of the runway centre */}
      <g transform={focalAt(0.9)}><Windsock {...propsFor('windsock')} /></g>
      {/* Focal plane — the tracking camera holds it near centre; not panned */}
      <g transform={focal}><PlaneLayer {...propsFor('plane')} planeKey={planeKey} /></g>
      {/* Weather: precipitation + lightning, full-canvas, in front of the scene */}
      <WeatherLayer {...propsFor('weather')} />
      </g>
      <CinematicOverlay {...propsFor('cinematic-overlay')} />
    </svg>
  );
}

export default DestinationArrivalScene;
