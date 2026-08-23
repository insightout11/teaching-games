/**
 * Sound asset cohesion pass — see docs/sound-design.md §5.
 *
 * Reads the raw ElevenLabs downloads (which live OUTSIDE the repo — they are large
 * and disposable), then trims, mono-folds, resamples, level-matches and fades them
 * into one coherent family under public/sounds/.
 *
 * takeoff-electric is not a download: near-silence plus a rising whine is trivial
 * to synthesise and very hard to generate, so it is built here from oscillators.
 *
 * Run: node scripts/process-sound-assets.mjs [rawDir]
 */
import fs from 'node:fs';
import path from 'node:path';

const RAW_DIR = process.argv[2] || 'C:/Users/insig/Downloads';
const OUT_DIR = path.join(process.cwd(), 'public', 'sounds');
const SR = 44100;

// ─── WAV I/O ────────────────────────────────────────────────────────────────
function readWav(file) {
  const buf = fs.readFileSync(file);
  let pos = 12, fmt = null, dataOff = null, dataLen = 0;
  while (pos + 8 <= buf.length) {
    const id = buf.toString('ascii', pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    const body = pos + 8;
    if (id === 'fmt ') {
      fmt = {
        channels: buf.readUInt16LE(body + 2),
        sampleRate: buf.readUInt32LE(body + 4),
        bitsPerSample: buf.readUInt16LE(body + 14),
      };
    } else if (id === 'data') { dataOff = body; dataLen = Math.min(size, buf.length - body); }
    pos = body + size + (size % 2);
  }
  if (!fmt || dataOff === null) throw new Error('bad wav: ' + file);
  const bytes = fmt.bitsPerSample / 8;
  const frames = Math.floor(dataLen / (bytes * fmt.channels));
  const mono = new Float64Array(frames);
  for (let i = 0; i < frames; i++) {
    let acc = 0;
    for (let c = 0; c < fmt.channels; c++) {
      const o = dataOff + (i * fmt.channels + c) * bytes;
      acc += bytes === 2 ? buf.readInt16LE(o) / 32768 : buf.readInt32LE(o) / 2147483648;
    }
    mono[i] = acc / fmt.channels;
  }
  return { data: mono, sampleRate: fmt.sampleRate };
}

function writeWav(file, data, sampleRate) {
  const n = data.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, data[i]));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  fs.writeFileSync(file, buf);
}

