/** Display metres only. Real source elevations remain separate for snow and geography. */
export const TERRAIN_GAIN = 2.2 * (1 + 3000 / 18000);
export const TERRAIN_ROLLOFF = 18000;
export function terrainHeight(metres: number, gain = TERRAIN_GAIN): number {
  const h = Math.max(0, metres);
  if (h <= 3000) return h * gain / (1 + h / TERRAIN_ROLLOFF);
  if (h >= 6000) return h * gain * (31 / 35) / (1 + h / 90000);
  const t = (h - 3000) / 3000, blend = t * t * (3 - 2 * t);
  const low = h * gain / (1 + h / TERRAIN_ROLLOFF);
  const high = h * gain * (31 / 35) / (1 + h / 90000);
  return low + (high - low) * blend;
}
export function terrainGradient(metres: number, gain: number): number {
  const h = Math.max(0, metres);
  if (h <= 3000) return gain / (1 + h / TERRAIN_ROLLOFF) ** 2;
  if (h >= 6000) return gain * (31 / 35) / (1 + h / 90000) ** 2;
  const t = (h - 3000) / 3000, blend = t * t * (3 - 2 * t);
  const low = h * gain / (1 + h / TERRAIN_ROLLOFF), high = h * gain * (31 / 35) / (1 + h / 90000);
  return gain / (1 + h / TERRAIN_ROLLOFF) ** 2 * (1 - blend) +
    gain * (31 / 35) / (1 + h / 90000) ** 2 * blend + (high - low) * 6 * t * (1 - t) / 3000;
}

/** Remove isolated needles, not connected ridges or valley edges. Take-off only; metres stay real. */
export function clampElevationSpikes(source: Float32Array, rows: number, cols: number, rise = 180): Float32Array {
  const result = source.slice();
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    let neighbour = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if ((!dr && !dc) || r + dr < 0 || c + dc < 0 || r + dr >= rows || c + dc >= cols) continue;
      neighbour = Math.max(neighbour, source[(r + dr) * cols + c + dc]);
    }
    result[r * cols + c] = Math.min(source[r * cols + c], neighbour + rise);
  }
  return result;
}

/** Conservative horizon-only median reference, never repeatedly blurred into the visible ridges. */
export function medianElevation(source: Float32Array, rows: number, cols: number): Float32Array {
  const result = source.slice(), window = new Float32Array(9);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    if (source[i] === 0) continue;
    let k = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++)
      window[k++] = source[Math.max(0, Math.min(rows - 1, r + dr)) * cols + Math.max(0, Math.min(cols - 1, c + dc))];
    window.sort(); result[i] = window[4];
  }
  return result;
}

/** Regional permanent snow limits, before display exaggeration. Other regions keep their existing limit. */
export function mountainSnowline(lat: number, lng: number): number | null {
  if (lat >= 26 && lat <= 36 && lng >= 72 && lng <= 100) return 4900;
  if (lat >= 44 && lat <= 49 && lng >= 4 && lng <= 17) return 2350;
  return null;
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

export const CONTOUR_SCALE = 3;
/** Monotone Hermite interpolation preserves samples/extrema: no height blur and no new summit overshoot. */
function contourBetween(a: number, b: number, c: number, d: number, t: number): number {
  const left = b - a, middle = c - b, right = d - c;
  const m0 = left * middle > 0 ? 2 * left * middle / (left + middle) : 0;
  const m1 = middle * right > 0 ? 2 * middle * right / (middle + right) : 0;
  const t2 = t * t, t3 = t2 * t;
  return Math.max(Math.min(b, c), Math.min(Math.max(b, c),
    (2 * t3 - 3 * t2 + 1) * b + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * c + (t3 - t2) * m1));
}

/** Cache the contour interpolant at take-off; rendering still needs only four height reads per ray. */
export function contourElevation(source: Float32Array, rows: number, cols: number): Float32Array {
  const scale = CONTOUR_SCALE, wide = (cols - 1) * scale + 1, tall = (rows - 1) * scale + 1;
  const horizontal = new Float32Array(rows * wide), result = new Float32Array(tall * wide);
  for (let r = 0; r < rows; r++) for (let x = 0; x < wide; x++) {
    const c = Math.min(cols - 2, Math.floor(x / scale)), t = x / scale - c, i = r * cols;
    horizontal[r * wide + x] = contourBetween(source[i + Math.max(0, c - 1)], source[i + c], source[i + c + 1], source[i + Math.min(cols - 1, c + 2)], t);
  }
  for (let y = 0; y < tall; y++) {
    const r = Math.min(rows - 2, Math.floor(y / scale)), t = y / scale - r;
    for (let c = 0; c < wide; c++) result[y * wide + c] = contourBetween(
      horizontal[Math.max(0, r - 1) * wide + c], horizontal[r * wide + c], horizontal[(r + 1) * wide + c], horizontal[Math.min(rows - 1, r + 2) * wide + c], t);
  }
  return result;
}
