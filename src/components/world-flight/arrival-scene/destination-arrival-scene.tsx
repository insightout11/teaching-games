'use client';

import { useId, useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { VIEWBOX, type DestinationArrivalSceneProps, type LandmarkDepth, type LandmarkLayerProps } from './types';
import { composeTimedPalette, getPalette } from './palettes';
import { seededRand } from './seed';
import { resolveLandmark } from './scene-registry';
import { AtmosphereLayer } from './layers/atmosphere-layer';
import { TerrainLayer } from './layers/terrain-layer';
import { SkylineLayer } from './layers/skyline-layer';
import { VegetationLayer } from './layers/vegetation-layer';
import { LandmarkLayer } from './layers/landmark-layer';
import { RunwayLayer } from './layers/runway-layer';
import { PlaneLayer } from './layers/plane-layer';

// Composable arrival scene. Maps DestinationScene metadata onto reusable layers
// in one `viewBox="0 0 1600 900"` coordinate system, side-profile camera.
//
// Render order (back → front), with the landmark inserted into the depth slot
// named by its registry entry:
//   1 atmosphere · 2 background landmark · 3 terrain · 4 midground landmark
//   5 skyline · 6 foreground landmark · 7 vegetation · 8 runway · 9 plane
export function DestinationArrivalScene({
  destinationId,
  scene,
  phase,
  progress = 0,
  planeKey,
  motion = 'animated',
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

  const layerProps = { scene, palette, rand, idPrefix, phase, progress: p, ambient };
  const landmarkProps: LandmarkLayerProps = { palette, rand, idPrefix, ambient };

  const landmarkAt = (depth: LandmarkDepth) =>
    landmark && landmark.depth === depth ? <LandmarkLayer entry={landmark} {...landmarkProps} /> : null;

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMax meet"
      className={`pointer-events-none select-none ${className ?? ''}`}
      style={{ display: 'block', overflow: 'hidden' }}
      role="img"
      aria-label={`Arrival scene for ${destinationId}`}
    >
      <AtmosphereLayer {...layerProps} />
      {landmarkAt('background')}
      <TerrainLayer {...layerProps} />
      {landmarkAt('midground')}
      <SkylineLayer {...layerProps} />
      {landmarkAt('foreground')}
      <VegetationLayer {...layerProps} />
      <RunwayLayer {...layerProps} />
      <PlaneLayer {...layerProps} planeKey={planeKey} />
    </svg>
  );
}

export default DestinationArrivalScene;
