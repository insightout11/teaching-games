'use client';

import { useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { TurbulenceBeat, useTurbulence } from '@/components/session/turbulence-beat';
import { InstrumentCheck, RadarScope } from '@/components/session/microevent-beats';
import { CockpitScene } from '@/components/session/cockpit-scene';
import { PLANE_TIERS } from '@/lib/plane-progression';

const ALL_PLANES = PLANE_TIERS.flatMap((t) => t.choices.map((c) => ({ key: c.key, name: c.name })));
const ctrl: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#9fb0c7' };
type Beat = 'turbulence' | 'instrument' | 'radar' | 'instrument-cockpit' | 'radar-cockpit';
const BEATS: { key: Beat; label: string }[] = [
  { key: 'turbulence', label: 'Turbulence (opinion)' },
  { key: 'instrument-cockpit', label: 'Instrument · cockpit' },
  { key: 'radar-cockpit', label: 'Radar · cockpit' },
  { key: 'instrument', label: 'Instrument · plain' },
  { key: 'radar', label: 'Radar · plain' },
];

export function TurbulenceDevClient() {
  const [beat, setBeat] = useState<Beat>('turbulence');
  const [runKey, setRunKey] = useState(0);
  const [intensity, setIntensity] = useState(1);
  const [frameShake, setFrameShake] = useState(0.35);
  const [seatbelt, setSeatbelt] = useState(true);
  const [reduce, setReduce] = useState(false);
  const [planeKey, setPlaneKey] = useState(ALL_PLANES[0].key);

  // Frame trembles only on the turbulence beat; the accuracy beats are steady.
  const frame = useTurbulence(beat === 'turbulence' && !reduce ? intensity * frameShake : 0);

  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', color: '#e6edf6', padding: '20px 24px', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Micro-event beats — dev preview</h1>
      <p style={{ margin: '0 0 16px', color: '#9fb0c7', fontSize: 13 }}>
        Opinion pulse → Turbulence (chaotic). Accuracy check → Instrument Check / Radar Scope (calm, precise).
        Hit Replay to re-run the one-shot beats. Non-starter planes fall back to the LC Wayfarer front.
      </p>

      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', maxWidth: 1120, borderRadius: 14, overflow: 'hidden', border: '1px solid #1f2c45' }}>
        <motion.div className="absolute inset-0" style={{ x: frame.x, y: frame.y }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #050a18 0%, #0a1830 55%, #122244 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 82%, rgba(80,120,200,0.14), transparent 70%)' }} />
          {beat === 'turbulence' && <TurbulenceBeat key={runKey} planeKey={planeKey} intensity={intensity} showSeatbelt={seatbelt} reduce={reduce} />}
          {beat === 'instrument' && <InstrumentCheck key={runKey} />}
          {beat === 'radar' && <RadarScope key={runKey} />}
          {beat === 'instrument-cockpit' && <CockpitScene key={runKey} variant="instrument" />}
          {beat === 'radar-cockpit' && <CockpitScene key={runKey} variant="radar" />}
        </motion.div>
      </div>

      <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'center', marginTop: 16 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {BEATS.map((b) => (
            <button
              key={b.key}
              onClick={() => { setBeat(b.key); setRunKey((k) => k + 1); }}
              style={{ fontSize: 12, padding: '6px 12px', borderRadius: 7, cursor: 'pointer', background: beat === b.key ? '#3b82f6' : '#1c2742', color: '#e6edf6', border: '1px solid #2a3a5c' }}
            >
              {b.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setRunKey((k) => k + 1)}
          style={{ fontSize: 12, padding: '6px 14px', borderRadius: 7, cursor: 'pointer', background: '#0f766e', color: '#ecfeff', border: '1px solid #2dd4bf' }}
        >
          ⟳ Replay
        </button>
        <label style={{ ...ctrl, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={reduce} onChange={(e) => setReduce(e.target.checked)} /> reduced-motion
        </label>
      </div>

      {beat === 'turbulence' && (
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
          <label style={ctrl}>
            intensity {intensity.toFixed(2)}
            <input type="range" min={0} max={2} step={0.05} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} />
          </label>
          <label style={ctrl}>
            frameShake {frameShake.toFixed(2)}
            <input type="range" min={0} max={1} step={0.05} value={frameShake} onChange={(e) => setFrameShake(Number(e.target.value))} />
          </label>
          <label style={ctrl}>
            plane
            <select value={planeKey} onChange={(e) => setPlaneKey(e.target.value)} style={{ background: '#1c2742', color: '#e6edf6', border: '1px solid #2a3a5c', borderRadius: 6, padding: '4px 8px' }}>
              {ALL_PLANES.map((p) => (
                <option key={p.key} value={p.key}>{p.name}</option>
              ))}
            </select>
          </label>
          <label style={{ ...ctrl, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={seatbelt} onChange={(e) => setSeatbelt(e.target.checked)} /> seatbelt sign
          </label>
        </div>
      )}
    </div>
  );
}
