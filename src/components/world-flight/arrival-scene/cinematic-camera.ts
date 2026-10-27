import { VIEWBOX, type ArrivalMode, type ArrivalPhase } from './types';
import { A_APPROACH_END, A_TOUCHDOWN_END, DEP_ROLL } from './cinematic-motion';

export interface CinematicCameraFrame {
  targetX: number;
  targetY: number;
  zoom: number;
  roll: number;
}

const CENTER_X = VIEWBOX.w / 2;
const CENTER_Y = VIEWBOX.h / 2;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (t: number) => {
  const value = clamp01(t);
  return value * value * (3 - 2 * value);
};
const sineArc = (t: number) => {
  const value = clamp01(t);
  return value === 0 || value === 1 ? 0 : Math.sin(value * Math.PI);
};
const sway = (t: number, amplitude: number) => {
  const arc = sineArc(t);
  return arc === 0 ? 0 : arc * amplitude;
};

const IDENTITY_CAMERA: CinematicCameraFrame = {
  targetX: CENTER_X,
  targetY: CENTER_Y,
  zoom: 1,
  roll: 0,
};

/**
 * Deterministic arrival camera. Phase endpoints intentionally match the next
 * phase's starting frame so a continuous arrival timeline never jumps.
 */
export function cinematicCameraFrame(mode: ArrivalMode, phase: ArrivalPhase, progress: number): CinematicCameraFrame {
  if (mode === 'departure') {
    // The ground roll keeps the camera locked (the tracking pan does the work).
    // After rotation, a VERY subtle upward follow + hair of push-in keeps the
    // climbing plane in frame while the ground falls away. Monotonic, no shake.
    const dp = clamp01(progress);
    if (dp < DEP_ROLL) return IDENTITY_CAMERA;
    const climb = smoothstep((dp - DEP_ROLL) / (1 - DEP_ROLL));
    return {
      targetX: CENTER_X,
      targetY: CENTER_Y - 70 * climb,
      zoom: 1 + 0.03 * climb,
      roll: 0,
    };
  }

  // One continuous move over the whole arrival (Oct 2026, owner: landing glitched): each phase used to ease to a stop
  // and start again, so the camera stuttered at touchdown and again at the taxi.
  const p = clamp01(progress);
  const m = arrivalMaster(phase, p);
  const glide = smoothstep(m);
  const down = smoothstep(m / A_TOUCHDOWN_END);
  const settle = smoothstep((m - A_TOUCHDOWN_END) / (1 - A_TOUCHDOWN_END));
  const compression = phase === 'touchdown' ? sineArc(p) : 0;
  return {
    // ends on the parked plane (BLEED_X + its roll end, plus half the plane), so it sits in the middle of the frame (Oct 2026, owner)
    targetX: lerp(1120, 1790, glide),
    targetY: lerp(450, 512, down) - 8 * settle + compression * 1.8,
    zoom: lerp(1, 1.115, down) - 0.015 * settle + compression * 0.004,
    roll: phase === 'approach' ? sway(p, -0.16) : 0,
  };
}

const A_TAXI_END = 0.94;
/** The arrival's master progress (0-1) from a phase and its own progress, matching arrivalTimeline's split points. */
function arrivalMaster(phase: ArrivalPhase, p: number): number {
  switch (phase) {
    case 'approach': return p * A_APPROACH_END;
    case 'touchdown': return lerp(A_APPROACH_END, A_TOUCHDOWN_END, p);
    case 'taxi': return lerp(A_TOUCHDOWN_END, A_TAXI_END, p);
    case 'landed': return lerp(A_TAXI_END, 1, p);
    default: return 1;
  }
}

/** SVG transform that moves and zooms the world around the camera target. */
export function cinematicCameraTransform(frame: CinematicCameraFrame): string {
  return `translate(${CENTER_X} ${CENTER_Y}) rotate(${frame.roll}) scale(${frame.zoom}) translate(${-frame.targetX} ${-frame.targetY})`;
}

/**
 * Small extra layer offset on top of the global camera transform. It gives the
 * existing flat SVG layers a restrained 2.5D parallax response during arrival.
 */
export function cinematicParallaxX(frame: CinematicCameraFrame, depth: number): number {
  return -(frame.targetX - CENTER_X) * depth * 0.32;
}

export function cinematicParallaxY(frame: CinematicCameraFrame, depth: number): number {
  return -(frame.targetY - CENTER_Y) * depth * 0.2;
}
