import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CoastStrip } from '@/lib/live-room/coast-strip';
import type { SurfaceGrid } from '@/lib/live-room/terrain-surface';

vi.mock('@/lib/live-room/terrain-surface', () => ({ loadSurfaceGrid: vi.fn() }));
import { loadSurfaceGrid } from '@/lib/live-room/terrain-surface';
import { flightSurface, FLIGHT_TERRAIN_TIMEOUT_MS } from '@/lib/live-room/flight-surface';
import { realTerrain, setRealTerrain } from '@/components/live-room/flight/ground-texture';

afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); vi.unstubAllGlobals(); setRealTerrain(true); });
const route = () => ({}) as CoastStrip;
const grid = (source: SurfaceGrid['source'] = 'terrarium', failedTiles = 0) => ({ source, failedTiles }) as SurfaceGrid;

describe('flight terrain decision', () => {
  it('shares a complete take-off load between preload and cockpit', async () => {
    const strip = route(), complete = grid(); vi.mocked(loadSurfaceGrid).mockResolvedValue(complete);
    const a = flightSurface(strip), b = flightSurface(strip);
    expect(a).toBe(b); expect(await a).toBe(complete); expect(loadSurfaceGrid).toHaveBeenCalledTimes(1);
  });
  it('allows boarding to preload before the take-off deadline starts', async () => {
    vi.useFakeTimers();
    vi.mocked(loadSurfaceGrid).mockImplementation(() => new Promise(() => {}));
    const strip = route(), preload = flightSurface(strip, false);
    await vi.advanceTimersByTimeAsync(20000);
    expect(vi.mocked(loadSurfaceGrid).mock.calls[0][1]?.aborted).toBe(false);
    expect(flightSurface(strip)).toBe(preload);
    await vi.advanceTimersByTimeAsync(FLIGHT_TERRAIN_TIMEOUT_MS);
    expect(await preload).toBeNull();
  });
  it('accepts a cold route that takes longer than the former six-second cutoff', async () => {
    vi.useFakeTimers();
    const complete = grid();
    vi.mocked(loadSurfaceGrid).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(complete), 25000)));
    const pending = flightSurface(route());
    await vi.advanceTimersByTimeAsync(25000);
    expect(await pending).toBe(complete);
    expect(vi.mocked(loadSurfaceGrid).mock.calls[0][1]?.aborted).toBe(false);
  });
  it('cancels a slow load and never enables a late grid for that flight', async () => {
    vi.useFakeTimers(); let finish!: (g: SurfaceGrid) => void;
    vi.mocked(loadSurfaceGrid).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const strip = route(), pending = flightSurface(strip);
    await vi.advanceTimersByTimeAsync(FLIGHT_TERRAIN_TIMEOUT_MS);
    expect(await pending).toBeNull(); expect(vi.mocked(loadSurfaceGrid).mock.calls[0][1]?.aborted).toBe(true);
    finish(grid()); await Promise.resolve(); expect(await flightSurface(strip)).toBeNull();
  });
  it.each([grid('mixed', 1), grid('terrarium', 1), grid('coarse', 10)])('falls back for incomplete elevation %j', async bad => {
    vi.mocked(loadSurfaceGrid).mockResolvedValue(bad); expect(await flightSurface(route())).toBeNull();
  });
  it('falls back when the loader rejects', async () => {
    vi.mocked(loadSurfaceGrid).mockRejectedValue(new Error('offline')); expect(await flightSurface(route())).toBeNull();
  });
  it('defaults on without a URL off switch', () => {
    vi.stubGlobal('location', { search: '?terrain=off' }); expect(realTerrain()).toBe(true);
    setRealTerrain(false); expect(realTerrain()).toBe(false);
  });
});