// ─── DSP helpers ────────────────────────────────────────────────────────────
function resample(d, from, to) {
  if (from === to) return d;
  const ratio = from / to;
  const out = new Float64Array(Math.floor(d.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const x = i * ratio, i0 = Math.floor(x), f = x - i0;
    out[i] = (d[i0] || 0) * (1 - f) + (d[i0 + 1] || 0) * f;
  }
  return out;
}

function slice(d, sr, t0, t1) {
  return d.slice(Math.max(0, Math.floor(t0 * sr)), Math.min(d.length, Math.floor(t1 * sr)));
}

function fade(d, sr, inSec, outSec) {
  const fi = Math.floor(inSec * sr), fo = Math.floor(outSec * sr);
  for (let i = 0; i < fi && i < d.length; i++) d[i] *= i / fi;
  for (let i = 0; i < fo && i < d.length; i++) {
    const idx = d.length - 1 - i;
    if (idx >= 0) d[idx] *= i / fo;
  }
  return d;
}

/** Linear gain ramp between two dB values — used to build an arc into takes that
 *  were generated flat. */
function ramp(d, sr, t0, t1, db0, db1) {
  const a = Math.floor(t0 * sr), b = Math.floor(t1 * sr);
  const g0 = Math.pow(10, db0 / 20), g1 = Math.pow(10, db1 / 20);
  for (let i = 0; i < d.length; i++) {
    let g;
    if (i <= a) g = g0;
    else if (i >= b) g = g1;
    else g = g0 + (g1 - g0) * ((i - a) / (b - a));
    d[i] *= g;
  }
  return d;
}

function rmsOf(d) {
  let s = 0;
  for (let i = 0; i < d.length; i++) s += d[i] * d[i];
  return Math.sqrt(s / d.length);
}

function peakOf(d) {
  let p = 0;
  for (let i = 0; i < d.length; i++) p = Math.max(p, Math.abs(d[i]));
  return p;
}

/** Normalise to an RMS target, then pull back if the peak would exceed the ceiling. */
function normalise(d, targetDb, ceilDb) {
  const ceil = Math.pow(10, (ceilDb === undefined ? -3 : ceilDb) / 20);
  const cur = rmsOf(d);
  if (cur <= 0) return d;
  let g = Math.pow(10, targetDb / 20) / cur;
  if (peakOf(d) * g > ceil) g = ceil / peakOf(d);
  for (let i = 0; i < d.length; i++) d[i] *= g;
  return d;
}

function onePoleLP(d, sr, fc) {
  const out = new Float64Array(d.length);
  let y = 0;
  for (let i = 0; i < d.length; i++) {
    const c = typeof fc === 'number' ? fc : fc[i];
    const a = 1 - Math.exp((-2 * Math.PI * c) / sr);
    y += a * (d[i] - y);
    out[i] = y;
  }
  return out;
}

// ─── takeoff-electric: synthesised, not generated ───────────────────────────
function synthElectric(dur) {
  const n = Math.floor((dur || 4.6) * SR);
  const out = new Float64Array(n);
  const noise = new Float64Array(n);
  let seed = 12345;
  for (let i = 0; i < n; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    noise[i] = (seed / 0x3fffffff) - 1;
  }
  // Airflow: noise through a cutoff that opens as speed builds, then closes with distance.
  const cutoff = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const rise = Math.min(1, t / 2.6);
    const away = t > 3.1 ? Math.max(0, 1 - (t - 3.1) / 1.5) : 1;
    cutoff[i] = 300 + 3800 * rise * away;
  }
  const air = onePoleLP(noise, SR, cutoff);

  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const rise = Math.min(1, t / 2.8);
    const away = t > 3.1 ? Math.max(0, 1 - (t - 3.1) / 1.5) : 1;
    // Motor whine: fundamental sweeps 380 -> 1150 Hz, with two quiet harmonics.
    const f = 380 + 770 * rise;
    phase += (2 * Math.PI * f) / SR;
    const whine = Math.sin(phase) * 0.55 + Math.sin(phase * 2) * 0.16 + Math.sin(phase * 3) * 0.06;
    const env = Math.min(1, t / 1.2) * away;
    out[i] = (whine * 0.30 * rise + air[i] * 0.9) * env;
  }
  fade(out, SR, 0.25, 0.9);
  return out;
}

// ─── brand-resolve: generated chime layered onto a synthesised cloud rush ───
// The generated clip only carries 0.83s of run-up before its chime. Aligning that
// chime to the spark burst at 2.643s therefore left the whole cloud-rush opening
// in silence, and the riser it does have is dark — no air at all — against a
// bright white-out frame. So we score the opening ourselves and drop the generated
// chime on top, which also lets the whoosh be as bright as the visual.
function synthCloudRush(dur, peakAt) {
  const n = Math.floor(dur * SR);
  const noise = new Float64Array(n);
  let seed = 987654321;
  for (let i = 0; i < n; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    noise[i] = seed / 0x3fffffff - 1;
  }
  // Cutoff climbs as the cloud thins and you break through into clear sky.
  const cutoff = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const k = Math.min(1, t / peakAt);
    cutoff[i] = 900 + 8600 * Math.pow(k, 1.35);
  }
  const body = onePoleLP(noise, SR, cutoff);
  // Subtract a low-passed copy to keep it airy rather than rumbling.
  const rumble = onePoleLP(body, SR, 180);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    // Swell toward the breakthrough, then duck away so the chime rings clear.
    const swell = Math.pow(Math.min(1, t / peakAt), 1.9);
    const duck = t > peakAt ? Math.max(0, 1 - (t - peakAt) / 0.55) : 1;
    out[i] = (body[i] - rumble[i] * 0.85) * swell * duck;
  }
  return fade(out, SR, 0.12, 0.25);
}

function buildBrandResolve(rawDir, clip) {
  const read = readWav(path.join(rawDir, clip.src));
  const orig = resample(
    slice(read.data, read.sampleRate, clip.trim[0], clip.trim[1]),
    read.sampleRate,
    SR,
  );
  const offsetSec = clip.chimeTargetSec - clip.chimeInSourceSec;
  const offset = Math.floor(offsetSec * SR);
  const out = new Float64Array(offset + orig.length);

  const whoosh = synthCloudRush(clip.chimeTargetSec + 0.5, clip.chimeTargetSec - 0.75);
  for (let i = 0; i < whoosh.length && i < out.length; i++) out[i] += whoosh[i] * 0.75;
  for (let i = 0; i < orig.length; i++) out[offset + i] += orig[i];
  return out;
}

