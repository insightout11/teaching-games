'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { DestinationScene } from '@/lib/world-flight/types';
import { BLEED_X } from '@/components/world-flight/arrival-scene/types';
import type { TimeOfDay, WeatherCondition, LandmarkDepth } from '@/components/world-flight/arrival-scene/types';
import { composeTimedPalette } from '@/components/world-flight/arrival-scene/palettes';
import { seededRand } from '@/components/world-flight/arrival-scene/seed';
import { resolveLandmark } from '@/components/world-flight/arrival-scene/scene-registry';
import { TerrainBaseLayer, TerrainSilhouetteLayer } from '@/components/world-flight/arrival-scene/layers/terrain-layer';
import { SkylineLayer } from '@/components/world-flight/arrival-scene/layers/skyline-layer';
import { LandmarkLayer } from '@/components/world-flight/arrival-scene/layers/landmark-layer';
import { AmbientLayer } from '@/components/world-flight/arrival-scene/layers/ambient-layer';
import { WeatherLayer } from '@/components/world-flight/arrival-scene/layers/weather-layer';
import { BleedSkyline } from '@/components/world-flight/arrival-scene/destination-arrival-scene';
import { AirfieldForeground } from './airfield-scene';

// The lobby is the DEPARTURE point: the class is parked at the airfield of the
// city they last visited (the origin), about to fly to the destination on the
// Departures board. This composes the World Flight arrival-scene LAYERS (the
// origin city's skyline + landmark + terrain + weather) onto the horizon, then
// draws the same home-airfield foreground (hangar/plane/tower/windsock) on top —
// all in one SVG so they stay locked together and scale as a unit at any size.
//
// One shared SVG (not the arrival scene layered behind the airfield) avoids two
// problems: the arrival canvas (2880×900 'slice') and the airfield (1600×900
// 'meet') would drift out of horizon alignment across aspect ratios, and the
// arrival scene's own runway + parked plane would poke out next to the hangar.
// Here the focal layers draw in their native 0..1600 space (= this SVG's width),
// and we simply never render the arrival runway/plane.

// Vertical shift so the arrival skyline baseline (apronY + 12 = 652) sits on the
// airfield horizon (GRASS_Y = 720). The airfield's opaque grass — drawn after,
// from GRASS_Y down — then tucks the buildings' feet under the field, exactly how
// the arrival skyline already relies on its own grass to occlude bases.
const SKYLINE_DY = 68;

interface LobbyAirfieldSceneProps {
  originId: string;
  scene: DestinationScene;
  /** Departure-clock light; falls back to 'dusk'. */
  timeOfDay?: TimeOfDay;
  /** Same climate-weighted roll the flight uses (shared with takeoff). */
  weather?: WeatherCondition;
  planeKey?: string | null;
  className?: string;
}

export function LobbyAirfieldScene({
  originId,
  scene,
  timeOfDay,
  weather = 'clear',
  planeKey,
  className,
}: LobbyAirfieldSceneProps) {
  const reduced = useReducedMotion();
  const rawId = useId();
  const idPrefix = useMemo(() => `lobby-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`, [rawId]);

  // Hydration-safe ambient gate (mirrors DestinationArrivalScene): the SSR render
  // and the client's first render are identical (static); ambient animation
  // switches on after mount so reduced-motion / SSR never flip mid-hydration.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const ambient = mounted && !reduced;

  const palette = composeTimedPalette(timeOfDay ?? 'dusk', scene);
  const landmark = resolveLandmark(scene.landmarkSilhouette);

  // A still, parked frame: arrival mode, landed phase, no camera/parallax — the
  // layers draw at their canonical positions.
  const baseLayerProps = {
    scene,
    palette,
    idPrefix,
    phase: 'landed' as const,
    progress: 1,
    ambient,
    mode: 'arrival' as const,
    weather,
  };
  // Isolated RNG per layer so SSR/CSR are byte-identical (never share a mutable RNG).
  const propsFor = (layer: string) => ({ ...baseLayerProps, rand: seededRand(`${originId}:${layer}`) });

  const landmarkAt = (depth: LandmarkDepth) =>
    landmark && landmark.depth === depth ? (
      <LandmarkLayer
        entry={landmark}
        palette={palette}
        idPrefix={idPrefix}
        ambient={ambient}
        rand={seededRand(`${originId}:landmark:${depth}`)}
      />
    ) : null;

  return (
    <svg
      viewBox="0 0 1600 900"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMax meet"
      className={`pointer-events-none select-none ${className ?? ''}`}
      style={{ display: 'block', overflow: 'visible' }}
      role="img"
      aria-label={`Departure airfield at ${originId}`}
    >
      {/* The arrival layers are authored in the wide 2880-unit canvas. Focal layers
          draw in the centred 0..CONTENT_W zone (= this SVG's 1600 viewBox); the
          full-canvas layers (TerrainBaseLayer, BleedSkyline) fill the whole 2880
          width, so they're recentred by -BLEED_X to bleed past BOTH edges of the
          16:9 viewBox — otherwise on widescreens they cut off on the left while
          overflowing the right. Groups alternate transforms to preserve the
          DestinationArrivalScene paint order (back → front; minus sky, vegetation,
          runway, plane):
            background landmark · terrain base · terrain silhouette · bleed skyline
            · midground landmark · focal skyline · foreground landmark · ambient. */}
      <g transform={`translate(0,${SKYLINE_DY})`}>{landmarkAt('background')}</g>
      <g transform={`translate(${-BLEED_X},${SKYLINE_DY})`}>
        <TerrainBaseLayer {...propsFor('terrain')} />
      </g>
      <g transform={`translate(0,${SKYLINE_DY})`}>
        <TerrainSilhouetteLayer {...propsFor('terrain')} />
      </g>
      {/* Distant city silhouette flanking the focal origin city in the side bleed
          (homebase fills its own overflow via the skyline layer, so it opts out). */}
      {scene.skylineVariant !== 'homebase' && (
        <g transform={`translate(${-BLEED_X},${SKYLINE_DY})`}>
          <BleedSkyline palette={palette} destinationId={originId} skyline={scene.skyline} />
        </g>
      )}
      <g transform={`translate(0,${SKYLINE_DY})`}>
        {landmarkAt('midground')}
        <SkylineLayer {...propsFor('skyline')} />
        {landmarkAt('foreground')}
        <AmbientLayer {...propsFor('ambient')} />
      </g>

      {/* Home airfield foreground — hangar, parked plane, tower, windsock, stars,
          and the opaque grass/tarmac that occludes the city's feet. */}
      <AirfieldForeground planeKey={planeKey} />

      {/* Precipitation / lightning — also authored full-canvas (2880), so recentre
          by -BLEED_X to cover the full width of any aspect, matching the ground
          bleed (not just the focal zone). */}
      <g transform={`translate(${-BLEED_X},0)`}>
        <WeatherLayer {...propsFor('weather')} />
      </g>
    </svg>
  );
}

export default LobbyAirfieldScene;
