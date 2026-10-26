import type { CoastStrip } from './coast-strip';
import { loadSurfaceGrid, type SurfaceGrid } from './terrain-surface';

/**
 * A few failed tiles must not cost the whole flight its terrain: their samples are already filled from the
 * bundled coarse elevation. Fall back only when the download largely failed (more than 10% of tiles).
 */
export function usableGrid(grid: SurfaceGrid | null | undefined): grid is SurfaceGrid {
  if (!grid || grid.source === 'coarse' || !grid.tiles) return false;
  const failed = grid.failedTiles ?? 0;
  return failed <= Math.max(2, (grid.tiles + failed) * 0.1);
}
const flights = new WeakMap<CoastStrip, Promise<SurfaceGrid | null>>();

/**
 * One terrain load per route, started during boarding and shared with the cockpit. It never gives up on a
 * timer: on slow connections (school wifi, Zoom running) the old scenery shows until the terrain is ready,
 * then the cockpit fades the terrain in, even mid-flight. A one-minute cutoff used to abort the download and
 * keep the old scenery for the whole flight.
 */
export function flightSurface(strip: CoastStrip): Promise<SurfaceGrid | null> {
  const previous = flights.get(strip); if (previous) return previous;
  const pending = (async () => {
    // Up to two retries for a load that failed or came back too incomplete (dropped wifi): tiles that already
    // arrived are cached, so a retry only fetches what is missing. The old scenery shows meanwhile.
    for (const wait of RETRY_DELAYS_MS) {
      if (wait) await new Promise(resolve => setTimeout(resolve, wait));
      const grid = await loadSurfaceGrid(strip, undefined, { fresh: wait > 0 }).catch(error => {
        if (process.env.NODE_ENV === 'development') console.info('[flight terrain] attempt failed', String(error));
        return null;
      });
      if (process.env.NODE_ENV === 'development') console.info('[flight terrain]', { source: grid?.source, tiles: grid?.tiles, failed: grid?.failedTiles });
      if (usableGrid(grid)) return grid;
    }
    return null;
  })();
  flights.set(strip, pending);
  return pending;
}

/** First attempt, then retries after 5 and 20 seconds. */
const RETRY_DELAYS_MS = [0, 5_000, 20_000];
