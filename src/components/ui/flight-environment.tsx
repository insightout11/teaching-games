'use client';

import { useReducedMotion } from 'framer-motion';
import { SkyBackground } from '@/components/ui/sky-background';
import type { WeatherState } from '@/components/ui/sky-background';
import type { EarthState } from '@/lib/flight-plan-helpers';
import { Z } from '@/components/ui/flight-animation-tokens';

// ─── Types ───────────────────────────────────────────────────────────────────

export type FlightScene =
  | 'gate'       // planner: mission setup
  | 'route'      // planner: flight plan screen
  | 'preflight'  // planner: review / launch
  | 'boarding'   // lobby: waiting for students
  | 'takeoff'    // live session: first module
  | 'cruise'     // live session: mid-lesson
  | 'descent'    // live session: final module
  | 'arrival';   // end session summary

export type FlightWeather = 'clear' | 'golden' | 'rain' | 'wind' | 'storm-edge';
export type FlightMotionIntensity = 'quiet' | 'active' | 'cinematic';

// ─── Scene → SkyBackground mapping ───────────────────────────────────────────

interface SceneConfig {
  earthState: EarthState;
  weatherState: WeatherState;
  altitude: number;
}

const SCENE_MAP: Record<FlightScene, SceneConfig> = {
  // Pre-flight scenes: on the ground, amber dawn, runway visible
  gate:      { earthState: 'takeoff', weatherState: 'climbing', altitude: 0 },
  route:     { earthState: 'takeoff', weatherState: 'climbing', altitude: 0 },
  preflight: { earthState: 'takeoff', weatherState: 'climbing', altitude: 0 },
  boarding:  { earthState: 'takeoff', weatherState: 'climbing', altitude: 0 },
  // In-flight scenes: sky state tracks lesson progress
  takeoff:   { earthState: 'flight',  weatherState: 'climbing', altitude: 0.3 },
  cruise:    { earthState: 'flight',  weatherState: 'cruising', altitude: 0.8 },
  descent:   { earthState: 'flight',  weatherState: 'golden',   altitude: 0.4 },
  // Arrival: back on the ground, soft landing light
  arrival:   { earthState: 'landing', weatherState: 'landing',  altitude: 0 },
};

// ─── Component ───────────────────────────────────────────────────────────────

interface FlightEnvironmentProps {
  scene: FlightScene;
  /** Reserved: will drive transition animations in a future task */
  previousScene?: FlightScene;
  /** Reserved: will modulate weather overlay in a future task */
  weather?: FlightWeather;
  /** Reserved: will control motion budget in a future task */
  motionIntensity?: FlightMotionIntensity;
  className?: string;
  /** Overlay slot — rendered at z-index sceneOverlay, pointer-events-none */
  children?: React.ReactNode;
}

export function FlightEnvironment({
  scene,
  className,
  children,
}: FlightEnvironmentProps) {
  const prefersReducedMotion = useReducedMotion();
  const config = SCENE_MAP[scene];

  return (
    <>
      <SkyBackground
        earthState={config.earthState}
        weatherState={config.weatherState}
        altitude={config.altitude}
        intensity={prefersReducedMotion ? 'subtle' : 'moderate'}
        className={className}
      />
      {children && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: Z.sceneOverlay }}
          aria-hidden
        >
          {children}
        </div>
      )}
    </>
  );
}
