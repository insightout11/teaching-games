'use client';

import { useId, useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
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
      const h = randRange(rand, 44, 150); // well below focal heights → reads as distance
      cells.push(<rect key={k} x={x} y={base - h} width={w} height={h} fill={palette.buildingSilhouette} />);
      x += w + randRange(rand, 6, 20);
      k += 1;
    }
  };
  fillMargin(0, BLEED_X, 0);
  fillMargin(BLEED_X + CONTENT_W, VIEWBOX.w, 10000);
  // Low opacity = atmospheric distance; sits behind the focal city / runway grass.
  return <g aria-hidden opacity={0.4}>{cells}</g>;
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

  // Ambient effects gated by both the explicit motion mode and OS preference.
  const ambient = motion === 'animated' && !reduced;
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
      {/* Focal background landmark */}
      <g transform={focal}>{landmarkAt('background')}</g>
      {/* Terrain self-splits: base bands full-canvas, silhouettes focal */}
      <TerrainLayer {...layerProps} />
      {/* Distant skyline in the side bleed (own RNG — does not perturb focal) */}
      <BleedSkyline palette={palette} destinationId={destinationId} />
      {/* Focal city + accents */}
      <g transform={focal}>{landmarkAt('midground')}</g>
      <g transform={focal}><SkylineLayer {...layerProps} /></g>
      <g transform={focal}>{landmarkAt('foreground')}</g>
      <g transform={focal}><VegetationLayer {...layerProps} /></g>
      {/* Full-canvas: airfield ground + runway (tier 2) */}
      <RunwayLayer {...layerProps} />
      {/* Focal plane */}
      <g transform={focal}><PlaneLayer {...layerProps} planeKey={planeKey} /></g>
    </svg>
  );
}

export default DestinationArrivalScene;
