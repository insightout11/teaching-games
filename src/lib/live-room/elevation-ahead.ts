/**
 * Real high ground around the plane (terrain upgrade, Oct 2026): a coarse grid over the view, in the cockpit's frame,
 * from Codex's world elevation map (NOAA ETOPO1, `src/lib/live-room/elevation.ts`). For each cell: how high the land is,
 * how rugged (the spread of heights around it: mountains, not a high flat plateau), and whether peaks there would hold
 * snow at that latitude. The scenery puts its mountains and hills where this says, not where the land type guesses.
 */

import { elevationAt, loadElevation } from '@/lib/live-room/elevation';
import type { LatLng } from '@/lib/live-room/route-terrain';

export interface HighGround {
  /** First row's distance ahead (km), the step between rows and columns (km), and the grid size. */
  ahead0: number; side0: number; step: number; rows: number; cols: number;
  /** Per cell (row-major: rows = ahead, cols = side): height (m), ruggedness (m), snow on the peaks (0/1). */
  height: Float32Array; rugged: Float32Array; snow: Uint8Array;
}

const R = 6371, rad = Math.PI / 180;

/** [km ahead, km right] from `at` on `headingDeg` → a point on the map (local flat frame; fine for ~200 km). */
function fromFrame(at: LatLng, headingDeg: number, ahead: number, side: number): LatLng {
  const h = headingDeg * rad;
  const north = ahead * Math.cos(h) - side * Math.sin(h), east = ahead * Math.sin(h) + side * Math.cos(h);
  return { lat: at.lat + north / R / rad, lng: at.lng + east / (R * Math.cos(at.lat * rad)) / rad };
}

/** The permanent snowline (m) at a latitude: about 5000 m in the tropics, falling to sea level near the poles. */
export function snowlineM(lat: number): number {
  const a = Math.abs(lat);
  return a < 25 ? 5000 : Math.max(0, 5000 - (a - 25) * 120);
}

/** The high-ground grid over the view ahead of the plane. */
export async function highGroundAhead(at: LatLng, headingDeg: number): Promise<HighGround> {
  await loadElevation();
  const ahead0 = -20, side0 = -130, step = 10, rows = 21, cols = 27;
  const height = new Float32Array(rows * cols), rugged = new Float32Array(rows * cols), snow = new Uint8Array(rows * cols);
  const elev = (a: number, s: number) => Math.max(0, elevationAt(fromFrame(at, headingDeg, a, s)));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = ahead0 + r * step, s = side0 + c * step;
      // the map averages each cell over ~50 km (peaks and valleys smoothed away), so ruggedness is how far the land
      // rises above the lowest ground 40-70 km around it
      const here = elev(a, s);
      let lo = here;
      for (const d of [40, 70]) for (let k = 0; k < 8; k++) {
        const t = (k / 8) * Math.PI * 2;
        lo = Math.min(lo, elev(a + Math.cos(t) * d, s + Math.sin(t) * d));
      }
      const i = r * cols + c;
      height[i] = here;
      rugged[i] = here - lo;
      const p = fromFrame(at, headingDeg, a, s);
      // real peaks stand well above the cell's average height
      snow[i] = here + 1400 > snowlineM(p.lat) ? 1 : 0;
    }
  }
  return { ahead0, side0, step, rows, cols, height, rugged, snow };
}

/** Look up the grid at a point in the frame (nearest cell); null outside it. */
export function highGroundAt(g: HighGround, ahead: number, side: number): { height: number; rugged: number; snow: boolean } | null {
  const r = Math.round((ahead - g.ahead0) / g.step), c = Math.round((side - g.side0) / g.step);
  if (r < 0 || r >= g.rows || c < 0 || c >= g.cols) return null;
  const i = r * g.cols + c;
  return { height: g.height[i], rugged: g.rugged[i], snow: g.snow[i] === 1 };
}
