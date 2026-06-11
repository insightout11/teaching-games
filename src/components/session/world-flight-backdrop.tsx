'use client';

import { SkyBackground, type WeatherState } from '@/components/ui/sky-background';
import { DestinationArrivalScene } from '@/components/world-flight/arrival-scene/destination-arrival-scene';
import type { DestinationScene } from '@/lib/world-flight/types';
import type { TimeOfDay } from '@/components/world-flight/arrival-scene/types';

interface WorldFlightArrivalBackdropProps {
  destinationId: string;
  scene: DestinationScene;
  weatherState: WeatherState;
  altitude?: number;
  timeOfDay?: TimeOfDay;
  planeKey?: string | null;
  /** Full-screen (no sidebar) vs. offset by the 256px dashboard sidebar. */
  isFullScreen?: boolean;
}

// Shared World Flight ground backdrop: the city's own arrival scene (a parked,
// landed plane) composited over the same full-bleed SkyBackground every flight
// leg uses. Used by the in-session ground (origin at takeoff, destination at
// landing), and the "You've Landed" screen — so all of them, plus the between-
// module transitions, read as the same place at the same scale.
//
// `fit` stays at the default 'meet' (whole scene visible, never zoomed); the
// SkyBackground behind fills any extra width so wide viewports never letterbox.
export function WorldFlightArrivalBackdrop({
  destinationId,
  scene,
  weatherState,
  altitude,
  timeOfDay,
  planeKey,
  isFullScreen,
}: WorldFlightArrivalBackdropProps) {
  return (
    <>
      <SkyBackground
        weatherState={weatherState}
        altitude={altitude}
        earthState="flight"
        showEarth={false}
        showMoon={timeOfDay === 'night'}
        intensity="moderate"
        className={isFullScreen ? '' : '!left-64'}
      />
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1, left: isFullScreen ? 0 : 256 }}>
        <DestinationArrivalScene
          destinationId={destinationId}
          scene={scene}
          phase="landed"
          progress={1}
          transparentSky
          timeOfDay={timeOfDay}
          planeKey={planeKey}
          className="absolute inset-0"
        />
      </div>
    </>
  );
}
