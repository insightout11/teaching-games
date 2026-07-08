'use client';

// A bespoke "navigation globe" for the World Flight hero — NOT a Lucide icon.
// A wireframe night-earth (orthographic graticule) that gently swings to face the
// active destination, with glowing pins at every curated city and a great-circle
// route arc drawing into the active one. All math is orthographic projection; only
// the front hemisphere is drawn. Under reduced motion it snaps (no rAF, no swing).

import { useEffect, useMemo, useRef, useState } from 'react';
import type { HeroCity } from './hero-cities';
import { LAND_DOTS } from './land-dots';

const DEG = Math.PI / 180;
const SVG_COORD_PRECISION = 1000;

function svgCoord(value: number): number {
  return Math.round(value * SVG_COORD_PRECISION) / SVG_COORD_PRECISION;
}

interface Rot {
  lng: number; // central meridian (°) — the longitude facing the viewer
  lat: number; // central parallel (°) — the latitude facing the viewer
}

/** Orthographic projector for a given rotation + disc geometry. */
function makeProjector(rot: Rot, R: number, cx: number, cy: number) {
  const l0 = rot.lng * DEG;
  const p0 = rot.lat * DEG;
  const sinP0 = Math.sin(p0);
  const cosP0 = Math.cos(p0);
  return (lat: number, lng: number) => {
    const p = lat * DEG;
    const l = lng * DEG;
    const cosc = sinP0 * Math.sin(p) + cosP0 * Math.cos(p) * Math.cos(l - l0);
    const X = Math.cos(p) * Math.sin(l - l0);
    const Y = cosP0 * Math.sin(p) - sinP0 * Math.cos(p) * Math.cos(l - l0);
    return { x: svgCoord(cx + R * X), y: svgCoord(cy - R * Y), visible: cosc >= -0.015 };
  };
}

type Project = ReturnType<typeof makeProjector>;

