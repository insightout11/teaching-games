import { LAYOUT, type ArrivalPhase } from './types';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ─────────────────────────────────────────────────────────────────────────────
// Shared cinematic timelines for the arrival-scene library. ONE source of truth
// for mapping a 0–1 review/overlay progress onto the scene's controlled frame,
// used by the gallery "Play cinematic", the passport replay and the live flight
// overlay so all three stay in lockstep. The scene component itself still owns no
// timeline — these helpers just produce the (phase, progress) / pan it is fed.
// ─────────────────────────────────────────────────────────────────────────────

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

// ── Arrival ──────────────────────────────────────────────────────────────────
/** Full arrival review/overlay length. */
export const ARRIVAL_DURATION_MS = 8400;

// Phase split points along the 0–1 master progress. Touchdown gets generous
// timeline space so the suspension settle reads as weight, not a hit.
/** Master-progress point where the wheels make contact — the approach ends and
 *  the touchdown settle begins. Exported so audio can land its hit on the same
 *  instant the visual does. */
export const A_APPROACH_END = 0.52;
/** Master-progress point where the settle completes and the aircraft is fully
 *  down on its gear — the plane blends to its runway calibration across this
 *  phase, so this, not A_APPROACH_END, is when the wheels visibly meet tarmac. */
export const A_TOUCHDOWN_END = 0.72;
const A_TAXI_END = 0.94;

/**
 * Map master arrival progress (0–1) onto the scene's phase + per-phase progress:
 * approach (diagonal descent) → touchdown (settle) → taxi (roll) → landed (park).
 */
export function arrivalTimeline(t: number): { phase: ArrivalPhase; progress: number } {
  const p = clamp01(t);
  if (p < A_APPROACH_END) return { phase: 'approach', progress: p / A_APPROACH_END };
  if (p < A_TOUCHDOWN_END) return { phase: 'touchdown', progress: (p - A_APPROACH_END) / (A_TOUCHDOWN_END - A_APPROACH_END) };
  if (p < A_TAXI_END) return { phase: 'taxi', progress: (p - A_TOUCHDOWN_END) / (A_TAXI_END - A_TOUCHDOWN_END) };
  return { phase: 'landed', progress: (p - A_TAXI_END) / (1 - A_TAXI_END) };
}

// ── Departure ────────────────────────────────────────────────────────────────
/** Full takeoff review/overlay length — longer than arrival's per-leg beat so the
 *  tracking ground-roll has room to build speed before rotation. */
export const DEPARTURE_DURATION_MS = 4800;

/** Fraction of the departure spent rolling before rotation/climb. Long, so the
 *  tracking ground-roll reads as a real speed build rather than a quick hop. */
export const DEP_ROLL = 0.62;

const DEP_PAN_ROLL = 1500; // focal units the NEAR ground scrolls during the roll
const DEP_PAN_CLIMB = 480; // extra scroll as the nose lifts and the city slides off

/**
 * Tracking-camera pan distance (focal units) for takeoff: the viewpoint follows
 * the plane, so the world scrolls LEFT. Eased-in over the roll so speed visibly
 * builds, then continues through the climb. Each scene layer multiplies this by
 * its depth (near = full, far = a fraction) to get parallax. Monotonically
 * non-decreasing, 0 at p=0; shared by the composer (city + terrain silhouettes)
 * and the runway layer (markings) so they read as one camera. Pure function of
 * progress — no timeline of its own.
 */
export function departureCameraPan(t: number): number {
  const p = clamp01(t);
  if (p < DEP_ROLL) {
    const u = p / DEP_ROLL;
    return DEP_PAN_ROLL * u * u; // accelerate into the roll
  }
  const u = (p - DEP_ROLL) / (1 - DEP_ROLL);
  return DEP_PAN_ROLL + DEP_PAN_CLIMB * u;
}

/** A side-profile plane keyframe: wheel-line position, rotation, depth scale. */
export interface PlaneFrame {
  cx: number;
  cyBase: number;
  rot: number;
  flying: boolean;
  depthScale: number;
}

/**
 * Departure plane keyframe: the camera tracks the plane, so it holds near centre
 * through the ground roll, then rotates and climbs out to the upper-right,
 * shrinking as it leaves the foreground. Continuous at the DEP_ROLL boundary
 * (cx/cyBase/rot all match) so there is no kink when rotation begins.
 */
/** Focal-x the camera is centred on (= screen centre of the 16:9 focal zone). */
export const DEP_PLANE_CENTER = 800;

/**
 * Takeoff "lead": at p=0 the world starts shifted RIGHT by this many focal units
 * (×each layer's depth), so the centred plane sits further BACK relative to the
 * city — there's a lot of city AHEAD to roll through, and (because the pan below
 * consumes the lead) the authored city is still largely on-screen at the END
 * instead of having scrolled away to blank. Tunable: larger = further back / more
 * city held at the end, but a sparser start.
 */
export const DEP_CITY_LEAD = 1200;

export function departurePlaneFrame(t: number): PlaneFrame {
  const p = clamp01(t);
  const runway = LAYOUT.runwayY;
  if (p < DEP_ROLL) {
    // Camera stays centred on the plane: it holds dead-centre while the world
    // (runway markings, crosswalk threshold, city) scrolls left beneath it. The
    // plane begins behind the crosswalk (runway threshold) — see the runway layer.
    return { cx: DEP_PLANE_CENTER, cyBase: runway, rot: 0, flying: false, depthScale: 1 };
  }
  const u = (p - DEP_ROLL) / (1 - DEP_ROLL);
  // Climb out and OFF the screen (don't stop mid-sky): cx clears the right edge
  // well before u=1, leaving a beat of empty sky as the plane departs.
  return {
    cx: lerp(DEP_PLANE_CENTER, 2300, u),
    cyBase: lerp(runway, 20, u),
    rot: lerp(0, -15, u),
    flying: true,
    depthScale: lerp(1, 0.5, u),
  };
}

/**
 * Aircraft-calibration blend for departure: 1 = parked calibration (during the
 * roll), ramping to 0 = flying calibration just after rotation begins. Mirrors
 * the arrival touchdown blend so planes whose parked/flying scale or offset
 * differ don't snap at the DEP_ROLL boundary. Continuous and monotonic.
 */
const DEP_CALIBRATION_RAMP = 0.14;
export function departureCalibrationBlend(t: number): number {
  return 1 - clamp01((clamp01(t) - DEP_ROLL) / DEP_CALIBRATION_RAMP);
}