// ─── Clip recipes ───────────────────────────────────────────────────────────
// rmsDb targets are deliberately NOT uniform: ceremony clips sit forward, dense
// engines sit back so they do not dominate a classroom, and electric stays ~10 dB
// under the other takeoffs because that contrast IS the aircraft's character.
const CLIPS = [
  {
    out: 'brand-resolve.wav',
    src: 'ElevenLabs_Lesson_Captain_Brand_Resolve.wav',
    composite: true,
    trim: [0.06, 1.848],
    chimeInSourceSec: 0.83,
    // Spark burst in BrandSting 'full' — see docs/sound-design.md §6.3.
    chimeTargetSec: 2.643,
    rmsDb: -20, fadeIn: 0.01, fadeOut: 0.30,
    note: 'cloud rush from 0s, chime at 2.643s — plays from mount, no offset',
  },
  {
    out: 'touchdown.wav',
    src: 'AEROMisc-Close-up_sound_effec-Elevenlabs.wav',
    trim: [0.0, 0.85], rmsDb: -18, fadeIn: 0.002, fadeOut: 0.25,
  },
  {
    out: 'arrival-resolve.wav',
    src: 'Warm_cinematic_arriv_#1-1786191094026.wav',
    trim: [0.08, 2.80], rmsDb: -20, fadeIn: 0.01, fadeOut: 0.30,
    note: 'chord peak at 1.36s, matching stat-tile settle 1.35s',
  },
  {
    out: 'takeoff-piston.wav',
    src: 'A_vintage_radial_pis_#2-1786192541120.wav',
    trim: [0.0, 4.90], rmsDb: -22, fadeIn: 0.02, fadeOut: 0.35,
  },
  {
    out: 'takeoff-twin-prop.wav',
    src: 'Two_heavy_turboprop__#3-1786192796222.wav',
    trim: [0.0, 4.85], rmsDb: -22, fadeIn: 0.02, fadeOut: 0.35,
    // Generated flat (only ~2 dB of build); impose the arc it should have had.
    ramp: [0.0, 2.0, -8, 0],
  },
  {
    out: 'takeoff-jet.wav',
    src: 'A_modern_jet_airline_#2-1786193232937.wav',
    trim: [0.0, 4.60], rmsDb: -22, fadeIn: 0.02, fadeOut: 0.35,
  },
  { out: 'takeoff-electric.wav', synth: true, rmsDb: -32 },
];

// ─── Run ────────────────────────────────────────────────────────────────────
fs.mkdirSync(OUT_DIR, { recursive: true });
const manifest = [];
for (const clip of CLIPS) {
  let data;
  if (clip.synth) {
    data = synthElectric();
  } else if (clip.composite) {
    data = buildBrandResolve(RAW_DIR, clip);
  } else {
    const file = path.join(RAW_DIR, clip.src);
    if (!fs.existsSync(file)) { console.error('  MISSING  ' + clip.src); continue; }
    const read = readWav(file);
    data = resample(slice(read.data, read.sampleRate, clip.trim[0], clip.trim[1]), read.sampleRate, SR);
  }
  if (clip.ramp) ramp(data, SR, clip.ramp[0], clip.ramp[1], clip.ramp[2], clip.ramp[3]);
  normalise(data, clip.rmsDb);
  fade(data, SR, clip.fadeIn === undefined ? 0.01 : clip.fadeIn, clip.fadeOut === undefined ? 0.2 : clip.fadeOut);
  const outPath = path.join(OUT_DIR, clip.out);
  writeWav(outPath, data, SR);
  const info = {
    file: clip.out,
    seconds: Number((data.length / SR).toFixed(3)),
    kb: Number((fs.statSync(outPath).size / 1024).toFixed(0)),
    rmsDb: Number((20 * Math.log10(rmsOf(data))).toFixed(1)),
    peakDb: Number((20 * Math.log10(peakOf(data))).toFixed(1)),
  };
  manifest.push(info);
  console.log(
    '  ' + clip.out.padEnd(24) + String(info.seconds).padStart(6) + 's  ' +
    String(info.kb).padStart(4) + 'KB  rms ' + String(info.rmsDb).padStart(6) +
    '  peak ' + String(info.peakDb).padStart(6) + (clip.note ? '   (' + clip.note + ')' : '')
  );
}
console.log('\n  ' + manifest.length + ' clips, ' + manifest.reduce((a, m) => a + m.kb, 0) + ' KB total');
