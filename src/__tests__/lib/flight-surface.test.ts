import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CoastStrip } from '@/lib/live-room/coast-strip';
import type { SurfaceGrid } from '@/lib/live-room/terrain-surface';

vi.mock('@/lib/live-room/terrain-surface', () => ({ loadSurfaceGrid: vi.fn() }));
import { loadSurfaceGrid } from '@/lib/live-room/terrain-surface';
import { flightSurface } from '@/lib/live-room/flight-surface';
import { realTerrain, setRealTerrain } from '@/components/live-room/flight/ground-texture';

afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); vi.unstubAllGlobals(); setRealTerrain(true); });
const route = () => ({}) as CoastStrip;
const grid = (source: SurfaceGrid['source'] = 'terrarium', failedTiles = 0, tiles = 100) => ({ source, failedTiles, tiles }) as SurfaceGrid;

describe('flight terrain decision', () => {
  it('shares a complete take-off load between preload and cockpit', async () => {
    const strip = route(), complete = grid(); vi.mocked(loadSurfaceGrid).mockResolvedValue(complete);
    const a = flightSurface(strip), b = flightSurface(strip);
    expect(a).toBe(b); expect(await a).toBe(complete); expect(loadSurfaceGrid).toHaveBeenCalledTimes(1);
  });
  it('shares a boarding preload with the cockpit at take-off', async () => {
    const strip = route(), complete = grid(); vi.mocked(loadSurfaceGrid).mockResolvedValue(complete);
    const preload = flightSurface(strip);
    expect(flightSurface(strip)).toBe(preload); expect(await preload).toBe(complete); expect(loadSurfaceGrid).toHaveBeenCalledTimes(1);
  });
  it('never gives up on a slow connection: a grid that arrives minutes after take-off is still used', async () => {
    vi.useFakeTimers();
    const complete = grid();
    vi.mocked(loadSurfaceGrid).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(complete), 5 * 60_000)));
    const pending = flightSurface(route());
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(await pending).toBe(complete);
    expect(vi.mocked(loadSurfaceGrid).mock.calls[0][1]).toBeUndefined();
  });
  it.each([grid('mixed', 20, 100), grid('mixed', 3, 0), grid('coarse', 10)])('falls back after two retries when elevation largely failed %j', async bad => {
    vi.useFakeTimers();
    vi.mocked(loadSurfaceGrid).mockResolvedValue(bad);
    const pending = flightSurface(route());
    await vi.advanceTimersByTimeAsync(25_000);
    expect(await pending).toBeNull();
    expect(loadSurfaceGrid).toHaveBeenCalledTimes(3);
  });
  it('recovers when a retry succeeds (dropped wifi)', async () => {
    vi.useFakeTimers();
    const good = grid();
    vi.mocked(loadSurfaceGrid).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(good);
    const pending = flightSurface(route());
    await vi.advanceTimersByTimeAsync(5_000);
    expect(await pending).toBe(good);
  });
  it.each([grid('mixed', 1), grid('terrarium', 2, 20), grid('mixed', 25, 250)])('keeps the terrain when only a few tiles failed %j', async ok => {
    vi.mocked(loadSurfaceGrid).mockResolvedValue(ok); expect(await flightSurface(route())).toBe(ok);
  });
  it('falls back when the loader keeps rejecting', async () => {
    vi.useFakeTimers();
    vi.mocked(loadSurfaceGrid).mockRejectedValue(new Error('offline'));
    const pending = flightSurface(route());
    await vi.advanceTimersByTimeAsync(25_000);
    expect(await pending).toBeNull();
  });
  it('defaults on without a URL off switch', () => {
    vi.stubGlobal('location', { search: '?terrain=off' }); expect(realTerrain()).toBe(true);
    setRealTerrain(false); expect(realTerrain()).toBe(false);
  });
});
