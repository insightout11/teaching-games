'use client';

import { useState, type CSSProperties } from 'react';
import { BrandSting, type BrandStingVariant } from './brand-sting';

const ctrl: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#9fb0c7' };
const VARIANTS: { key: BrandStingVariant; label: string }[] = [
  { key: 'full', label: 'Full (splash)' },
  { key: 'short', label: 'Short (bookend)' },
];

export function BrandStingDevClient() {
  const [runKey, setRunKey] = useState(0);
  const [variant, setVariant] = useState<BrandStingVariant>('full');
  const [showWordmark, setShowWordmark] = useState(true);
  const [tagline, setTagline] = useState('Your flight deck for live lessons');
  const [useTagline, setUseTagline] = useState(false);
  const [markSize, setMarkSize] = useState(210);
  const [holdMs, setHoldMs] = useState(320);
  const [loop, setLoop] = useState(true);

  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', color: '#e6edf6', padding: '20px 24px', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Signature reveal — dev preview</h1>
      <p style={{ margin: '0 0 16px', color: '#9fb0c7', fontSize: 13 }}>
        Cloud banks part to break a pocket of sky, the takeoff mark resolves in the clearing, then the wordmark settles.
        For session bookends + first-load splash only (low frequency). Hit Replay to re-run the one-shot.
      </p>

      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', maxWidth: 1120, borderRadius: 14, overflow: 'hidden', border: '1px solid #1f2c45' }}>
        <BrandSting
          key={runKey}
          variant={variant}
          showWordmark={showWordmark}
          tagline={useTagline ? tagline : undefined}
          markSize={markSize}
          holdMs={holdMs}
          onComplete={() => { if (loop) setRunKey((k) => k + 1); }}
        />
      </div>

      <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'center', marginTop: 16 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {VARIANTS.map((v) => (
            <button
              key={v.key}
              onClick={() => { setVariant(v.key); setShowWordmark(v.key === 'full'); setHoldMs(320); setRunKey((k) => k + 1); }}
              style={{ fontSize: 12, padding: '6px 12px', borderRadius: 7, cursor: 'pointer', background: variant === v.key ? '#3b82f6' : '#1c2742', color: '#e6edf6', border: '1px solid #2a3a5c' }}
            >
              {v.label}
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
          <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} /> auto-loop
        </label>
        <label style={{ ...ctrl, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={showWordmark} onChange={(e) => setShowWordmark(e.target.checked)} /> wordmark
        </label>
        <label style={{ ...ctrl, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={useTagline} onChange={(e) => setUseTagline(e.target.checked)} /> tagline
        </label>
      </div>

      <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
        <label style={ctrl}>
          mark size {markSize}px
          <input type="range" min={80} max={360} step={4} value={markSize} onChange={(e) => setMarkSize(Number(e.target.value))} />
        </label>
        <label style={ctrl}>
          hold {holdMs}ms
          <input type="range" min={0} max={2500} step={100} value={holdMs} onChange={(e) => setHoldMs(Number(e.target.value))} />
        </label>
        <label style={{ ...ctrl, minWidth: 280 }}>
          tagline text
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            style={{ background: '#1c2742', color: '#e6edf6', border: '1px solid #2a3a5c', borderRadius: 6, padding: '5px 8px' }}
          />
        </label>
      </div>
    </div>
  );
}
