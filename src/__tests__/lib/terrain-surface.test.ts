import { describe, expect, it, vi } from 'vitest';
import { buildSurfaceGrid, copySurfaceTexture, drawSurface, hasSurfaceRelief, HEIGHT_UNITS, sampleHeight, surfaceCameraHeight, easeSurfaceHeight, safeExaggeration, surfacePeakAhead, surfaceFromHighGround, surfaceLightDirection, surfacePoint, type SurfaceView } from '@/lib/live-room/terrain-surface';
import { realTerrain } from '@/components/live-room/flight/ground-texture';
import { routeLengthKm, toRoute, type CoastStrip } from '@/lib/live-room/coast-strip';

const from = { lat: 47.3769, lng: 8.5417 }, to = { lat: 45.4642, lng: 9.19 };
const farm = { terrain: 'farmland' as const, region: 'Europe' };
const strip: CoastStrip = { origin: from, destination: to, routeKm: routeLengthKm(from, to), ground: [[farm]], land: [], lines: [], shores: [] };
const view: SurfaceView = { width: 40, height: 30, horizon: 12, focal: 36, cameraHeight: 3200,
  ahead: 0, alongScale: 400, sideScale: 280, textureZ: 0, far: 60000, near: 900,
  sunX: 0.3, sunY: 0.18, dark: false, haze: [160, 184, 208], fallback: [120, 130, 90], snow: [240, 245, 255], cloudCover: 0, seconds: 0 };

function local(height: (ahead: number, side: number) => number) {
  const rows = 41, cols = 61, heights = new Float32Array(rows * cols);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) heights[r * cols + c] = height(-20 + r * 5, -150 + c * 5);
  return surfaceFromHighGround({ ahead0: -20, side0: -150, step: 5, rows, cols, height: heights, rugged: new Float32Array(heights.length), snow: new Uint8Array(heights.length) });
}

describe('continuous elevation in the original flight frame', () => {
  it('keeps the feature off by default and converts real metres without changing the camera scale', () => {
    expect(realTerrain()).toBe(false);
    expect(8000 * HEIGHT_UNITS).toBe(3200);
  });
  it('keeps sun lighting relative to the plane heading and real elevation angle', () => {
    expect(surfaceLightDirection(90, 0, 90)).toEqual([0, 1, 0]);
    expect(surfaceLightDirection(180, 0, 90)[0]).toBeCloseTo(1);
    expect(surfaceLightDirection(90, 90, 90)[2]).toBeCloseTo(1);
  });
  it('lowers the camera during descent over high terrain while keeping clearance', () => {
    const ground = 4500, cruise = surfaceCameraHeight(3200, ground, 1);
    const halfway = surfaceCameraHeight(1600, ground, 0.5), low = surfaceCameraHeight(800, ground, 0.25);
    expect(cruise).toBe(5600);
    expect(halfway).toBeLessThan(cruise); expect(low).toBeLessThan(halfway);
    expect(low).toBeGreaterThan(ground);
    expect(surfaceCameraHeight(3200, 0, 1)).toBe(3200);
  });
  it('looks ahead for higher ridges, eases without a jump, and bounds even an unexpected summit below the camera', () => {
    const g = local(a => a > 100 ? 8000 : 1000);
    expect(surfacePeakAhead(g, 0, 150, 100)).toBe(8000);
    const target = surfaceCameraHeight(3200, 8000 * HEIGHT_UNITS * 2.2, 1);
    const next = easeSurfaceHeight(3200, target, 1 / 60);
    expect(next).toBeGreaterThan(3200); expect(next - 3200).toBeLessThan(70);
    expect(8000 * HEIGHT_UNITS * safeExaggeration(next, 8000, 1)).toBeLessThanOrEqual(next - 1099);
    expect(easeSurfaceHeight(target, 3200, 1 / 60)).toBeLessThan(target);
  });
  it('maps along and side coordinates back to the same great-circle coast frame', () => {
    const rad = Math.PI / 180;
    const heading = Math.atan2(Math.sin((to.lng - from.lng) * rad) * Math.cos(to.lat * rad), Math.cos(from.lat * rad) * Math.sin(to.lat * rad) - Math.sin(from.lat * rad) * Math.cos(to.lat * rad) * Math.cos((to.lng - from.lng) * rad));
    for (const along of [-50, 0, 100, 250]) for (const side of [-30, 0, 30]) {
      const actual = toRoute(from, heading, surfacePoint(from, to, along, side, strip.routeKm));
      expect(actual[0]).toBeCloseTo(along, 1); expect(actual[1]).toBeCloseTo(side, 1);
    }
  });
  it('interpolates a sloping field continuously across cells, with no random peak shapes', () => {
    const g = local((a, s) => 2000 + a * 3 + s * 2);
    expect(sampleHeight(g, 32.25, 11.5)).toBeCloseTo(2000 + 32.25 * 3 + 11.5 * 2);
    expect(sampleHeight(g, 34.999, 11.5)).toBeCloseTo(sampleHeight(g, 35.001, 11.5), 1);
    expect(sampleHeight(g, 500, 0)).toBe(0);
  });
  it('does not erase inland mountain routes that have no nearby coastline ring', () => {
    const g = buildSurfaceGrid(strip, () => 3000);
    expect(sampleHeight(g, 100, 0)).toBeCloseTo(3000);
    expect(hasSurfaceRelief(g, 0, 150, 100)).toBe(true);
  });
  it('keeps sea at zero and ramps the sampled land to the shoreline', () => {
    const g = buildSurfaceGrid({ ...strip, land: [[[-200, -100], [500, -100], [500, 100], [-200, 100]]] }, () => 3000);
    expect(sampleHeight(g, 100, 120)).toBe(0);
    expect(sampleHeight(g, 100, 96)).toBeLessThan(sampleHeight(g, 100, 80));
    expect(sampleHeight(g, 100, 80)).toBeCloseTo(3000);
    const ocean = buildSurfaceGrid(strip, () => 0);
    expect(hasSurfaceRelief(ocean, 0, 150, 100)).toBe(false);
    expect(hasSurfaceRelief(local(() => 100), 0, 150, 100)).toBe(false);
  });
});

