import { interiorSample, CONTOUR_SCALE } from './terrain-filter';
import type { SurfaceGrid, SurfaceView } from './terrain-surface';
const smooth01 = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
export interface SurfaceShadeContext {
  g: SurfaceGrid; view: SurfaceView; albedo: Float32Array; displayGradient: Float32Array;
  sunUp: number; sunSide: number; sunAhead: number; lightLength: number; snowWarm: number; exaggeration: number; contourCols: number;
}
export interface ShadingPlane {
  low: Float32Array; high: Float32Array; blend: number; fy: number; z: number; fog: number; mountainFog: number;
  ahead: number; contourRow: number; contourFy: number;
}
/** Pure sample shader, separated from marching so the hot occlusion loop stays small. */
export function shadeSurfaceSample(context: SurfaceShadeContext, plane: ShadingPlane, c: number, i: number, fx: number,
  contourCol: number, heightM: number, h0: number, hi: number, hf: number, out: Float64Array): void {
  const { g, view, albedo, displayGradient, sunUp, sunSide, sunAhead, lightLength, snowWarm, exaggeration, contourCols } = context;
  const { low, high, blend: blendLevel, fy, z, fog, mountainFog, ahead, contourRow, contourFy } = plane;
  const cc = c * CONTOUR_SCALE, side = g.side0 + c * g.step, focal = view.focal;

  const snowPossible = !g.snowPossible || g.snowPossible[i] !== 0;
  const snowSlope = g.snowSlope ? interiorSample(g.snowSlope, i, g.cols, fx, fy) : 0.6;
  // Central differences commute with bilinear interpolation. Reuse their take-off
  // fields for Alpine samples; this is the same per-fragment normal, not vertex lighting.
  let dx: number, dz: number, curvature: number, faceSlope = 0;
  if ((snowSlope > 0.7 || !snowPossible) && low === high && g.slopeX && g.slopeZ && g.curvature) {
    dx = interiorSample(g.slopeX, i, g.cols, fx, fy); dz = interiorSample(g.slopeZ, i, g.cols, fx, fy);
    curvature = interiorSample(g.curvature, i, g.cols, fx, fy);
  } else {
    const xp = interiorSample(low, i + 1, g.cols, fx, fy), xm = interiorSample(low, i - 1, g.cols, fx, fy);
    const zp = interiorSample(low, i + g.cols, g.cols, fx, fy), zm = interiorSample(low, i - g.cols, g.cols, fx, fy);
    const dx0 = xp - xm, dz0 = zp - zm;
    const dx1 = low === high ? dx0 : interiorSample(high, i + 1, g.cols, fx, fy) - interiorSample(high, i - 1, g.cols, fx, fy);
    const dz1 = low === high ? dz0 : interiorSample(high, i + g.cols, g.cols, fx, fy) - interiorSample(high, i - g.cols, g.cols, fx, fy);
    dx = (dx0 + (dx1 - dx0) * blendLevel) / (g.step * 2000);
    dz = (dz0 + (dz1 - dz0) * blendLevel) / (g.step * 2000);
    curvature = 4 * h0 - xp - xm - zp - zm;
    faceSlope = Math.max(Math.abs(xp - h0), Math.abs(xm - h0), Math.abs(zp - h0), Math.abs(zm - h0)) / (g.step * 1000);
  }
  const normalScale = (displayGradient[hi] + (displayGradient[hi + 1] - displayGradient[hi]) * hf) * exaggeration * 2;
  const slopeSquared = dx * dx + dz * dz;
  const illumination = (-dx * normalScale * sunSide - dz * normalScale * sunAhead + sunUp) / (Math.sqrt(slopeSquared * normalScale * normalScale + 1) * lightLength);
  const cloud = view.cloudCover > 0 ? 1 - view.cloudCover / 100 * 0.15 * (0.5 + 0.5 * Math.sin(ahead * 0.15 + side * 0.2)) : 1;
  const mountain = smooth01((heightM - 1800) / 1600);
  const ridge = smooth01(curvature / 550) * Math.max(0, illumination) * 0.16;
  const carved = 0.13 + Math.max(0, illumination) * 0.98 + ridge;
  const light = (view.dark ? 0.32 : (0.30 + Math.max(0, illumination) * 0.85) * (1 - mountain) + carved * mountain) * cloud;
  const a = i * 3, b = a + 3, c0 = (i + g.cols) * 3, d = c0 + 3;
  const red = (albedo[a] * (1 - fx) + albedo[b] * fx) * (1 - fy) + (albedo[c0] * (1 - fx) + albedo[d] * fx) * fy;
  const green = (albedo[a + 1] * (1 - fx) + albedo[b + 1] * fx) * (1 - fy) + (albedo[c0 + 1] * (1 - fx) + albedo[d + 1] * fx) * fy;
  const blue = (albedo[a + 2] * (1 - fx) + albedo[b + 2] * fx) * (1 - fy) + (albedo[c0 + 2] * (1 - fx) + albedo[d + 2] * fx) * fy;
  const air = fog + (mountainFog - fog) * mountain;
  const groundRed = red * light * (1 - air) + view.haze[0] * air;
  const groundGreen = green * light * (1 - air) + view.haze[1] * air;
  const groundBlue = blue * light * (1 - air) + view.haze[2] * air;
  out[4] = (red + 2 * green + blue) * 0.25;
  if (!snowPossible) {
    out[0] = groundRed; out[1] = groundGreen; out[2] = groundBlue; out[3] = 0; return;
  }
  const snowline = (g.snowline[i] * (1 - fx) + g.snowline[i + 1] * fx) * (1 - fy) + (g.snowline[i + g.cols] * (1 - fx) + g.snowline[i + g.cols + 1] * fx) * fy;
  // The snow test uses unexaggerated metres. Back-facing slopes retain exposed rock rather than a white blanket.
  let trueHeight: number, grade: number;
  if (snowSlope > 0.7 && g.snowContour) {
    const index = contourRow * contourCols + contourCol, u = cc - contourCol, v = contourFy;
    const a = g.snowContour[index], b = g.snowContour[index + 1];
    const c = g.snowContour[index + contourCols], d = g.snowContour[index + contourCols + 1];
    trueHeight = (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
    const metres = g.step * 1000 / CONTOUR_SCALE;
    const sx = ((b - a) * (1 - v) + (d - c) * v) / metres;
    const sz = ((c - a) * (1 - u) + (d - b) * u) / metres;
    grade = Math.sqrt(sx * sx + sz * sz);
  } else {
    trueHeight = interiorSample(g.trueHeight ?? g.height, i, g.cols, fx, fy);
    // The non-Alpine mask retains Terrain 21's adjacent-face test at sharp crests.
    grade = Math.max(Math.sqrt(slopeSquared), faceSlope);
  }
  const snowBand = snowSlope > 0.7 ? Math.min(220, Math.max(35, z / (focal * view.sideScale) * 1000 * (grade + 0.1) * 0.5)) : 35;
  const snow = surfaceSnow(trueHeight, snowline, grade, illumination, snowSlope, snowBand);
  const exposure = smooth01((illumination + 0.1) / 0.7);
  const snowRed = view.dark ? 82 : 136 + (253 - 136) * exposure;
  const snowGreen = view.dark ? 105 : 160 + (254 - 18 * snowWarm - 160) * exposure;
  const snowBlue = view.dark ? 145 : 195 + (255 - 43 * snowWarm - 195) * exposure;
  const snowAir = air * (1 - 0.9 * exposure);
  const snowDr = snowRed * (1 - snowAir) + view.haze[0] * snowAir - groundRed;
  const snowDg = snowGreen * (1 - snowAir) + view.haze[1] * snowAir - groundGreen;
  const snowDb = snowBlue * (1 - snowAir) + view.haze[2] * snowAir - groundBlue;
  const rr = groundRed + snowDr * snow, gg = groundGreen + snowDg * snow, bb = groundBlue + snowDb * snow;
  out[0] = rr; out[1] = gg; out[2] = bb; out[3] = snow;

}

export function surfaceSnow(height: number, line: number, slope: number, _illumination: number, slopeLimit = 0.6, pixelBand = 35): number {
  // Exposure changes snow colour, not its presence: shaded snow must not turn into dirty bare rock.
  // Regional grades are 0.8 vs Float32(0.6); compare between them, not at a rounded endpoint.
  const alpine = slopeLimit > 0.7;
  if (alpine) {
    // Intersect real altitude with a snow-holding grade. Filter only the boundary's pixel footprint,
    // rather than washing a broad range of slopes into partially white, cotton-like caps.
    const margin = Math.min(height - line - 60, (0.48 - slope) * 1400);
    return smooth01(0.5 + margin / (2 * Math.max(35, pixelBand)));
  }
  // Preserve Terrain 21's non-Alpine response, including its route-mask transition, exactly.
  const legacyRoute = slopeLimit > 0.6, start = legacyRoute ? 0.22 : 0.16;
  return smooth01((height - line) / (legacyRoute ? 190 : 500)) * (1 - smooth01((slope - start) / (slopeLimit - start)));
}

