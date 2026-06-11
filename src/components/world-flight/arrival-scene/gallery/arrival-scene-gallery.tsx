'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DestinationScene } from '@/lib/world-flight/types';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { DestinationArrivalScene } from '../destination-arrival-scene';
import { isAuthoredLandmark } from '../scene-registry';
import type { ArrivalPhase } from '../types';

interface GalleryItem {
  id: string;
  label: string;
  scene: DestinationScene;
  fixture?: boolean;
}

// Validation cities NOT in destinations.ts — gallery-local scene fixtures only
// Keep gallery-only fixtures here when validating scenes that are not yet real destinations.
const FIXTURES: GalleryItem[] = [];

const PHASES: ArrivalPhase[] = ['approach', 'touchdown', 'taxi', 'landed'];

export function ArrivalSceneGallery() {
  const items = useMemo<GalleryItem[]>(
    () => [
      ...WORLD_DESTINATIONS.map((d) => ({ id: d.id, label: d.city, scene: d.scene })),
      ...FIXTURES,
    ],
    [],
  );

  const [selectedId, setSelectedId] = useState(items[0].id);
  const [phase, setPhase] = useState<ArrivalPhase>('approach');
  const [progress, setProgress] = useState(0.6);

  // Seed state from the URL (?city=&phase=&progress=) after mount so a headless
  // screenshot can target any city/phase/progress. Done in an effect to avoid
  // a server/client hydration mismatch.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('city');
    const ph = params.get('phase') as ArrivalPhase | null;
    const pr = params.get('progress');
    if (c && items.some((i) => i.id === c)) setSelectedId(c);
    if (ph && PHASES.includes(ph)) setPhase(ph);
    if (pr != null && !Number.isNaN(Number(pr))) setProgress(Math.min(1, Math.max(0, Number(pr))));
  }, [items]);

  const selected = items.find((i) => i.id === selectedId) ?? items[0];

  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', color: '#e6edf6', padding: '24px 28px', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Arrival Scene Gallery</h1>
      <p style={{ margin: '0 0 20px', color: '#9fb0c7', fontSize: 13 }}>
        {items.length} scenes ({WORLD_DESTINATIONS.length} destinations + {FIXTURES.length} fixtures). Thumbnails are static;
        select a city to drive the animated preview through phases. Cities using the
        generic landmark fallback are tagged.
      </p>

      {/* Animated preview for the selected city */}
      <section style={{ marginBottom: 28, background: '#111a2e', borderRadius: 14, padding: 16, border: '1px solid #1f2c45' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <strong style={{ fontSize: 15 }}>{selected.label}</strong>
          <span style={{ fontSize: 12, color: '#9fb0c7' }}>
            {selected.scene.terrain} · {selected.scene.skyline} · {selected.scene.vegetation ?? 'none'} · {selected.scene.palette} · {selected.scene.landmarkSilhouette ?? '—'}
          </span>
          {!isAuthoredLandmark(selected.scene.landmarkSilhouette) && (
            <span style={{ fontSize: 11, color: '#ffce7a', border: '1px solid #5a4a1f', borderRadius: 6, padding: '1px 6px' }}>generic landmark</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* live, phase-driven */}
          <figure style={{ margin: 0, width: 560, maxWidth: '100%' }}>
            <div style={{ aspectRatio: '16 / 9', borderRadius: 10, overflow: 'hidden', border: '1px solid #1f2c45' }}>
              <DestinationArrivalScene destinationId={selected.id} scene={selected.scene} phase={phase} progress={progress} motion="animated" />
            </div>
            <figcaption style={{ fontSize: 12, color: '#9fb0c7', marginTop: 6 }}>animated · {phase} · progress {progress.toFixed(2)}</figcaption>
          </figure>

          {/* approach vs landed comparison */}
          <div style={{ display: 'flex', gap: 12 }}>
            {(['approach', 'landed'] as ArrivalPhase[]).map((ph) => (
              <figure key={ph} style={{ margin: 0, width: 270 }}>
                <div style={{ aspectRatio: '16 / 9', borderRadius: 10, overflow: 'hidden', border: '1px solid #1f2c45' }}>
                  <DestinationArrivalScene destinationId={selected.id} scene={selected.scene} phase={ph} progress={ph === 'approach' ? 0.5 : 1} motion="static" />
                </div>
                <figcaption style={{ fontSize: 12, color: '#9fb0c7', marginTop: 6 }}>{ph}</figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* controls */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {PHASES.map((ph) => (
              <button
                key={ph}
                onClick={() => setPhase(ph)}
                style={{
                  fontSize: 12, padding: '5px 12px', borderRadius: 7, cursor: 'pointer',
                  background: phase === ph ? '#3b82f6' : '#1c2742', color: '#e6edf6',
                  border: '1px solid #2a3a5c',
                }}
              >
                {ph}
              </button>
            ))}
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#9fb0c7' }}>
            progress
            <input type="range" min={0} max={1} step={0.01} value={progress} onChange={(e) => setProgress(Number(e.target.value))} />
          </label>
        </div>
      </section>

      {/* Static thumbnail matrix */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>
        {items.map((item) => {
          const generic = !isAuthoredLandmark(item.scene.landmarkSilhouette);
          return (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              style={{
                textAlign: 'left', padding: 0, cursor: 'pointer', background: 'transparent', border: 'none',
                outline: selectedId === item.id ? '2px solid #3b82f6' : 'none', borderRadius: 12,
              }}
            >
              <div style={{ aspectRatio: '16 / 9', borderRadius: 10, overflow: 'hidden', border: '1px solid #1f2c45', background: '#000' }}>
                <DestinationArrivalScene destinationId={item.id} scene={item.scene} phase="landed" progress={1} motion="static" />
              </div>
              <div style={{ padding: '6px 4px 2px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', gap: 6, alignItems: 'center' }}>
                  {item.label}
                  {item.fixture && <span style={{ fontSize: 10, color: '#7fd1c4' }}>fixture</span>}
                  {generic && <span style={{ fontSize: 10, color: '#ffce7a' }}>generic</span>}
                </div>
                <div style={{ fontSize: 11, color: '#7f8ea6' }}>
                  {item.scene.terrain} · {item.scene.skyline} · {item.scene.vegetation ?? 'none'} · {item.scene.palette}
                </div>
                <div style={{ fontSize: 11, color: '#7f8ea6' }}>landmark: {item.scene.landmarkSilhouette ?? '—'}</div>
              </div>
            </button>
          );
        })}
      </section>
    </div>
  );
}

export default ArrivalSceneGallery;
