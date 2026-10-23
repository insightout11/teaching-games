import { describe, expect, it, vi } from 'vitest';
import { averageColour, landAt, ROUTE_SCALE } from '@/components/live-room/flight/cockpit-world';
import { realCoast } from '@/components/live-room/flight/ground-texture';

describe('texture colour sampling leaves live pattern sources unread', () => {
  it('reads only a disposable copy and preserves the opaque-pixel average', () => {
    const texture = { width: 3, height: 1, getContext: vi.fn(() => { throw new Error('live texture read'); }) };
    const pixels = new Uint8ClampedArray([20, 60, 100, 255, 40, 80, 120, 255, 255, 0, 0, 0]);
    const drawImage = vi.fn();
    const getImageData = vi.fn(() => ({ data: pixels }));
    const getContext = vi.fn(() => ({ drawImage, getImageData }));
    const probe = { width: 0, height: 0, getContext };
    vi.stubGlobal('document', { createElement: vi.fn(() => probe) });
    try {
      expect(averageColour(texture as unknown as HTMLCanvasElement)).toEqual([30, 70, 110]);
      expect(texture.getContext).not.toHaveBeenCalled();
      expect(getContext).toHaveBeenCalledWith('2d', { willReadFrequently: true });
      expect([probe.width, probe.height]).toEqual([3, 1]);
      expect(drawImage).toHaveBeenCalledWith(texture, 0, 0);
      expect(getImageData).toHaveBeenCalledWith(0, 0, 3, 1);
      expect(drawImage.mock.invocationCallOrder[0]).toBeLessThan(getImageData.mock.invocationCallOrder[0]);
    } finally { vi.unstubAllGlobals(); }
  });
  it('keeps rendering when a copied canvas cannot be read', () => {
    const getImageData = vi.fn(() => { throw new Error('unreadable'); });
    vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({ drawImage: vi.fn(), getImageData }) }) });
    try {
      expect(averageColour({ width: 1, height: 1 } as HTMLCanvasElement)).toBeNull();
      expect(getImageData).toHaveBeenCalledOnce();
    } finally { vi.unstubAllGlobals(); }
  });
});

describe('coast rendering preserves flight behaviour', () => {
  it('real coastlines are on in classes (owner approved 22 Oct 2026)', () => {
    expect(realCoast()).toBe(true);
  });
  it('keeps the land at real proportions whatever the class length or route speed', () => {
    // A 50-minute Madrid to Berlin flight used to stretch the route ~9x, Zurich to Milan ~80x.
    expect(ROUTE_SCALE).toBe(1);
  });
  it('keeps the land mask used by peaks and town lights consistent at holes and coast crossings', () => {
    const edges: number[] = [];
    for (const [left, right, front, back] of [[-100, 100, 0, 100], [-20, 20, 40, 60]]) {
      edges.push(left, front, left, back, right, front, right, back);
    }
    const cw = { edges, buckets: new Map([[0, [0, 1, 2, 3]]]) };
    expect(landAt(cw, 50, 50)).toBe(true);
    expect(landAt(cw, 0, 50)).toBe(false); // sea inside a hole
    expect(landAt(cw, 0, 20)).toBe(true);
    expect(landAt(cw, 101, 20)).toBe(false);
    expect(landAt(cw, -101, 20)).toBe(false);
    expect(landAt(cw, 0, 101)).toBe(false);
  });
});
