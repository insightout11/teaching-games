/** Local-build helpers only. No application code imports this module. */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { inflateSync } from 'node:zlib';

export const CACHE = process.argv.includes('--cache')
  ? path.resolve(process.argv[process.argv.indexOf('--cache') + 1])
  : path.join(homedir(), 'Documents/Codex/_outputs/terrain-source-cache');
const NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/';
export const MODIS_URL = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=MODIS_Combined_L3_IGBP_Land_Cover_Type_Annual&STYLES=&FORMAT=image/png&TRANSPARENT=TRUE&SRS=EPSG:4326&BBOX=-180,-90,180,90&WIDTH=720&HEIGHT=360&TIME=2024-01-01';
export const SOURCES = {
  regions: { file: 'regions.geojson', url: NE + 'ne_10m_geography_regions_polys.geojson', sha256: 'b7b26e50ea917d3696aec87f932def2bf5f890f5770e441d59c162c6f4c92a77' },
  marine: { file: 'marine.geojson', url: NE + 'ne_10m_geography_marine_polys.geojson', sha256: '53f865e8ffa966cdd402145c82c5cd14ee7ce974cd0eb9a3f59f03a4cfd2d66c' },
  reefs: { file: 'reefs.geojson', url: NE + 'ne_10m_reefs.geojson', sha256: '4dcfb7cb57e7c04108df66ca0ac1bb4125b2b40b6bb45d7d2aa589bd4e46dc57' },
  legend: { file: 'igbp.xml', url: 'https://gibs.earthdata.nasa.gov/colormaps/v1.3/MODIS_IGBP_Land_Cover_Type.xml', sha256: '29a9b5fe6d976a0ea5da12c46d9accfe20a1807b3f602d36d940663d6e854ef7' },
} as const;

export async function source(s: { file: string; url: string; sha256?: string }): Promise<Buffer> {
  await mkdir(CACHE, { recursive: true });
  const file = path.join(CACHE, s.file);
  let data: Buffer;
  try { data = await readFile(file); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    console.log('Downloading ' + s.url);
    const response = await fetch(s.url, { signal: AbortSignal.timeout(180000) });
    if (!response.ok) throw new Error(`${response.status}: ${s.url}`);
    data = Buffer.from(await response.arrayBuffer());
    await writeFile(file, data);
  }
  const sha256 = createHash('sha256').update(data).digest('hex');
  if (s.sha256 && s.sha256 !== sha256) throw new Error('Source hash mismatch: ' + file);
  await writeFile(file + '.provenance.json', JSON.stringify({ url: s.url, sha256, bytes: data.length }, null, 2) + '\n');
  return data;
}

export type XY = [number, number];
export type Polygon = XY[][];
export interface Feature {
  properties: Record<string, string | number | null>;
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: Polygon | Polygon[] };
}
export function polygons(feature: Feature): Polygon[] {
  if (feature.geometry.type === 'Polygon') return [feature.geometry.coordinates as Polygon];
  if (feature.geometry.type === 'MultiPolygon') return feature.geometry.coordinates as Polygon[];
  throw new Error('Expected polygon geometry');
}
export async function features(s: typeof SOURCES[keyof typeof SOURCES]): Promise<Feature[]> {
  const data = JSON.parse((await source(s)).toString('utf8'));
  if (data.type !== 'FeatureCollection' || !data.features.length) throw new Error('Invalid GeoJSON');
  return data.features;
}

/** Minimal PNG reader: 8-bit noninterlaced RGB, RGBA or indexed, all five filters. */
export function readPng(data: Buffer): { width: number; height: number; rgba: Uint8Array } {
  if (data.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('Not PNG (possibly a WMS error)');
  let width = 0, height = 0, channels = 0, colour = 0;
  let palette: Buffer = Buffer.alloc(0), alpha: Buffer = Buffer.alloc(0);
  const chunks: Buffer[] = [];
  for (let offset = 8; offset < data.length;) {
    const length = data.readUInt32BE(offset);
    const type = data.toString('ascii', offset + 4, offset + 8);
    if (offset + 12 + length > data.length) throw new Error('Truncated PNG');
    const chunk = data.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = chunk.readUInt32BE(0); height = chunk.readUInt32BE(4); colour = chunk[9];
      channels = colour === 6 ? 4 : colour === 2 ? 3 : colour === 3 ? 1 : 0;
      if (chunk[8] !== 8 || chunk[10] || chunk[11] || chunk[12] || !channels || width * height > 10000000) throw new Error('Unsupported PNG');
    } else if (type === 'PLTE') palette = chunk;
    else if (type === 'tRNS') alpha = chunk;
    else if (type === 'IDAT') chunks.push(chunk);
    offset += length + 12;
    if (type === 'IEND') break;
  }
  const packed = inflateSync(Buffer.concat(chunks));
  const stride = width * channels;
  if (!width || !height || packed.length !== (stride + 1) * height) throw new Error('Invalid PNG dimensions');
  const raw = new Uint8Array(stride * height);
  const paeth = (a: number, b: number, c: number) => {
    const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const filter = packed[y * (stride + 1)];
    if (filter > 4) throw new Error('Invalid PNG filter');
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x;
      const a = x >= channels ? raw[i - channels] : 0;
      const b = y ? raw[i - stride] : 0;
      const c = y && x >= channels ? raw[i - stride - channels] : 0;
      const predictor = [0, a, b, Math.floor((a + b) / 2), paeth(a, b, c)][filter];
      raw[i] = (packed[y * (stride + 1) + x + 1] + predictor) & 255;
    }
  }
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const j = i * channels, k = i * 4;
    if (colour === 3) {
      const index = raw[j];
      if (index * 3 + 2 >= palette.length) throw new Error('Invalid PNG palette index');
      rgba[k] = palette[index * 3]; rgba[k + 1] = palette[index * 3 + 1]; rgba[k + 2] = palette[index * 3 + 2];
      rgba[k + 3] = index < alpha.length ? alpha[index] : 255;
    } else {
      rgba[k] = raw[j]; rgba[k + 1] = raw[j + 1]; rgba[k + 2] = raw[j + 2];
      rgba[k + 3] = channels === 4 ? raw[j + 3] : 255;
    }
  }
  return { width, height, rgba };
}