describe('voxel-space occlusion and rendering', () => {
  it('reads texture pixels from a disposable reduced copy, never the live pattern source', () => {
    const source = { width: 512, getContext: vi.fn(() => { throw new Error('live texture read'); }) };
    const pixels = new Uint8ClampedArray(64 * 64 * 4).fill(120);
    const drawImage = vi.fn(), getImageData = vi.fn(() => ({ data: pixels }));
    const getContext = vi.fn(() => ({ drawImage, getImageData }));
    vi.stubGlobal('document', { createElement: () => ({ getContext }) });
    try {
      const texture = copySurfaceTexture(source as unknown as HTMLCanvasElement)!;
      expect(source.getContext).not.toHaveBeenCalled();
      expect(getContext).toHaveBeenCalledWith('2d', { willReadFrequently: true });
      expect(drawImage).toHaveBeenCalledWith(source, 0, 0, 64, 64);
      expect(texture.mean).toEqual([120, 120, 120]);
      expect(texture.worldSize).toBe(512 * 14);
    } finally { vi.unstubAllGlobals(); }
  });
  it('leaves foreground sea clear instead of extending a far mountain down over the water', () => {
    const g = local(a => a > 75 && a < 130 ? 3000 : 0);
    const pixels = new Uint8ClampedArray(view.width * view.height * 4), depth = new Float32Array(view.width * view.height);
    expect(drawSurface(g, new Map(), view, pixels, depth)).toBeGreaterThan(0);
    for (let x = 0; x < view.width; x++) expect(pixels[((view.height - 1) * view.width + x) * 4 + 3]).toBe(0);
    expect(depth.some(Number.isFinite)).toBe(true);
  });
  it('draws a continuous raised plain, and changes lighting when the sun crosses the slope', () => {
    const g = local((a, s) => 3000 + s * 14);
    const left = new Uint8ClampedArray(view.width * view.height * 4), right = new Uint8ClampedArray(left.length);
    const depth = new Float32Array(view.width * view.height);
    drawSurface(g, new Map(), { ...view, sunX: 0.1 }, left, depth);
    drawSurface(g, new Map(), { ...view, sunX: 0.9 }, right, depth);
    expect(left.some((v, i) => i % 4 === 3 && v === 255)).toBe(true);
    expect(left).not.toEqual(right);
  });
  it('exaggerates the projected surface while retaining real metres for the snow threshold', () => {
    const g = local(() => 1800); g.snowline.fill(2500);
    const plain = new Uint8ClampedArray(view.width * view.height * 4), raised = new Uint8ClampedArray(plain.length);
    const depth = new Float32Array(view.width * view.height);
    drawSurface(g, new Map(), view, plain, depth);
    drawSurface(g, new Map(), { ...view, exaggeration: 2.5 }, raised, depth);
    expect(plain).not.toEqual(raised);
    const alternateSnow = new Uint8ClampedArray(plain.length);
    drawSurface(g, new Map(), { ...view, exaggeration: 2.5, snow: [255, 0, 255] }, alternateSnow, depth);
    expect(raised).toEqual(alternateSnow);
    expect(sampleHeight(g, 20, 0)).toBe(1800);
  });
});
