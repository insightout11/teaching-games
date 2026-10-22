/** Display metres only. Real source elevations remain separate for snow and geography. */
export const TERRAIN_GAIN = 2.2 * (1 + 3000 / 18000);
export const TERRAIN_ROLLOFF = 18000;
export function terrainHeight(metres: number, gain = TERRAIN_GAIN): number {
  return Math.max(0, metres) * gain / (1 + Math.max(0, metres) / TERRAIN_ROLLOFF);
}
export function terrainGradient(metres: number, gain: number): number {
  return gain / (1 + Math.max(0, metres) / TERRAIN_ROLLOFF) ** 2;
}

/** Small-sigma 3x3 Gaussian [1,6,1]^2 / 64, prepared once. Zero sea cells stay zero. */
export function blurElevation(source: Float32Array, rows: number, cols: number): Float32Array {
  const horizontal = new Float32Array(source.length), result = new Float32Array(source.length);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    horizontal[i] = (source[r * cols + Math.max(0, c - 1)] + 6 * source[i] + source[r * cols + Math.min(cols - 1, c + 1)]) / 8;
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    if (source[i] > 0) result[i] = (horizontal[Math.max(0, r - 1) * cols + c] + 6 * horizontal[i] + horizontal[Math.min(rows - 1, r + 1) * cols + c]) / 8;
  }
  return result;
}

/** Bilinear field: there are no mesh triangles or diagonal-dependent normal discontinuities. */
export function elevationSample(values: Float32Array, rows: number, cols: number, row: number, col: number): number {
  const r = Math.max(0, Math.min(rows - 1.000001, row)), c = Math.max(0, Math.min(cols - 1.000001, col));
  const r0 = Math.floor(r), c0 = Math.floor(c), fy = r - r0, fx = c - c0, i = r0 * cols + c0;
  return (values[i] * (1 - fx) + values[i + 1] * fx) * (1 - fy) +
    (values[i + cols] * (1 - fx) + values[i + cols + 1] * fx) * fy;
}

/** Continuous geographic noise, with broad 15-60km snowline variations; never frame-dependent. */
export function snowlineVariation(ahead: number, side: number): number {
  return 160 * Math.sin(ahead * 0.11 + Math.sin(side * 0.07)) + 90 * Math.sin(side * 0.19 - ahead * 0.05);
}

/** Fast interior lookup for rays whose bounds and fractional coordinates have already been checked. */
export function interiorSample(values: Float32Array, i: number, cols: number, fx: number, fy: number): number {
  const a = values[i] + (values[i + 1] - values[i]) * fx;
  const b = values[i + cols] + (values[i + cols + 1] - values[i + cols]) * fx;
  return a + (b - a) * fy;
}