/** Build an SVG path from lat/lng samples, breaking the line across the horizon. */
function pathFrom(samples: { lat: number; lng: number }[], project: Project): string {
  let d = '';
  let pen = false;
  for (const s of samples) {
    const pt = project(s.lat, s.lng);
    if (!pt.visible) {
      pen = false;
      continue;
    }
    d += `${pen ? 'L' : 'M'}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    pen = true;
  }
  return d;
}

/** Great-circle samples between two coordinates (slerp on the unit sphere). */
function greatCircle(a: HeroCity, b: HeroCity, n = 48): { lat: number; lng: number }[] {
  const p1 = a.lat * DEG, l1 = a.lng * DEG, p2 = b.lat * DEG, l2 = b.lng * DEG;
  const x1 = Math.cos(p1) * Math.cos(l1), y1 = Math.cos(p1) * Math.sin(l1), z1 = Math.sin(p1);
  const x2 = Math.cos(p2) * Math.cos(l2), y2 = Math.cos(p2) * Math.sin(l2), z2 = Math.sin(p2);
  const dot = Math.min(1, Math.max(-1, x1 * x2 + y1 * y2 + z1 * z2));
  const d = Math.acos(dot);
  const out: { lat: number; lng: number }[] = [];
  if (d < 1e-6) return [{ lat: a.lat, lng: a.lng }];
  const sinD = Math.sin(d);
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const A = Math.sin((1 - f) * d) / sinD;
    const B = Math.sin(f * d) / sinD;
    const x = A * x1 + B * x2, y = A * y1 + B * y2, z = A * z1 + B * z2;
    out.push({ lat: Math.atan2(z, Math.hypot(x, y)) / DEG, lng: Math.atan2(y, x) / DEG });
  }
  return out;
}

/** Graticule meridians + parallels (sampled densely so the curve stays smooth). */
function graticule(): { lat: number; lng: number }[][] {
  const lines: { lat: number; lng: number }[][] = [];
  for (let lng = -180; lng < 180; lng += 30) {
    const line: { lat: number; lng: number }[] = [];
    for (let lat = -80; lat <= 80; lat += 4) line.push({ lat, lng });
    lines.push(line);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const line: { lat: number; lng: number }[] = [];
    for (let lng = -180; lng <= 180; lng += 4) line.push({ lat, lng });
    lines.push(line);
  }
  return lines;
}

const GRATICULE = graticule();

function shortestDelta(from: number, to: number): number {
  let d = (to - from) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

export function NavGlobe({
  cities,
  activeIndex,
  reduced,
  size = 360,
}: {
  cities: HeroCity[];
  activeIndex: number;
  reduced: boolean;
  size?: number;
}) {
  const R = size * 0.4;
  const cx = size / 2;
  const cy = size / 2;

  const active = cities[activeIndex];
  const target: Rot = { lng: active.lng, lat: active.lat * 0.7 };
  const [rot, setRot] = useState<Rot>(target);
  const rotRef = useRef(rot);
  rotRef.current = rot;

  // Ease the globe toward the active city. Snap instantly under reduced motion.
  useEffect(() => {
    if (reduced) {
      setRot({ lng: target.lng, lat: target.lat });
      return;
    }
    let raf = 0;
    const tick = () => {
      const cur = rotRef.current;
      const dl = shortestDelta(cur.lng, target.lng);
      const dp = target.lat - cur.lat;
      if (Math.abs(dl) < 0.06 && Math.abs(dp) < 0.06) {
        setRot({ lng: target.lng, lat: target.lat });
        return;
      }
      setRot({ lng: cur.lng + dl * 0.06, lat: cur.lat + dp * 0.06 });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // target derived from activeIndex; re-run when the active city changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, reduced]);

  const project = useMemo(() => makeProjector(rot, R, cx, cy), [rot, R, cx, cy]);

  const gratPaths = useMemo(
    () => GRATICULE.map((line) => pathFrom(line, project)).filter(Boolean),
    [project],
  );

  // Dotted continents — one <path> of tiny round-capped stubs (front hemisphere
  // only). A single DOM node keeps it smooth while the globe swings.
  const landPath = useMemo(() => {
    let d = '';
    for (const [lng, lat] of LAND_DOTS) {
      const pt = project(lat, lng);
      if (pt.visible) d += `M${pt.x.toFixed(1)} ${pt.y.toFixed(1)}h.02`;
    }
    return d;
  }, [project]);

  // Route network: faint great-circle legs between consecutive cities, with the
  // leg landing on the active city drawn brighter.
  const legs = useMemo(() => {
    return cities.map((c, i) => {
      const next = cities[(i + 1) % cities.length];
      const isActiveLeg = (i + 1) % cities.length === activeIndex;
      return { d: pathFrom(greatCircle(c, next), project), isActiveLeg, key: `${c.id}-${next.id}` };
    });
  }, [cities, project, activeIndex]);

  const pins = useMemo(
    () => cities.map((c, i) => ({ ...project(c.lat, c.lng), id: c.id, active: i === activeIndex })),
    [cities, project, activeIndex],
  );

  const gid = 'wf-globe';
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      role="img"
      aria-label={`Navigation globe centered on ${active.city}`}
      className="pointer-events-none select-none overflow-visible"
    >
      <defs>
        <radialGradient id={`${gid}-face`} cx="38%" cy="34%" r="78%">
          <stop offset="0%" stopColor="#13335c" />
          <stop offset="55%" stopColor="#0a1f3c" />
          <stop offset="100%" stopColor="#040a16" />
        </radialGradient>
        <radialGradient id={`${gid}-atmos`} cx="50%" cy="50%" r="50%">
          <stop offset="80%" stopColor="rgba(34,211,238,0)" />
          <stop offset="93%" stopColor="rgba(34,211,238,0.18)" />
          <stop offset="100%" stopColor="rgba(34,211,238,0)" />
        </radialGradient>
        <clipPath id={`${gid}-clip`}>
          <circle cx={cx} cy={cy} r={R} />
        </clipPath>
      </defs>

      {/* Atmosphere halo */}
      <circle cx={cx} cy={cy} r={R * 1.16} fill={`url(#${gid}-atmos)`} />
      {/* Globe face */}
      <circle cx={cx} cy={cy} r={R} fill={`url(#${gid}-face)`} stroke="rgba(120,190,255,0.22)" strokeWidth={1} />

      <g clipPath={`url(#${gid}-clip)`}>
        {/* Dotted continents */}
        <path d={landPath} fill="none" stroke="rgba(110,231,214,0.5)" strokeWidth={1.5} strokeLinecap="round" />
        {/* Graticule (faint — the dots carry the globe) */}
        {gratPaths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="rgba(120,190,255,0.08)" strokeWidth={0.6} />
        ))}
        {/* Route legs */}
        {legs.map((leg) =>
          leg.d ? (
            <path
              key={leg.key}
              d={leg.d}
              fill="none"
              stroke={leg.isActiveLeg ? 'rgba(56,224,255,0.9)' : 'rgba(56,189,248,0.22)'}
              strokeWidth={leg.isActiveLeg ? 1.8 : 1}
              strokeLinecap="round"
              strokeDasharray={leg.isActiveLeg ? '3 4' : undefined}
            >
              {leg.isActiveLeg && !reduced && (
                <animate attributeName="stroke-dashoffset" from="14" to="0" dur="0.9s" repeatCount="indefinite" />
              )}
            </path>
          ) : null,
        )}
        {/* Terminator shading — a soft darkening toward the lower-right limb */}
        <circle cx={cx + R * 0.5} cy={cy + R * 0.5} r={R} fill="rgba(2,6,14,0.45)" />
      </g>

      {/* Pins (front hemisphere only) */}
      {pins.map((pin) =>
        pin.visible ? (
          <g key={pin.id}>
            {pin.active ? (
              <>
                <circle cx={pin.x} cy={pin.y} r={9} fill="rgba(245,158,11,0.18)">
                  {!reduced && <animate attributeName="r" values="7;13;7" dur="2.4s" repeatCount="indefinite" />}
                  {!reduced && <animate attributeName="opacity" values="0.5;0;0.5" dur="2.4s" repeatCount="indefinite" />}
                </circle>
                <circle cx={pin.x} cy={pin.y} r={4} fill="#fbbf24" stroke="#fff7e6" strokeWidth={1.2} />
              </>
            ) : (
              <circle cx={pin.x} cy={pin.y} r={2.4} fill="rgba(125,211,252,0.85)" />
            )}
          </g>
        ) : null,
      )}
    </svg>
  );
}
