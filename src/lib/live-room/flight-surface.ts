import type { CoastStrip } from './coast-strip';
import { loadSurfaceGrid, type SurfaceGrid } from './terrain-surface';

// A cold route needs hundreds of tiles through a six-request pool. Six seconds
// only loaded 58 tiles in the live game, permanently selecting the old scenery.
export const FLIGHT_TERRAIN_TIMEOUT_MS = 60000;
/**
 * A few failed tiles must not cost the whole flight its terrain: their samples are already filled from the
 * bundled coarse elevation. Fall back only when the download largely failed (more than 10% of tiles).
 */
export function usableGrid(grid: SurfaceGrid | null | undefined): grid is SurfaceGrid {
  if (!grid || grid.source === 'coarse' || !grid.tiles) return false;
  const failed = grid.failedTiles ?? 0;
  return failed <= Math.max(2, (grid.tiles + failed) * 0.1);
}
type FlightSurface = { pending: Promise<SurfaceGrid | null>; startDeadline: () => void };
const flights = new WeakMap<CoastStrip, FlightSurface>();

/** Preload during boarding; at take-off allow at most a minute, then keep the old scenery. */
export function flightSurface(strip: CoastStrip, takingOff = true): Promise<SurfaceGrid | null> {
  const previous = flights.get(strip);
  if (previous) { if (takingOff) previous.startDeadline(); return previous.pending; }
  const controller = new AbortController();
  let deadline: number | null = null, timer: ReturnType<typeof setTimeout> | undefined;
  let settled = false, finish!: (grid: SurfaceGrid | null) => void;
  const pending = new Promise<SurfaceGrid | null>(resolve => { finish = resolve; });
  const startDeadline = () => {
    if (settled || deadline !== null) return;
    deadline = Date.now() + FLIGHT_TERRAIN_TIMEOUT_MS;
    timer = setTimeout(() => { settled = true; controller.abort(); finish(null); }, FLIGHT_TERRAIN_TIMEOUT_MS);
  };
  flights.set(strip, { pending, startDeadline });
  if (takingOff) startDeadline();
  void loadSurfaceGrid(strip, controller.signal).then(grid => {
    clearTimeout(timer);
    if (process.env.NODE_ENV === 'development') console.info('[flight terrain]', { source: grid?.source, tiles: grid?.tiles, failed: grid?.failedTiles, timedOut: controller.signal.aborted });
    // Synchronous grid preparation can cross the deadline before the timer gets a turn.
    if (deadline !== null && Date.now() >= deadline) controller.abort();
    settled = true;
    finish(!controller.signal.aborted && usableGrid(grid) ? grid : null);
  }).catch(error => { if (process.env.NODE_ENV === 'development') console.info('[flight terrain] fallback', String(error)); clearTimeout(timer); settled = true; finish(null); });
  return pending;
}
