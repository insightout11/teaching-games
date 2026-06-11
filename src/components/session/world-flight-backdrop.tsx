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
// `fit='slice'` fills the viewport edge-to-edge (runway + ground reach both
// sides like the generic landing), bottom-anchored so the cropped overflow is
// the upper sky — which the SkyBackground behind supplies (clouds + moon). On a
// 16:9 screen this is a 1:1 fill; on wider windows the scene scales up to cover.
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
          fit="slice"
          timeOfDay={timeOfDay}
          planeKey={planeKey}
          className="absolute inset-0"
        />
      </div>
    </>
  );
}
