/**
 * Measure how far each plane's wheels sit above the bottom of its artwork.
 *
 * PlaneLayer aligns the IMAGE BOX bottom to LAYOUT.runwayY, but the exported art
 * has transparent padding under the landing gear, so the wheels float by exactly
 * that padding. `runwayYOffset` exists to compensate — it was only ever calibrated
 * for 3 of 14 planes, which is why the rest hover.
 *
 * Geometry: the box is PW x PH with preserveAspectRatio="xMidYMax meet", so the
 * art is scaled by s = min(PW/W, PH/H) and bottom-aligned. Padding of `padBottom`
 * source pixels therefore renders as padBottom * s user units of gap, and the
 * correction is the negative of that.
 *
 * Run: node scripts/measure-plane-ground-offsets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const PW = 480;
const PH = 240;
const DIR = path.join(process.cwd(), 'public', 'assets', 'flight', 'planes');

function decodePngAlpha(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a png');
  let pos = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const body = pos + 8;
    if (type === 'IHDR') {
      width = buf.readUInt32BE(body);
      height = buf.readUInt32BE(body + 4);
      bitDepth = buf[body + 8];
      colorType = buf[body + 9];
    } else if (type === 'IDAT') {
      idat.push(buf.subarray(body, body + len));
    } else if (type === 'IEND') break;
    pos = body + len + 4;
  }
  if (bitDepth !== 8) throw new Error('bitDepth ' + bitDepth + ' unsupported');
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : 1;
  if (channels !== 4 && channels !== 2) return { width, height, alpha: null };

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = channels;
  const stride = width * bpp;
  const out = Buffer.alloc(height * stride);
  let rp = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rp++];
    const row = raw.subarray(rp, rp + stride);
    rp += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prior = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0;
      const b = prior ? prior[i] : 0;
      const c = prior && i >= bpp ? prior[i - bpp] : 0;
      let v = row[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[i] = v & 0xff;
    }
  }
  return { width, height, alpha: { data: out, stride, bpp } };
}

/** Rows of fully-transparent pixels below the lowest visible pixel. */
function bottomPadding(png, threshold = 8) {
  const { width, height, alpha } = png;
  if (!alpha) return 0;
  const { data, stride, bpp } = alpha;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      if (data[y * stride + x * bpp + (bpp - 1)] > threshold) return height - 1 - y;
    }
  }
  return 0;
}

const PLANES = [
  ['starter-biplane', 'lc-cadet'],
  ['scout-monoplane', 'lc-wayfarer'],
  ['lc-scout', 'lc-scout-monoplane'],
  ['cloud-hopper', 'lc-cloud-hopper'],
  ['trailblazer-biplane', 'lc-trailblazer'],
  ['sky-racer', 'lc-sky-racer'],
  ['cargo-cruiser', 'lc-cargo-cruiser'],
  ['twin-prop-scout', 'lc-twin-prop-scout'],
  ['solar-flyer', 'lc-solar-flyer'],
  ['aurora-glider', 'lc-aurora-glider'],
  ['storm-runner', 'lc-storm-runner'],
  ['future-flyer', 'lc-future-flyer'],
  ['starliner-mini', 'lc-starliner-mini'],
  ['comet-jet', 'lc-comet-jet'],
];

console.log('  SIDE/GROUND art -> groundContactOffset (PlaneLayer, takeoff + landing)');
console.log('  key                   art WxH      pad  scale   groundContactOffset');
for (const [key, asset] of PLANES) {
  const ground = path.join(DIR, `${asset}-ground.png`);
  const side = path.join(DIR, `${asset}.png`);
  const file = fs.existsSync(ground) ? ground : side;
  if (!fs.existsSync(file)) { console.log(`  ${key.padEnd(22)} MISSING`); continue; }
  try {
    const png = decodePngAlpha(file);
    const pad = bottomPadding(png);
    const s = Math.min(PW / png.width, PH / png.height);
    const offset = -Math.round(pad * s);
    console.log(
      `  ${key.padEnd(22)}${String(png.width + 'x' + png.height).padEnd(12)}` +
      `${String(pad).padStart(4)}  ${s.toFixed(3)}  ${String(offset).padStart(6)}` +
      `   ${path.basename(file)}`
    );
  } catch (e) {
    console.log(`  ${key.padEnd(22)} ERROR ${e.message}`);
  }
}

// ── Hangar view ─────────────────────────────────────────────────────────────
// AirfieldForeground draws the FRONT-THREE-QUARTER art in a 320x180 box, also
// bottom-aligned, so it needs its own number: padding differs per view angle and
// the side-view value is meaningless here.
const HW = 320, HH = 180;
console.log('\n  FRONT-3Q art -> hangarYOffset (AirfieldForeground, lobby hangar)');
console.log('  key                   art WxH      pad  scale   hangarYOffset');
for (const [key, asset] of PLANES) {
  const file = path.join(DIR, `${asset}-front-3q.png`);
  if (!fs.existsSync(file)) { console.log(`  ${key.padEnd(22)} MISSING`); continue; }
  const png = decodePngAlpha(file);
  const pad = bottomPadding(png);
  const s = Math.min(HW / png.width, HH / png.height);
  console.log(
    `  ${key.padEnd(22)}${String(png.width + 'x' + png.height).padEnd(12)}` +
    `${String(pad).padStart(4)}  ${s.toFixed(3)}  ${String(Math.round(pad * s)).padStart(6)}`
  );
}
