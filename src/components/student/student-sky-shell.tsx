'use client';

import type { ReactNode } from 'react';
import { SkyBackground, type WeatherState } from '@/components/ui/sky-background';

// Shared student-device backdrop — the same night-flight sky system every teacher
// surface uses, so the student's phone reads as part of the same product instead of
// a generic slate gradient. Weather carries the session narrative: 'idle' = parked
// at the gate (join/boarding), 'cruising' = in flight (live controller), 'landing'
// = warm arrival glow (session complete).
export function StudentSkyShell({
  children,
  weather = 'cruising',
  center = false,
}: {
  children: ReactNode;
  weather?: WeatherState;
  center?: boolean;
}) {
  return (
    <div className="relative min-h-screen bg-lc-bg">
      {/* hideMoon: on a small phone screen the moon reads as a UI element and distracts
          from the controls — students get clouds and stars only. */}
      <SkyBackground weatherState={weather} altitude={0.8} intensity="subtle" showEarth={false} hideMoon />
      {/* Legibility veil — keeps cards readable over the horizon glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(180deg, rgba(7,11,20,0.35) 0%, rgba(7,11,20,0.5) 55%, rgba(7,11,20,0.62) 100%)',
        }}
      />
      <div
        className={
          center
            ? 'relative z-10 min-h-screen flex items-center justify-center p-4'
            : 'relative z-10 min-h-screen p-3 sm:p-4'
        }
      >
        {children}
      </div>
    </div>
  );
}
