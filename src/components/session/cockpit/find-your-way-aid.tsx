'use client';

import { Compass } from 'lucide-react';
import { distanceBetweenCoordsKm, formatDistance } from '@/lib/world-flight/geo';
import type { InputSpec } from '@/lib/input-spec';

// Teacher-only Find Your Way aid, shown in the COCKPIT (the teacher's own device — never the
// projected screen). Reads the guide's secret destination straight out of the live input
// spec's perStudentData, so the teacher can step in and help the guide when needed.

interface GuideTarget {
  lat: number;
  lng: number;
  label?: string;
}

function extractGuideTarget(spec: InputSpec): GuideTarget | null {
  for (const value of Object.values(spec.perStudentData ?? {})) {
    const entry = value as { guide?: boolean; target?: GuideTarget } | undefined;
    if (entry?.guide === true && entry.target && Number.isFinite(entry.target.lat)) {
      return entry.target;
    }
  }
  return null;
}

const WINDS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];

function bearingName(from: { lat: number; lng: number }, to: { lat: number; lng: number }): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(to.lat));
  const x =
    Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) -
    Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(dLng);
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return WINDS[Math.round(((deg + 360) % 360) / 45) % 8];
}

export function FindYourWayAid({ spec }: { spec: InputSpec }) {
  const target = extractGuideTarget(spec);
  if (!target) return null;
  const start = spec.mapMarkers?.[0] ?? null;

  return (
    <div className="rounded-2xl border border-amber-300/25 bg-amber-500/[0.08] p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">
        <Compass className="h-3.5 w-3.5" aria-hidden />
        Find Your Way · teacher eyes only
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{target.label ?? 'Destination'}</p>
      {start && (
        <p className="mt-1 text-sm text-amber-100">
          About {formatDistance(distanceBetweenCoordsKm(start, target))}{' '}
          <span className="font-semibold">{bearingName(start, target)}</span> of {start.label ?? 'the start'}.
        </p>
      )}
      <p className="mt-2 text-xs text-amber-200/60">
        Only the guide&apos;s device shows this pin — use it to nudge them if they get stuck.
      </p>
    </div>
  );
}
