'use client';

import { useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { TurbulenceBeat, useTurbulence } from '@/components/session/turbulence-beat';
import { PLANE_TIERS } from '@/lib/plane-progression';

const ALL_PLANES = PLANE_TIERS.flatMap((t) => t.choices.map((c) => ({ key: c.key, name: c.name })));
const ctrl: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#9fb0c7' };

export function TurbulenceDevClient() {
  const [intensity, setIntensity] = useState(1);
  const [frameShake, setFrameShake] = useState(0.35);
  const [seatbelt, setSeatbelt] = useState(true);
  const [reduce, setReduce] = useState(false);
  const [planeKey, setPlaneKey] = useState(ALL_PLANES[0].key);

  // The whole frame trembles by intensity × frameShake; the plane buffets more
  // (its own jitter, inside TurbulenceBeat).
  const frame = useTurbulence(reduce ? 0 : intensity * frameShake);

  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', color: '#e6edf6', padding: '20px 24px', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Turbulence Beat — dev preview</h1>
      <p style={{ margin: '0 0 16px', color: '#9fb0c7', fontSize: 13 }}>
        Micro-event turbulence beat. The front-3q plane buffets; the whole frame trembles by frameShake.
        Non-starter planes fall back to the LC Wayfarer front view.
      </p>

      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', maxWidth: 1120, borderRadius: 14, overflow: 'hidden', border: '1px solid #1f2c45' }}>
        <motion.div className="absolute inset-0" style={{ x: frame.x, y: frame.y }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #050a18 0%, #0a1830 55%, #122244 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 82%, rgba(80,120,200,0.14), transparent 70%)' }} />
          <TurbulenceBeat planeKey={planeKey} intensity={intensity} showSeatbelt={seatbelt} reduce={reduce} />
        </motion.div>
      </div>

      <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'center', marginTop: 16 }}>
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
          <select
            value={planeKey}
            onChange={(e) => setPlaneKey(e.target.value)}
            style={{ background: '#1c2742', color: '#e6edf6', border: '1px solid #2a3a5c', borderRadius: 6, padding: '4px 8px' }}
          >
            {ALL_PLANES.map((p) => (
              <option key={p.key} value={p.key}>{p.name}</option>
            ))}
          </select>
        </label>
        <label style={{ ...ctrl, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={seatbelt} onChange={(e) => setSeatbelt(e.target.checked)} /> seatbelt sign
        </label>
        <label style={{ ...ctrl, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={reduce} onChange={(e) => setReduce(e.target.checked)} /> reduced-motion
        </label>
      </div>
    </div>
  );
}
